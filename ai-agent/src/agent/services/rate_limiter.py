import redis.asyncio as redis
from datetime import datetime
from typing import Optional
import asyncio
import hashlib


class RedisRateLimiter:
    """
    Redis-based rate limiter that supports both sliding window (for RPM/RPD)
    and fixed window (for TPM) algorithms. Works across multiple distributed
    workers/instances.
    """

    def __init__(self, redis_url: str = "redis://langgraph-redis:6379"):
        """
        Initialize the rate limiter.

        Args:
            redis_url: Redis connection URL
        """
        self.redis_url = redis_url
        self._redis: Optional[redis.Redis] = None
        self._lua_script_check_and_increment_tokens = None

    async def _get_redis(self) -> redis.Redis:
        """Lazy initialization of Redis connection."""
        if self._redis is None:
            self._redis = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self._redis

    # --- Methods for Sliding Window (Requests Per Minute/Day) ---

    async def check_only(
            self,
            key: str,
            max_requests: int,
            window_seconds: int
    ) -> tuple[bool, int, int]:
        """
        Check if the request count limit would be exceeded WITHOUT incrementing.
        This uses the sliding window log algorithm.

        Returns:
            Tuple of (allowed, current_count, remaining)
        """
        r = await self._get_redis()
        now = datetime.now().timestamp()
        window_start = now - window_seconds

        pipe = r.pipeline()
        # Remove expired entries (timestamps outside the sliding window)
        pipe.zremrangebyscore(f"ratelimit:reqs:{key}", 0, window_start)
        # Get the current count of requests within the window
        pipe.zcard(f"ratelimit:reqs:{key}")
        results = await pipe.execute()

        current_count = results[1]
        allowed = current_count < max_requests
        remaining = max(0, max_requests - current_count)

        return allowed, current_count, remaining

    async def increment(self, key: str, window_seconds: int):
        """
        Increments the request counter for the sliding window.
        Should be called after a successful check_only.
        """
        r = await self._get_redis()
        now = datetime.now().timestamp()

        pipe = r.pipeline()
        # Add the current request's timestamp. The member can be anything unique.
        pipe.zadd(f"ratelimit:reqs:{key}", {str(now): now})
        # Set an expiry on the key for automatic cleanup of inactive users
        pipe.expire(f"ratelimit:reqs:{key}", window_seconds + 10)
        await pipe.execute()

    async def check_and_increment(
            self,
            key: str,
            max_requests: int,
            window_seconds: int
    ) -> tuple[bool, int, int]:
        """
        A convenient one-shot method that checks and increments for simple,
        single-limit scenarios.
        """
        allowed, current_count, _ = await self.check_only(
            key, max_requests, window_seconds
        )

        if allowed:
            await self.increment(key, window_seconds)
            current_count += 1

        remaining = max(0, max_requests - current_count)
        return allowed, current_count, remaining

    # --- Methods for Fixed Window (Tokens Per Minute) ---

    async def get_token_usage(self, key: str) -> int:
        """Gets the current token count for a fixed window."""
        r = await self._get_redis()
        current_tokens = await r.get(f"ratelimit:tokens:{key}")
        return int(current_tokens) if current_tokens else 0

    async def check_and_increment_tokens(
            self,
            key: str,
            tokens: int,
            max_tokens: int,
            window_seconds: int
    ) -> tuple[bool, int, int]:
        """
        Atomically checks and increments the token-based rate limit using a
        Lua script to prevent race conditions. This is the safest way to
        handle variable increments.

        Returns:
            Tuple of (allowed, current_tokens_after_op, remaining_tokens)
        """
        r = await self._get_redis()

        # Lazy load the Lua script
        if self._lua_script_check_and_increment_tokens is None:
            lua_script = """
            local key = KEYS[1]
            local increment_by = tonumber(ARGV[1])
            local limit = tonumber(ARGV[2])
            local ttl = tonumber(ARGV[3])

            local current = tonumber(redis.call('GET', key) or 0)

            if (current + increment_by) > limit then
                return {0, current} -- 0 indicates not allowed
            else
                local new_val = redis.call('INCRBY', key, increment_by)
                -- Set expiration only on the first increment in a window to be efficient
                if new_val == increment_by then
                    redis.call('EXPIRE', key, ttl)
                end
                return {1, new_val} -- 1 indicates allowed
            end
            """
            self._lua_script_check_and_increment_tokens = r.register_script(lua_script)

        full_key = f"ratelimit:tokens:{key}"
        result = await self._lua_script_check_and_increment_tokens(
            keys=[full_key],
            args=[tokens, max_tokens, window_seconds]
        )

        allowed = (result[0] == 1)
        current_tokens = result[1]
        remaining = max(0, max_tokens - current_tokens)

        return allowed, current_tokens, remaining

    async def reset(self, key: str):
        """Reset all rate limits for a specific key prefix."""
        r = await self._get_redis()
        # Use SCAN to be safe in production, but for simplicity:
        await r.delete(f"ratelimit:reqs:{key}")
        await r.delete(f"ratelimit:tokens:{key}")

    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str):
        super().__init__(message)


# ============================================================================
# USAGE LOGIC
# ============================================================================

def hash_api_key(api_key: str) -> str:
    """Hash API key for privacy (don't store raw keys in Redis)."""
    return hashlib.sha256(api_key.encode()).hexdigest()[:16]


class UserAPIKeyManager:
    """
    Manages user API keys and their associated rate limits.
    In production, this would query your database.
    """

    def __init__(self):
        # In production, this data comes from your database
        self.api_key_limits = {
            "a8e45a6c728d111a": {  # Hash of "sk-abc-123"
                "provider": "openai",
                "tier": "tier-3",
                "rpm": 500, "tpm": 90000, "rpd": 10000
            },
            "f2b1e7a5c3d4e8b9": {  # Hash of "sk-def-456"
                "provider": "anthropic",
                "tier": "tier-2",
                "rpm": 1000, "tpm": 80000, "rpd": 25000
            }
        }

    def get_limits(self, api_key_hash: str) -> dict:
        """Get rate limits for a specific API key."""
        return self.api_key_limits.get(api_key_hash, {
            "provider": "unknown", "rpm": 100, "tpm": 10000, "rpd": 1000
        })

    async def check_all_limits(
            self,
            api_key_hash: str,
            limiter: RedisRateLimiter,
            estimated_tokens: int
    ) -> tuple[bool, dict]:
        """
        Check all rate limits for an API key using a robust two-phase approach.

        Phase 1: Concurrently check all limits without incrementing.
        Phase 2: If all checks pass, atomically increment all limits.

        Returns (allowed, details)
        """
        limits = self.get_limits(api_key_hash)
        provider = limits.get("provider", "unknown")

        rpm_key = f"apikey:{api_key_hash}:{provider}:rpm"
        tpm_key = f"apikey:{api_key_hash}:{provider}:tpm"
        rpd_key = f"apikey:{api_key_hash}:{provider}:rpd"

        # --- PHASE 1: Perform all checks concurrently WITHOUT incrementing ---
        rpm_check_fut = limiter.check_only(rpm_key, limits['rpm'], 60)
        rpd_check_fut = limiter.check_only(rpd_key, limits['rpd'], 86400)
        tpm_usage_fut = limiter.get_token_usage(tpm_key)

        (rpm_allowed, rpm_current, _), (rpd_allowed, rpd_current, _), tpm_current = await asyncio.gather(
            rpm_check_fut, rpd_check_fut, tpm_usage_fut
        )

        tpm_allowed = (tpm_current + estimated_tokens) <= limits['tpm']
        all_allowed = rpm_allowed and tpm_allowed and rpd_allowed

        details = {
            "rpm": {"allowed": rpm_allowed, "current": rpm_current, "limit": limits['rpm']},
            "tpm": {"allowed": tpm_allowed, "current": tpm_current, "limit": limits['tpm']},
            "rpd": {"allowed": rpd_allowed, "current": rpd_current, "limit": limits['rpd']},
        }

        if not all_allowed:
            return False, details

        # --- PHASE 2: All checks passed, now atomically increment all counters ---
        # The token increment is the most critical; it checks and increments atomically.
        # If it fails due to a race condition, the whole operation is aborted.
        tpm_increment_ok, final_tpm, _ = await limiter.check_and_increment_tokens(
            tpm_key, estimated_tokens, limits['tpm'], 60
        )

        if not tpm_increment_ok:
            # Lost a race condition between Phase 1 and Phase 2. Abort.
            details['tpm']['allowed'] = False
            details['tpm']['current'] = final_tpm  # Update with the value that caused failure
            return False, details

        # TPM increment was successful, now commit the other increments.
        await asyncio.gather(
            limiter.increment(rpm_key, 60),
            limiter.increment(rpd_key, 86400)
        )

        # Update details with final successful values
        details['rpm']['current'] += 1
        details['tpm']['current'] = final_tpm
        details['rpd']['current'] += 1

        return True, details


# ============================================================================
# EXAMPLE RUNNER
# ============================================================================

async def example_complete_byok_flow(state):
    """Complete example with BYOK rate limiting."""
    limiter = RedisRateLimiter("redis://localhost:6379")
    key_manager = UserAPIKeyManager()

    try:
        user_api_key = state.get("user_api_key")
        api_key_hash = hash_api_key(user_api_key)

        print(f"\n--- Checking limits for API key hash: {api_key_hash} ---")

        allowed, details = await key_manager.check_all_limits(
            api_key_hash=api_key_hash,
            limiter=limiter,
            estimated_tokens=state.get("estimated_tokens", 1000)
        )

        if not allowed:
            failed_limits = [
                f"{k.upper()} limit exceeded ({v['current']}/{v['limit']})"
                for k, v in details.items() if not v['allowed']
            ]
            error_message = f"Rate limit exceeded for {api_key_hash}: {', '.join(failed_limits)}"
            raise RateLimitExceeded(error_message)

        print("✅ Rate limit OK. Proceeding with model call.")
        state["rate_limit_info"] = details
        # Mock model call
        # result = await model.ainvoke(state["messages"])

    finally:
        await limiter.close()

    return state


async def main():
    """Run a simulation."""
    # This key matches one in the UserAPIKeyManager
    test_api_key = "sk-abc-123"
    api_key_hash = hash_api_key(test_api_key)

    # Clean up before starting
    limiter = RedisRateLimiter("redis://localhost:6379")
    await limiter.reset(f"apikey:{api_key_hash}:openai:rpm")
    await limiter.reset(f"apikey:{api_key_hash}:openai:tpm")
    await limiter.reset(f"apikey:{api_key_hash}:openai:rpd")
    await limiter.close()

    # Simulate 3 requests
    for i in range(3):
        print(f"\n>>> Request {i + 1}")
        state = {
            "user_api_key": test_api_key,
            "estimated_tokens": 45000  # Use a large number to test TPM
        }
        try:
            result_state = await example_complete_byok_flow(state)
            print("Request successful. Final state details:")
            for k, v in result_state["rate_limit_info"].items():
                print(f"  {k.upper()}: {v['current']}/{v['limit']}")
        except RateLimitExceeded as e:
            print(f"💥 Request failed: {e}")
            break


if __name__ == "__main__":
    # Ensure you have a Redis instance running on redis://localhost:6379
    # You can start one with Docker: docker run -p 6379:6379 redis
    asyncio.run(main())
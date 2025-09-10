import subprocess
import sys
import os


def git_commit_push(repo_path, commit_message):
    """
    Stages all changes, commits with the given message, and pushes to remote in specified repository.

    Args:
        repo_path (str): Path to the Git repository
        commit_message (str): Commit message to use

    Returns:
        int: 0 on success, 1 on failure
    """
    # Validate repository path
    if not os.path.isdir(repo_path):
        print(f"❌ Error: Repository path '{repo_path}' does not exist or is not a directory")
        return 1

    # Check if it's a Git repository
    try:
        subprocess.run(
            ['git', 'rev-parse', '--is-inside-work-tree'],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True
        )
    except subprocess.CalledProcessError:
        print(f"❌ Error: '{repo_path}' is not a Git repository")
        return 1

    try:
        # Stage all changes
        add_result = subprocess.run(
            ['git', 'add', '.'],
            cwd=repo_path,
            capture_output=True,
            text=True
        )

        # Check for staged changes
        diff_result = subprocess.run(
            ['git', 'diff', '--cached', '--exit-code'],
            cwd=repo_path,
            capture_output=True,
            text=True
        )

        if diff_result.returncode == 0:
            print("ℹ️  No changes to commit. Repository is clean.")
            return 0
        elif diff_result.returncode not in [0, 1]:
            print(f"❌ Error checking staged changes: {diff_result.stderr}")
            return 1

        # Create commit
        commit_result = subprocess.run(
            ['git', 'commit', '-m', commit_message],
            cwd=repo_path,
            capture_output=True,
            text=True
        )

        if commit_result.returncode != 0:
            print(f"❌ Commit failed: {commit_result.stderr}")
            return 1

        # Push to remote
        push_result = subprocess.run(
            ['git', 'push'],
            cwd=repo_path,
            capture_output=True,
            text=True
        )

        if push_result.returncode != 0:
            # Handle common push errors
            if "upstream branch" in push_result.stderr:
                print("❌ Push failed: No upstream branch configured. Try:")
                print(f"   cd {repo_path} && git push -u origin $(git branch --show)")
                return 1
            print(f"❌ Push failed: {push_result.stderr}")
            return 1

        print(f"✅ Successfully committed and pushed changes from {repo_path}!")
        return 0

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return 1


if __name__ == "__main__":
    git_commit_push("/home/nnikolovskii/notes", "Pushing with git_tools")
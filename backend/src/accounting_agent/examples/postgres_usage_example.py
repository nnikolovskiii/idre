"""
Example usage of PostgreSQL database with dependency injection.
This file demonstrates how to use the PostgreSQL database connection
that you've set up in your application.
"""

from accounting_agent.container import container
from accounting_agent.models.chat import Chat
from accounting_agent.models.thread import Thread


def example_usage_with_dependency_injection():
    """
    Example showing how to use PostgreSQL with dependency injection.
    This is the recommended approach for your application.
    """
    # Get the PostgreSQL database instance from the container
    postgres_db = container.postgres_db()
    
    # Create tables if they don't exist
    postgres_db.create_tables()
    
    # Example 1: Using context manager (recommended)
    with postgres_db.get_session() as session:
        # Create a new thread
        new_thread = Thread()
        session.add(new_thread)
        session.flush()  # Flush to get the thread_id without committing
        
        # Create a new chat associated with that thread
        new_chat = Chat(user_id="user_123", thread_id=new_thread.thread_id)
        session.add(new_chat)
        # Session automatically commits when exiting the context manager
    
    print(f"Created new chat for thread: {new_thread.thread_id}")
    
    # Example 2: Query for the chat
    with postgres_db.get_session() as session:
        retrieved_chat = session.query(Chat).filter(Chat.user_id == "user_123").first()
        if retrieved_chat:
            print(f"Retrieved chat: {retrieved_chat}")
            print(f"Associated thread ID: {retrieved_chat.thread.thread_id}")


def example_usage_in_service_class():
    """
    Example showing how to use PostgreSQL in a service class.
    This is how you would typically structure it in your services.
    """
    
    class ChatService:
        def __init__(self, postgres_db):
            self.postgres_db = postgres_db
        
        def create_chat_with_thread(self, user_id: str) -> Chat:
            with self.postgres_db.get_session() as session:
                # Create a new thread
                new_thread = Thread()
                session.add(new_thread)
                session.flush()  # Get the ID without committing
                
                # Create a new chat
                new_chat = Chat(user_id=user_id, thread_id=new_thread.thread_id)
                session.add(new_chat)
                session.flush()  # Get the chat ID
                
                return new_chat
        
        def get_user_chats(self, user_id: str) -> list[Chat]:
            with self.postgres_db.get_session() as session:
                return session.query(Chat).filter(Chat.user_id == user_id).all()
        
        def get_chat_with_thread(self, chat_id: str) -> Chat:
            with self.postgres_db.get_session() as session:
                return session.query(Chat).filter(Chat.chat_id == chat_id).first()
    
    # Usage
    postgres_db = container.postgres_db()
    chat_service = ChatService(postgres_db)
    
    # Create a chat
    new_chat = chat_service.create_chat_with_thread("user_456")
    print(f"Created chat: {new_chat.chat_id}")
    
    # Get user's chats
    user_chats = chat_service.get_user_chats("user_456")
    print(f"User has {len(user_chats)} chats")


def example_usage_in_fastapi_route():
    """
    Example showing how to use PostgreSQL in FastAPI routes.
    """
    from fastapi import Depends
    from dependency_injector.wiring import inject, Provide
    
    # This is how you would structure a FastAPI route
    @inject
    async def create_chat_endpoint(
        user_id: str,
        postgres_db = Depends(Provide[container.postgres_db])
    ):
        with postgres_db.get_session() as session:
            # Create a new thread
            new_thread = Thread()
            session.add(new_thread)
            session.flush()
            
            # Create a new chat
            new_chat = Chat(user_id=user_id, thread_id=new_thread.thread_id)
            session.add(new_chat)
            session.flush()
            
            return {
                "chat_id": str(new_chat.chat_id),
                "thread_id": str(new_thread.thread_id),
                "user_id": user_id
            }
    
    print("FastAPI route example defined (see function above)")


if __name__ == "__main__":
    # Run the examples
    print("=== Example 1: Basic usage with dependency injection ===")
    example_usage_with_dependency_injection()
    
    print("\n=== Example 2: Service class usage ===")
    example_usage_in_service_class()
    
    print("\n=== Example 3: FastAPI route usage ===")
    example_usage_in_fastapi_route()

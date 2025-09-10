import re
import os
import uuid
from datetime import datetime


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by replacing spaces and special characters.
    
    Args:
        filename: The original filename
        
    Returns:
        A sanitized filename safe for use in URLs and file systems
    """
    if not filename:
        return "unnamed_file"
    
    # Split filename and extension
    name, ext = os.path.splitext(filename)
    
    # Replace spaces with underscores
    name = name.replace(' ', '_')
    
    # Remove or replace other problematic characters
    # Keep only alphanumeric, underscore, hyphen, and dot
    name = re.sub(r'[^\w\-_]', '', name)
    
    # Ensure the name isn't empty after sanitization
    if not name:
        name = "file"
    
    return f"{name}{ext}"


def ensure_unique_filename(base_filename: str, existing_filenames: set = None) -> str:
    """
    Ensure a filename is unique by appending a counter if necessary.
    
    Args:
        base_filename: The base filename to make unique
        existing_filenames: Set of existing filenames to check against
        
    Returns:
        A unique filename
    """
    if existing_filenames is None:
        existing_filenames = set()
    
    if base_filename not in existing_filenames:
        return base_filename
    
    # Split filename and extension
    name, ext = os.path.splitext(base_filename)
    
    counter = 1
    while f"{name}_{counter}{ext}" in existing_filenames:
        counter += 1
    
    return f"{name}_{counter}{ext}"


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate a unique filename by adding timestamp and UUID.
    
    Args:
        original_filename: The original filename
        
    Returns:
        A unique filename with timestamp and UUID
    """
    if not original_filename:
        original_filename = "file"
    
    # Split filename and extension
    name, ext = os.path.splitext(original_filename)
    
    # Sanitize the base name
    name = sanitize_filename(name)
    
    # Generate unique identifier
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    
    # Create unique filename
    unique_filename = f"{name}_{timestamp}_{unique_id}{ext}"
    
    return unique_filename


async def get_existing_filenames_for_user(user_id: str, mdb) -> set:
    """
    Get all existing filenames for a user to ensure uniqueness.
    
    Args:
        user_id: The user ID
        mdb: MongoDB database instance
        
    Returns:
        Set of existing filenames for the user
    """
    from accounting_agent.models.file import File
    
    files = await mdb.get_entries(
        class_type=File,
        doc_filter={"user_id": user_id}
    )
    
    return {file.filename for file in files}

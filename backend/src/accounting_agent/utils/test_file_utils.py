import pytest
from accounting_agent.utils.file_utils import sanitize_filename, ensure_unique_filename


def test_sanitize_filename():
    """Test filename sanitization with various inputs."""
    
    # Test basic space replacement
    assert sanitize_filename("my file.txt") == "my_file.txt"
    assert sanitize_filename("document with spaces.pdf") == "document_with_spaces.pdf"
    
    # Test multiple spaces
    assert sanitize_filename("file  with  many  spaces.doc") == "file_with_many_spaces.doc"
    
    # Test special characters removal
    assert sanitize_filename("file@name#with$special%chars.txt") == "filenamewithspecialchars.txt"
    
    # Test edge cases
    assert sanitize_filename("") == "unnamed_file"
    assert sanitize_filename("   ") == "file"
    assert sanitize_filename("file") == "file"
    assert sanitize_filename("file.txt") == "file.txt"
    
    # Test with dots in filename
    assert sanitize_filename("my.file.name.txt") == "myfilename.txt"
    
    # Test with hyphens and underscores (should be preserved)
    assert sanitize_filename("my-file_name.txt") == "my-file_name.txt"
    
    # Test unicode characters (should be removed)
    assert sanitize_filename("café résumé.txt") == "caf_rsum.txt"
    
    # Test file with no extension
    assert sanitize_filename("myfile") == "myfile"
    assert sanitize_filename("my file") == "my_file"


def test_ensure_unique_filename():
    """Test unique filename generation."""
    
    existing = {"file.txt", "file_1.txt", "document.pdf"}
    
    # Test no conflict
    assert ensure_unique_filename("newfile.txt", existing) == "newfile.txt"
    
    # Test conflict resolution
    assert ensure_unique_filename("file.txt", existing) == "file_2.txt"
    assert ensure_unique_filename("document.pdf", existing) == "document_1.pdf"
    
    # Test empty set
    assert ensure_unique_filename("test.txt", set()) == "test.txt"
    
    # Test with None
    assert ensure_unique_filename("test.txt") == "test.txt"


if __name__ == "__main__":
    test_sanitize_filename()
    test_ensure_unique_filename()
    print("All tests passed!")

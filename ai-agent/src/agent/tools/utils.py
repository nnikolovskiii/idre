import markdown
from bs4 import BeautifulSoup

def remove_markdown(markdown_text):
    # Convert markdown to HTML
    html = markdown.markdown(markdown_text)
    # Parse HTML and extract text
    soup = BeautifulSoup(html, 'html.parser')
    return soup.get_text()
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from queue import Queue
from urllib.parse import urlparse, urljoin
import sqlite3

allowed_domains_suffix = 'flare.network'

def is_allowed(url):
    parsed = urlparse(url)
    return parsed.netloc.endswith(allowed_domains_suffix) and not parsed.path.endswith(('.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.pdf'))

def create_database():
    db = sqlite3.connect('flare_knowledge_base.db')
    with db as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS pages
                        (id INTEGER PRIMARY KEY, url TEXT UNIQUE, title TEXT, content TEXT, crawled_at TEXT)''')
        conn.execute('''CREATE VIRTUAL TABLE pages_fts USING fts5(url, title, content)''')
    return db

def insert_into_database(db, url, title, content):
    crawled_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db as conn:
        conn.execute("INSERT INTO pages (url, title, content, crawled_at) VALUES (?, ?, ?, ?)", (url, title, content, crawled_at))
        conn.execute("INSERT INTO pages_fts (url, title, content) VALUES (?, ?, ?)", (url, title, content))

def crawl_page(url):
    try:
        response = requests.get(url)
        if response.status_code != 200:
            return
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.title.string if soup.title else ''
        content = ' '.join(s.strip() for s in soup.stripped_strings)
        insert_into_database(db, url, title, content)
        for link in soup.find_all('a'):
            href = link.get('href')
            if not href:
                continue
            full_url = urljoin(url, href)
            if is_allowed(full_url) and full_url not in crawled_urls:
                queue.put(full_url)
                crawled_urls.add(full_url)
    except Exception as e:
        print(f"Error crawling {url}: {e}")

if __name__ == "__main__":
    db = create_database()
    
    queue = Queue()
    crawled_urls = set()
    
    start_url = 'https://flare.network/'
    queue.put(start_url)
    crawled_urls.add(start_url)
    
    while not queue.empty():
        url = queue.get()
        crawl_page(url)
    db.close()
    
    query = input("Enter your search query: ")
    with sqlite3.connect('flare_knowledge_base.db') as conn:
        cursor = conn.execute("SELECT url, title FROM pages_fts WHERE content MATCH ?", (query, ))
        results = cursor.fetchall()
        for result in results:
            print(f"URL: {result[0]}, Title: {result[1]}")
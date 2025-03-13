import requests
from bs4 import BeautifulSoup
import sqlite3
from queue import Queue
from urllib.parse import urlparse, urljoin
import time
import base64

allowed_domains = {'flare.network', 'docs.flare.network', 'dev.flare.network'}

def is_allowed(url):
    parsed = urlparse(url)
    return parsed.netloc in allowed_domains and not parsed.path.endswith(('.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.pdf'))

def create_database():
    db = sqlite3.connect('flare_knowledge_base.db')
    with db as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS web_pages
                        (id INTEGER PRIMARY KEY, source TEXT, url TEXT UNIQUE, title TEXT, content TEXT)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS github_repos
                        (id INTEGER PRIMARY KEY, name TEXT, description TEXT, readme_content TEXT)''')
    return db

def insert_web_page(db, source, url, title, content):
    with db as conn:
        conn.execute("INSERT INTO web_pages (source, url, title, content) VALUES (?, ?, ?, ?)", (source, url, title, content))

def insert_github_repo(db, name, description, readme_content):
    with db as conn:
        conn.execute("INSERT INTO github_repos (name, description, readme_content) VALUES (?, ?, ?)", (name, description, readme_content))

def crawl_page(url, source, db, crawled_urls, queue):
    try:
        response = requests.get(url)
        if response.status_code != 200:
            return
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.title.string if soup.title else ''
        content = ' '.join(s.strip() for s in soup.stripped_strings)
        insert_web_page(db, source, url, title, content)
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

def scrape_main_website(db):
    start_url = 'https://flare.network/'
    queue = Queue()
    crawled_urls = set()
    queue.put(start_url)
    crawled_urls.add(start_url)
    while not queue.empty():
        url = queue.get()
        crawl_page(url, 'main_website', db, crawled_urls, queue)

def scrape_documentation(db):
    start_url = 'https://docs.flare.network/'
    queue = Queue()
    crawled_urls = set()
    queue.put(start_url)
    crawled_urls.add(start_url)
    while not queue.empty():
        url = queue.get()
        crawl_page(url, 'documentation', db, crawled_urls, queue)

def scrape_developer_hub(db):
    start_url = 'https://dev.flare.network/'
    queue = Queue()
    crawled_urls = set()
    queue.put(start_url)
    crawled_urls.add(start_url)
    while not queue.empty():
        url = queue.get()
        crawl_page(url, 'developer_hub', db, crawled_urls, queue)

def scrape_github_repositories(db):
    repos = [
        'flare-smart-contracts-v2',
        'developer-hub',
        'flare-hardhat-starter',
        'flare-systems',
        'go-flare'
    ]
    for repo in repos:
        url = f"https://api.github.com/repos/flare-foundation/{repo}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            name = data.get('name', 'Unknown')
            description = data.get('description', 'No description')
            readme_url = f"https://api.github.com/repos/flare-foundation/{repo}/readme"
            readme_response = requests.get(readme_url)
            if readme_response.status_code == 200:
                readme_data = readme_response.json()
                if 'content' in readme_data:
                    readme_content = base64.b64decode(readme_data['content']).decode('utf-8', errors='ignore')
                else:
                    readme_content = "No README found"
            else:
                readme_content = "Failed to fetch README"
            insert_github_repo(db, name, description, readme_content)
        else:
            print(f"Failed to fetch {repo}")
        time.sleep(1)  # Respect GitHub API rate limits

if __name__ == "__main__":
    db = create_database()
    
    print("Scraping main website...")
    scrape_main_website(db)
    
    print("Scraping documentation...")
    scrape_documentation(db)
    
    print("Scraping developer hub...")
    scrape_developer_hub(db)
    
    print("Scraping GitHub repositories...")
    scrape_github_repositories(db)
    
    db.close()
    print("Scraping complete!")
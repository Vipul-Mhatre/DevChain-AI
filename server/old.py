import requests
from bs4 import BeautifulSoup
import json
import time
import base64

def scrape_url(url):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch {url} - Status code: {response.status_code}")
            return None
        soup = BeautifulSoup(response.text, 'html.parser')
        content_div = soup.find('div', class_='content')  
        if content_div:
            content = content_div.get_text(separator=' ', strip=True)
        else:
            content = soup.get_text(separator=' ', strip=True)
        return {"url": url, "content": content}
    except requests.RequestException as e:
        print(f"Error scraping {url}: {e}")
        return None
    
def scrape_main_website():
    url = "https://flare.network"
    data = scrape_url(url)
    return [data] if data else []

def scrape_documentation():
    urls = [
        "https://docs.flare.network",
        "https://docs.flare.network/tech/flare",
        "https://docs.flare.network/infra/validation/deploying/",
        "https://docs.flare.network/infra/observation/deploying/"
    ]
    data = []
    for url in urls:
        page_data = scrape_url(url)
        if page_data:
            data.append(page_data)
        time.sleep(0.5)  
    return data

def scrape_developer_hub():
    urls = [
        "https://dev.flare.network",
        "https://dev.flare.network/fassets/overview",
        "https://dev.flare.network/intro"
    ]
    data = []
    for url in urls:
        page_data = scrape_url(url)
        if page_data:
            data.append(page_data)
        time.sleep(0.5) 
    return data

def scrape_github_repositories():
    base_url = "https://api.github.com/orgs/flare-foundation/repos"
    try:
        response = requests.get(base_url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch GitHub repos - Status code: {response.status_code}")
            return []
        repos = response.json()
        if not isinstance(repos, list):
            print("Unexpected response format from GitHub API")
            return []
        
        repository_data = []
        for repo in repos:
            repo_name = repo.get('name', 'Unknown')
            repo_description = repo.get('description', '')
            readme_url = f"https://api.github.com/repos/flare-foundation/{repo_name}/readme"
            readme_response = requests.get(readme_url, timeout=10)
            readme_text = ""
            if readme_response.status_code == 200:
                readme_data = readme_response.json()
                if 'content' in readme_data:
                    readme_text = base64.b64decode(readme_data['content']).decode('utf-8', errors='ignore')
            else:
                print(f"Failed to fetch README for {repo_name}")
            
            repository_data.append({
                "name": repo_name,
                "description": repo_description,
                "readme": readme_text
            })
            time.sleep(1) 
        return repository_data
    except requests.RequestException as e:
        print(f"Error scraping GitHub repositories: {e}")
        return []

def store_data(data, filename):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        print(f"Data saved to {filename}")
    except Exception as e:
        print(f"Error saving data to {filename}: {e}")

if __name__ == "__main__":
    print("Starting data scraping process...")

    print("Scraping main website...")
    main_website_data = scrape_main_website()
    store_data(main_website_data, "main_website.json")

    print("Scraping documentation...")
    documentation_data = scrape_documentation()
    store_data(documentation_data, "documentation.json")

    print("Scraping developer hub...")
    developer_hub_data = scrape_developer_hub()
    store_data(developer_hub_data, "developer_hub.json")

    print("Scraping GitHub repositories...")
    github_repositories_data = scrape_github_repositories()
    store_data(github_repositories_data, "github_repositories.json")

    print("Scraping complete!")
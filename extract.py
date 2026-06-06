import json
from bs4 import BeautifulSoup

with open('research.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
lists = soup.find_all('ul', class_='paper-list')

data = []
for i, ul in enumerate(lists[:3]):
    for li in ul.find_all('li', recursive=False):
        text = li.get_text().strip()
        data.append({"section": i, "text": text})

with open('extracted.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
print("Done")

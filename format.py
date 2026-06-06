import re
from bs4 import BeautifulSoup

with open('research.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

lists = soup.find_all('ul', class_='paper-list')

# lists[0] is Published papers
# lists[1] is Submitted
# lists[2] is Unpublished
# lists[3] is Slides
# lists[4] is Upcoming Talks
# lists[5] is Completed Talks

def format_paper_li(li):
    # Extract details and links
    details = li.find('details')
    if details:
        details.extract()
        
    links = li.find_all('a')
    links_html = []
    for a in links:
        links_html.append(str(a))
        a.extract()
        
    text = li.get_text().strip()
    
    # Try to parse text: "Number. Authors, Title, Journal"
    # The number is at the start
    match = re.match(r'^(\d+)\.\s*(.*)', text, re.DOTALL)
    if not match:
        return None
        
    number = match.group(1)
    rest = match.group(2)
    
    # Let's try to identify the title. Titles are usually before the journal and after authors.
    # We can split by period or comma, but it's tricky.
    # Let's just output the text with a generic structure if we can't parse perfectly,
    # or just wrap the whole thing nicely.
    
    # Actually, let's use a heuristic:
    # 1. Authors: from start until first period, OR if there's no period, until the title.
    # Let's look for known author patterns: "Sang-hyun Kim", "Thomas Koberda", etc.
    
    # Since it's too complex to parse perfectly with regex, we will just format the parts we know (Number, links, details).
    return None

# Instead of complex parsing, let's just make sure all links are grouped in <div class="paper-links">
# and the text is wrapped in a <span class="paper-text">. This alone will look much nicer!
for ul in lists[:3]: # First 3 lists: Published, Submitted, Unpublished
    for li in ul.find_all('li', recursive=False):
        details = li.find('details')
        if details:
            details.extract()
            
        links = li.find_all('a')
        for a in links:
            a.extract()
            
        text = li.get_text().strip()
        
        # Clear the li
        li.clear()
        
        # Add text span
        text_span = soup.new_tag('span')
        text_span['class'] = 'paper-text'
        # To make it look nice, let's try to bold the title if we can. 
        # But for now just simple text.
        text_span.string = text
        li.append(text_span)
        
        # Add links div
        if links:
            links_div = soup.new_tag('div')
            links_div['class'] = 'paper-links'
            for a in links:
                links_div.append(a)
                links_div.append(" ") # space between links
            li.append(links_div)
            
        # Add details back
        if details:
            li.append(details)

with open('research_beautified.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
print("Wrote research_beautified.html")

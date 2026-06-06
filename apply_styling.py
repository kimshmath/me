import re
from bs4 import BeautifulSoup

with open('research.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
lists = soup.find_all('ul', class_='paper-list')

def parse_text(text, section):
    text = text.strip()
    # Remove trailing periods before the links
    if text.endswith('.'):
        text = text[:-1].strip()
        
    num = ""
    m = re.match(r'^(\d+)\.\s*(.*)', text)
    if m:
        num = m.group(1) + ". "
        text = m.group(2)
    elif text.startswith('(With '):
        num = ""
    else:
        # For some items that might not have a number
        pass

    authors = ""
    title = ""
    journal = ""

    if section == 1: # Submitted
        # Usually just "Title (Year)"
        # e.g., "7. TBA on Samurai (2026)"
        # or "4. Semi-Autonomous Mathematics Discovery with Gemini: A Case Study on the Erdős Problems (2026)"
        title = text
        # If there's an author (like "Sang-hyun Kim. Algebraic..."), split it
        parts = text.split('. ')
        if len(parts) >= 2 and 'Kim' in parts[0]:
            authors = parts[0]
            title = '. '.join(parts[1:])
    elif section == 2: # Unpublished
        if text.startswith('(With '):
            parts = text.split('), ')
            if len(parts) >= 2:
                authors = parts[0] + ')'
                title = parts[1]
        else:
            parts = text.split(': ')
            title = parts[0]
            if len(parts) > 1:
                journal = parts[1]
    else:
        # Published
        # Let's try splitting by period first
        parts = re.split(r'\.(?!\s*\[)(?!\s*M)(?!\s*S)(?!\s*Jr)', text)
        parts = [p.strip() for p in parts if p.strip()]
        
        if len(parts) >= 3:
            authors = parts[0]
            title = parts[1]
            journal = '. '.join(parts[2:])
        elif len(parts) == 2:
            authors = parts[0]
            title = parts[1]
        else:
            # Maybe comma separated?
            # 35. Inhyeok Choi, Sang-hyun Kim, Smoothing countable group actions..., to appear in...
            # 34. Sang-hyun Kim, Nicolás Matte Bon, Mikael de la Salle and Michele Triestino, Subexponential growth...
            c_parts = [p.strip() for p in text.split(', ')]
            if len(c_parts) >= 3:
                # Find the title part. Authors end at the last author. 
                # For 35: Inhyeok Choi, Sang-hyun Kim, Title, Journal
                if 'Kim' in c_parts[1]:
                    authors = ', '.join(c_parts[:2])
                    title = c_parts[2]
                    journal = ', '.join(c_parts[3:])
                elif len(c_parts) >= 4 and 'Triestino' in c_parts[0]:
                    authors = c_parts[0]
                    title = c_parts[1]
                    journal = ', '.join(c_parts[2:])
                else:
                    # Generic comma split
                    authors = c_parts[0]
                    title = c_parts[1]
                    journal = ', '.join(c_parts[2:])
            else:
                title = text
                
        # Fix specific cases where author split went wrong
        if "Subexponential growth" in text:
            authors = "Sang-hyun Kim, Nicolás Matte Bon, Mikael de la Salle and Michele Triestino"
            title = "Subexponential growth and C1 actions on one-manifolds"
            journal = "International Mathematics Research Notices, Volume 2025, Issue 13, July 2025, rnaf202"
        elif "Smoothing countable" in text:
            authors = "Inhyeok Choi, Sang-hyun Kim"
            title = "Smoothing countable group actions on metrizable spaces"
            journal = "to appear in Advanced Studies in Pure Mathematics"
        elif "Linear network" in text:
            authors = "Chan-Byoung Chae, Sang-hyun Kim and Robert W. Heath Jr."
            title = "Linear network coordinated beamforming for cell-boundary users"
            journal = "Proc. of IEEE Workshop on Signal Processing Advances in Wireless Communications (SPAWC) (2009)"
        elif "Network coordinated beamforming" in text:
            authors = "Chan-Byoung Chae, Sang-hyun Kim and Robert W. Heath Jr."
            title = "Network coordinated beamforming for cell-boundary users: linear and non-linear approaches"
            journal = "IEEE Journal of Selected Topics in Signal Processing (J-STSP), vol. 3, no. 6 (2009) 1094--1105"

    # Make title nice (capitalize first letter, etc. but let's just keep original)
    if title.endswith(','): title = title[:-1]
    if authors.endswith(','): authors = authors[:-1]
    if journal.endswith(','): journal = journal[:-1]

    return num, authors, title, journal

for i, ul in enumerate(lists[:3]):
    for li in ul.find_all('li', recursive=False):
        details = li.find('details')
        if details:
            details.extract()
            
        links = li.find_all('a')
        for a in links:
            a.extract()
            
        text = li.get_text().strip()
        num, authors, title, journal = parse_text(text, i)
        
        li.clear()
        
        # Build structure
        if num or title:
            span_title = soup.new_tag('span', **{'class': 'paper-title'})
            span_title.string = f"{num}{title}"
            li.append(span_title)
            
        if authors:
            span_authors = soup.new_tag('span', **{'class': 'paper-authors'})
            span_authors.string = authors if authors.startswith('(') else f"({authors})"
            li.append(span_authors)
            
        if journal:
            span_journal = soup.new_tag('span', **{'class': 'paper-journal'})
            span_journal.string = journal
            li.append(span_journal)
            
        if links:
            div_links = soup.new_tag('div', **{'class': 'paper-links'})
            for idx, a in enumerate(links):
                # Standardize link text
                t = a.get_text()
                t = t.replace('[journal]', '[Journal]').replace('[pdf]', '[PDF]').replace('[arxiv]', '[arXiv]').replace('[ArXiv]', '[arXiv]')
                a.string = t
                div_links.append(a)
                if idx < len(links) - 1:
                    div_links.append(" ")
            li.append(div_links)
            
        if details:
            # Let's ensure the details styling is perfect
            details['style'] = "margin-top: 1rem; display: block;"
            summary = details.find('summary')
            if summary:
                summary['style'] = "cursor:pointer; font-weight:600; font-size: 0.95rem; color: var(--accent); padding: 0.25rem 0; list-style: none;"
                if '▶' not in summary.get_text():
                    summary.string = "▶ " + summary.get_text().strip()
            p = details.find('p')
            if p:
                p['style'] = "margin-top: 1rem; font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; background: rgba(0,0,0,0.2); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent);"
            li.append(details)

with open('research.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
print("Finished rewriting research.html")

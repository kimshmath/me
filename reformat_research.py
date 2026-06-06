import re

with open('research.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the duplicate 34 numbering
html = html.replace('<li>34. Inhyeok Choi', '<li>35. Inhyeok Choi')

# Let's standardize the links
html = html.replace('[journal]', '[Journal]')
html = html.replace('[pdf]', '[PDF]')
html = html.replace('[arxiv]', '[arXiv]')
html = html.replace('[ArXiv]', '[arXiv]')

# We want to format the list items in the Published papers section to use paper-title, paper-authors, paper-journal.
# But it is hard to parse exactly. Instead, let's inject a CSS rule that styles the list items better, or reformat them simply.
# Let's look at how we can do it robustly.

# Actually, we can use a regex to wrap the title/authors if we can find the pattern.
# Pattern: <li>(Number)\. (Authors)[,\.] (Title)[,\.] (Journal/Conference) <a href...
# This is too complex.

# Let's just fix the glaring inconsistencies:
# 1. Numbering (34 -> 35 for the first one)
# 2. Consistent link brackets: [arXiv], [Journal], [PDF], [Link]
# 3. details tag styling for Abstracts to match index.html

details_style = 'style="margin-top: 1rem;"'
summary_style = 'style="cursor:pointer; font-weight:600; font-size: 0.95rem; color: var(--accent); padding: 0.25rem 0; list-style: none;"'
p_style = 'style="margin-top: 1rem; font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; background: rgba(0,0,0,0.2); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent);"'

# Standardize details
html = re.sub(r'<details[^>]*>', f'<details {details_style}>', html)
html = re.sub(r'<summary[^>]*>\s*(?:▶\s*)?Abstract\s*</summary>', f'<summary {summary_style}>▶ Abstract</summary>', html)
# For the p tag inside details
html = re.sub(r'(<summary[^>]*>.*?</summary>)\s*<p[^>]*>', r'\1\n<p ' + p_style + '>', html)

with open('research.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated research.html using regex.")

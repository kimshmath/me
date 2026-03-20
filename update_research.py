import re

def clean_talk(talk):
    return re.sub(r'^\d+\.', '', talk).strip()

def main():
    with open('cv_old.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    talks = []
    in_talks = False
    current_talk = ""

    for line in lines:
        line = line.strip()
        if "Sang-hyun Kim: C.V . Page" in line:
            continue
        if line == "Talks":
            in_talks = True
            continue
            
        if in_talks:
            if not line:
                continue
            match = re.match(r'^(\d+)\.', line)
            if match:
                if current_talk:
                    talks.append(clean_talk(current_talk))
                current_talk = line
            else:
                current_talk += " " + line
    if current_talk:
        talks.append(clean_talk(current_talk))
        
    print(f"Extracted {len(talks)} completed talks.")
    
    html_list = "<div class='card'>\n                <h3>Complete Talks</h3>\n                <details>\n                <summary style='cursor:pointer; font-weight:600; color: var(--accent); padding: 0.5rem 0; list-style: none;'>▶ Click to expand all " + str(len(talks)) + " completed talks</summary>\n                <ul class='paper-list' style='margin-top: 1rem;'>\n"
    for t in talks:
        t = t.replace("<", "&lt;").replace(">", "&gt;")
        html_list += f"                    <li>{t}</li>\n"
    html_list += "                </ul>\n                </details>\n            </div>"

    with open('research.html', 'r', encoding='utf-8') as f:
        html = f.read()

    start_tag = r'<div class="card">\s*<h3>Complete \(Selected\)</h3>'
    end_tag = r'</ul>\s*</div>'
    
    new_html = re.sub(start_tag + r'.*?' + end_tag, html_list, html, flags=re.DOTALL)
    
    with open('research.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
        
    print("Done writing research.html")

if __name__ == "__main__":
    main()

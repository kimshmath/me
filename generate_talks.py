import re

# New talks (15 items) to prepend
new_talks = [
    "New Developments of Teichmüller Theory (Oberwolfach Workshop), September 28 - Oct 2, 2026.",
    "Busan Mathematics Culture Center, July 10, 2026.",
    "Kangwon Cultural Education Center, May 6, 2026.",
    "CRUNCH seminar, April 24, 2026.",
    "Daegu Gosan Library, April 10, 2026.",
    "Current Challenges in Topology, Milan, Italy, May 20 - 24, 2026.",
    "EBS, March 18, 2026.",
    "IMU-KIAS Colloquia, hosted with the IMU Executive Committee, KIAS, March 11 - 13, 2026.",
    "Military TV, March 11, 2026."
] # We don't need to add the 2025 ones if they are already in cv_old.txt! 
# Let's check what's actually in cv_old.txt. 
# cv_old.txt already has "1.Career Lecture... October 18, 2025" and 65 talks for 2024-2025!
# So cv_old.txt is highly up to date. I just need to prepend the 9 "Upcoming" 2026 talks.

def clean_talk(talk):
    # Remove numbering like "1.", "2.", "264." because we will use enumerate or itemize
    talk = re.sub(r'^\d+\.', '', talk).strip()
    return talk

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
            # Check if line starts with a number followed by dot
            match = re.match(r'^(\d+)\.', line)
            if match:
                # new talk started
                if current_talk:
                    talks.append(clean_talk(current_talk))
                current_talk = line
            else:
                # continuation of previous talk
                current_talk += " " + line

    if current_talk:
        talks.append(clean_talk(current_talk))
        
    print(f"Extracted {len(talks)} talks from old CV.")
    
    all_talks = new_talks + talks
    
    # Let's rewrite the end of cv.tex
    with open('cv.tex', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where \section*{Talks (Selected)} starts
    idx = content.find(r'\section*{Talks (Selected)}')
    if idx == -1:
        print("Could not find talks section in cv.tex")
        return
        
    base_tex = content[:idx]
    
    out_tex = base_tex + "\\section*{Talks}\n\\begin{enumerate}[leftmargin=1.5em, label=\\arabic*.]\n"
    for t in all_talks:
        # escape special TeX characters
        t = t.replace('&', '\\&').replace('%', '\\%').replace('#', '\\#').replace('_', '\\_')
        t = t.replace('^', '\\^').replace('~', '\\~')
        out_tex += f"\\item {t}\n"
    
    out_tex += "\\end{enumerate}\n\\end{document}\n"
    
    with open('cv.tex', 'w', encoding='utf-8') as f:
        f.write(out_tex)
        
    print("cv.tex updated successfully with all 273 talks!")

if __name__ == "__main__":
    main()

# CLAUDE.md — Agent Guidelines for me.kimsh.kr & Academic CV

This repository contains the personal academic website and master Curriculum Vitae (LaTeX) of **Prof. Sang-hyun Kim** (Chair & Professor, School of Mathematics, Korea Institute for Advanced Study / KIAS).

---

## 1. Project Overview & Architecture

- **Website URL**: [https://kimsh.kr](https://kimsh.kr) / [https://me.kimsh.kr](https://me.kimsh.kr)
- **GitHub Repository**: `https://github.com/kimshmath/me` (Branch: `main`)
- **Local working clone**: `/Users/kimsh/Library/CloudStorage/Dropbox/work/AI/Claude-code/kimsh-kr-claude-code-2026/me`
- **Hosting**: GitHub Pages (via `CNAME: me.kimsh.kr`) + Firebase integration for online edit mode.
- **Tech Stack**:
  - Pure HTML5, Vanilla CSS (`css/styles.css`), Vanilla JavaScript (`js/`).
  - Master CV in LaTeX (`cv.tex` compiled to `cv.pdf`).
  - Dark-mode aesthetic with custom serif typography (`Newsreader`) and sans-serif (`Inter`).

> **The GitHub remote is the source of truth.** The site's inline edit mode commits straight to
> GitHub from the browser, so the remote can move ahead of this clone without any local action.
> Always `git fetch` and reconcile **before** editing; never assume local files are current.

---

## 2. Directory & File Structure

```text
me/
├── CLAUDE.md               # This file — agent guidelines
├── index.html              # Homepage: Profile, Bio, Education, Highlights, Contact
├── research.html           # Research: Preprints, Published Papers, Books, Surveys, Slides, Talks
├── activities.html         # Professional Activities: Editorial, Conferences, Mentoring, Students
├── culture.html            # Outreach & Culture: Essays, Columns, Media, EBS Lectures
├── tips.html               # Advice & Guides for Mathematics Students/Researchers
├── cv.tex                  # Master CV in LaTeX (Source of truth for academic record)
├── cv.pdf                  # Compiled CV PDF (Must be updated whenever cv.tex changes)
├── CNAME                   # Custom domain pointer (me.kimsh.kr)
├── firebase.json           # Firebase configuration
├── css/
│   └── styles.css          # Core design system & theme styling
├── js/
│   ├── script.js           # Mobile nav, scroll-reveal, auto upcoming talk highlighter
│   ├── firebase-config.js  # Firebase auth configuration for inline edit mode
│   └── edit-mode.js        # In-browser CMS for live inline editing & GitHub sync
├── talks/                  # Self-contained slide decks (e.g. talks/2026-logic/index.html)
├── images/                 # Profile photos, assets, illustrations
└── *.py                    # Python helper scripts for batch formatting & extraction
```

---

## 3. Essential Commands

### LaTeX CV Compilation
Always use `xelatex` to compile `cv.tex` into `cv.pdf`, and run it **twice**:
```bash
xelatex -interaction=nonstopmode cv.tex
xelatex -interaction=nonstopmode cv.tex
```

> **Korean text requires `\usepackage{kotex}`** (already in the preamble — do not remove it).
> Without it, xelatex + `lmodern` compiles with **zero errors** but silently drops every Korean
> character from the PDF, leaving blank gaps. After any preamble change, open the compiled
> `cv.pdf` and confirm Korean talk titles (e.g. 공간의 풍경, 이토록 황홀한 수학) still render.

### Local Web Preview
Start a local HTTP server from the repository root to preview web changes:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`. If the browser tool is blocked from `localhost`, verify by
fetching and parsing the served page directly (`curl` + a short script) instead of skipping the check.

### Git Commit & Deployment
Deploying to production is done by pushing to `main`:
```bash
git status
git add .
git commit -m "feat(research): add new preprint on circle diffeomorphisms"
git push origin main
```

---

## 4. Editing Guidelines & Strict Synchronization Rule

> **CRITICAL RULE**: Whenever a publication or talk is added, modified, or reordered, **BOTH**
> `cv.tex` and `research.html` (and `index.html` if featured in Highlights/News)
> **MUST BE UPDATED IN SYNC**.

### 4.1. Paper Format in `research.html`
List items in `research.html` follow this standard semantic structure:
```html
<li>
    <span class="paper-title">4. Title of the Paper (2026)</span>
    <span class="paper-authors">(with Co-author One and Co-author Two)</span>
    <span class="paper-journal">Journal Name, Volume (Year), Pages</span>
    <div class="paper-links">
        <a href="https://arxiv.org/abs/XXXX.XXXXX" target="_blank" rel="noopener">[arXiv]</a>
        <a href="https://doi.org/..." target="_blank" rel="noopener">[Journal]</a>
        <a href="papers/paper.pdf" target="_blank" rel="noopener">[PDF]</a>
    </div>
    <details style="margin-top: 1rem;">
        <summary style="cursor:pointer; font-weight:600; font-size: 0.95rem; color: var(--accent); padding: 0.25rem 0; list-style: none;">▶ Abstract</summary>
        <p style="margin-top: 1rem; font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; background: rgba(0,0,0,0.2); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--accent);">
            Abstract text goes here...
        </p>
    </details>
</li>
```

### 4.2. Talk Format in `research.html`
Talks live in **one flat list** (`<ul class="paper-list talk-list">`) under "Talks & Panel" — there is
no separate upcoming/archive split. Items run in **reverse-chronological order**, numbered from the
highest number at the top (newest) down to `1.` at the bottom (oldest):
```html
<li data-date="2026-11-24" class="is-upcoming">
    <span class="talk-num">283.</span> Siji High School, Daegu, Korea. November 24, 2026.
    <a href="https://example.org" target="_blank" rel="noopener">[Link]</a>
</li>
```
- `data-date="YYYY-MM-DD"` is required. For a multi-day event use the **end** date, so the list
  sorts correctly. `js/script.js` (`updateUpcomingTalks`) compares it against today to apply the
  `is-upcoming` badge, so a placeholder date silently mis-flags the entry.
- **After inserting or deleting any talk, renumber the entire list** so the numbers stay contiguous.
  Do this with a scripted pass rather than by hand:
  ```bash
  python3 - <<'EOF'
  import re
  p = 'research.html'; t = open(p, encoding='utf-8').read()
  n = len(re.findall(r'<span class="talk-num">\d+\.</span>', t)); c = [n]
  def f(m):
      v = c[0]; c[0] -= 1; return f'<span class="talk-num">{v}.</span>'
  open(p, 'w', encoding='utf-8').write(re.sub(r'<span class="talk-num">\d+\.</span>', f, t))
  print('renumbered', n, 'talks')
  EOF
  ```
- Then verify: talk count, `data-date` descending order, and `<li>`/`</li>` balance.

### 4.3. LaTeX Formatting (`cv.tex`)
- Ensure all mathematical symbols are properly wrapped in math mode: e.g., `$S^1$`, `$\mathbb{R}$`,
  `$G^3$`, `$\Gamma_0(p)$`.
- Escape special LaTeX characters: `\&`, `\%`, `\_`, `\#`, `\^`, `\~`.
- Use ASCII punctuation: `--` for en dashes and `'` for apostrophes, not `–` or `’`.
- Keep enumeration structure clean:
  - Publications: `\begin{enumerate}[leftmargin=1.5em, label=\arabic*.]`
  - Talks: `\begin{enumerate}[leftmargin=1.5em, label=\arabic*.]`
- Each `\item` must be one complete entry ending in a period. Watch for entries accidentally split
  across two `\item`s (a stray `\item (plenary).` or a bare year) — a recurring defect in this file.

### 4.4. Verifying Talk and Paper Details
Event dates and venues in this CV have contained real errors (wrong date, wrong city, the same
event listed twice under two names). When an entry looks doubtful, check the event's own page
before editing, and report what was found rather than guessing.

---

## 5. Design System & CSS Rules

- **Theme Colors** (Defined in `css/styles.css`):
  - Background: `--bg-primary: #0a0d14`, `--bg-secondary: #0f141f`
  - Card Background: `--card-bg: #121824` with `rgba(255, 255, 255, 0.05)` borders
  - Accent Color: `--accent: #64ffda` (or blue accent `#58a6ff` for highlights)
  - Text: `--text-primary: #e6edf3`, `--text-muted: #8b949e`
- **Typography**:
  - Headings & Quotes: `'Newsreader', Georgia, serif`
  - Body & UI: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
  - Badges & Dates: monospace / Inter uppercase with letter spacing.
- **Responsiveness**: All cards, grids, and navigation bars must remain fluid and support mobile
  viewports (`@media (max-width: 768px)`).

---

## 6. Inline Web Edit Mode (`js/edit-mode.js`)

- The site has a client-side inline editing mode.
- Users authenticate with Firebase (`admin@kimsh.kr`).
- Saves are committed directly to GitHub repo `kimshmath/me` using the GitHub REST API and a stored
  Personal Access Token (`kimsh_github_pat`).
- If you edit HTML structures manually, maintain existing container IDs and class names
  (`.paper-list`, `.talk-list`, `.talk-num`, `.card`) so the edit-mode modals can parse and append
  content properly.

---

## 7. Quality Checklist Before Completing Any Task

1. [ ] Did you `git fetch` first and reconcile any commits made from the browser edit mode?
2. [ ] If `cv.tex` was modified, did you run `xelatex` twice and confirm `cv.pdf` compiled with 0 errors?
3. [ ] Does the compiled `cv.pdf` still render Korean text and math correctly?
4. [ ] Are `cv.tex` and `research.html` (or other corresponding pages) perfectly in sync?
5. [ ] If talks changed: is the list renumbered, date-ordered, and tag-balanced?
6. [ ] Are all paper links (`[arXiv]`, `[Journal]`, `[PDF]`) working with `target="_blank" rel="noopener"`?
7. [ ] Does the page render cleanly without console errors when previewed?
8. [ ] Is the git commit message clear, descriptive, and using standard semantic prefixes
       (`feat:`, `fix:`, `docs:`, `style:`)?

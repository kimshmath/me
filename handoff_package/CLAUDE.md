# CLAUDE.md — Agent Guidelines for me.kimsh.kr & Academic CV

This repository contains the personal academic website and master Curriculum Vitae (LaTeX) of **Prof. Sang-hyun Kim** (Chair & Professor, School of Mathematics, Korea Institute for Advanced Study / KIAS).

---

## 1. Project Overview & Architecture

- **Website URL**: [https://kimsh.kr](https://kimsh.kr) / [https://me.kimsh.kr](https://me.kimsh.kr)
- **GitHub Repository**: `https://github.com/kimshmath/me` (Branch: `main`)
- **Hosting**: GitHub Pages (via `CNAME: me.kimsh.kr`) + Firebase integration for online edit mode.
- **Tech Stack**:
  - Pure HTML5, Vanilla CSS (`css/styles.css`), Vanilla JavaScript (`js/`).
  - Master CV in LaTeX (`cv.tex` compiled to `cv.pdf`).
  - Dark-mode aesthetic with custom serif typography (`Newsreader`) and sans-serif (`Inter`).

---

## 2. Directory & File Structure

```text
kimsh-kr/
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
├── images/                 # Profile photos, assets, illustrations
└── *.py                    # Python helper scripts for batch formatting & extraction
```

---

## 3. Essential Commands

### LaTeX CV Compilation
Always use `xelatex` (or `pdflatex`) to compile `cv.tex` into `cv.pdf`:
```bash
xelatex -interaction=nonstopmode cv.tex
# Run twice if references or page numbers need resolving:
xelatex -interaction=nonstopmode cv.tex
```

### Local Web Preview
Start a local HTTP server to preview web changes:
```bash
# Python 3 built-in server:
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

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

> **CRITICAL RULE**: Whenever a publication or talk is added, modified, or reordered, **BOTH** `cv.tex` and `research.html` (and `index.html` if featured in Highlights/News) **MUST BE UPDATED IN SYNC**.

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
- **Upcoming Talks**: Include the date and optional `data-date="YYYY-MM-DD"` attribute so `script.js` can dynamically highlight it:
```html
<li data-date="2026-09-28">
    <strong>New Developments of Teichmüller Theory</strong> (Oberwolfach Workshop), Mathematisches Forschungsinstitut Oberwolfach, Germany, September 28 – October 2, 2026.
</li>
```
- **Completed Talks**: Placed inside the collapsible `<details>` section in reverse-chronological order.

### 4.3. LaTeX Formatting (`cv.tex`)
- Ensure all mathematical symbols are properly wrapped in math mode: e.g., `$S^1$`, `$\mathbb{R}$`, `$G^3$`.
- Escape special LaTeX characters: `\&`, `\%`, `\_`, `\#`, `\^`, `\~`.
- Keep enumeration structure clean:
  - Publications: `\begin{enumerate}[leftmargin=1.5em, label=\arabic*.]`
  - Talks: `\begin{enumerate}[leftmargin=1.5em, label=\arabic*.]`

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
- **Responsiveness**: All cards, grids, and navigation bars must remain fluid and support mobile viewports (`@media (max-width: 768px)`).

---

## 6. Inline Web Edit Mode (`js/edit-mode.js`)

- The site has a client-side inline editing mode.
- Users authenticate with Firebase (`admin@kimsh.kr`).
- Saves are committed directly to GitHub repo `kimshmath/me` using the GitHub REST API and a stored Personal Access Token (`kimsh_github_pat`).
- If you edit HTML structures manually, maintain existing container IDs and class names (`.paper-list`, `.talk-list`, `.card`) so the edit-mode modals can parse and append content properly.

---

## 7. Quality Checklist Before Completing Any Task

1. [ ] If `cv.tex` was modified, did you run `xelatex cv.tex` and confirm `cv.pdf` compiled cleanly with 0 errors?
2. [ ] Are `cv.tex` and `research.html` (or other corresponding pages) perfectly in sync?
3. [ ] Are all paper links (`[arXiv]`, `[Journal]`, `[PDF]`) working with `target="_blank" rel="noopener"`?
4. [ ] Does the page render cleanly without console errors when previewed?
5. [ ] Is the git commit message clear, descriptive, and using standard semantic prefixes (`feat:`, `fix:`, `docs:`, `style:`)?

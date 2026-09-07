# Project Architecture & Technical Specification

## 1. System Architecture

```text
+-------------------------------------------------------------------------------+
|                             me.kimsh.kr / kimsh.kr                            |
|                          (Hosted via GitHub Pages)                            |
+-------------------------------------------------------------------------------+
       |                                                    |
       v                                                    v
+-----------------------------+          +--------------------------------------+
| Static Web Pages (HTML5)    |          | LaTeX CV Engine                      |
| - index.html (Home/Bio)     |          | - cv.tex (LaTeX Master Document)     |
| - research.html (Papers)    |          | - XeLaTeX Engine                     |
| - activities.html (Admin)   |          | - cv.pdf (Compiled Output)           |
| - culture.html (Outreach)   |          +--------------------------------------+
| - tips.html (Guides)        |
+-----------------------------+
       |
       +------------------------------------+
       |                                    |
       v                                    v
+-----------------------------+   +---------------------------------------------+
| Presentation & UI Layer     |   | Inline CMS / Edit-Mode System               |
| - css/styles.css (Tokens)   |   | - js/firebase-config.js (Firebase Auth)     |
| - js/script.js (Interactions|   | - js/edit-mode.js (In-Browser Modal Editor) |
|   & auto-highlighting)      |   | - Direct GitHub API commit integration      |
+-----------------------------+   +---------------------------------------------+
```

---

## 2. Component Specifications

### 2.1. Web Pages
1. **`index.html`**:
   - Hero profile with avatar photo (`images/prof.jpg`).
   - Bio summary, Affiliation, Education showcase with glowing status badge.
   - Featured news and highlights cards.
   - Contact links & academic identifiers (ORCID, MathSciNet, Google Scholar).
2. **`research.html`**:
   - Categorized publications:
     - *Preprints / Submitted Papers*
     - *Unpublished / Notes*
     - *Published Papers* (Numbered in reverse-chronological order, with direct links: `[Journal]`, `[arXiv]`, `[PDF]`, and collapsible `<details>` abstracts).
     - *Books & Surveys*
     - *Slides*
     - *Talks* (Upcoming talks with dynamic date highlighting + Complete archive in collapsible `<details>`).
3. **`activities.html`**:
   - Editorial boards, Conference organizing, Mentoring (Postdocs, Ph.D. students, Master's students, Undergraduates), Administrative duties.
4. **`culture.html`**:
   - Popular mathematics columns, Public lectures, Essays, EBS broadcast series.
5. **`tips.html`**:
   - Practical mathematical research advice, paper writing tips, seminar preparation guides.

---

## 3. Style & Design Tokens (`css/styles.css`)

```css
:root {
  --bg-primary: #0a0d14;         /* Deep cosmic black */
  --bg-secondary: #0f141f;       /* Subtle dark blue-gray */
  --card-bg: #121824;            /* Container card surface */
  --card-border: rgba(255, 255, 255, 0.06);
  --text-primary: #e6edf3;       /* High-contrast readable text */
  --text-muted: #8b949e;         /* Secondary description text */
  --accent: #64ffda;             /* Cyan / mint highlight accent */
  --accent-blue: #58a6ff;        /* Link / info accent */
  --accent-purple: #bd93f9;      /* Special badge accent */
  --font-serif: 'Newsreader', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

## 4. JavaScript Modules

### 4.1. `js/script.js`
- **Mobile Navigation**: Toggles the hamburger menu on smaller screens.
- **Scroll Reveal**: Uses `IntersectionObserver` to trigger fade-in animations on `.scroll-reveal` elements.
- **Auto Upcoming Talk Highlighter (`updateUpcomingTalks`)**:
  - Compares the current local date with talk item dates (via `data-date="YYYY-MM-DD"` or regex date parsing).
  - Automatically adds the `.is-upcoming` badge class to talks scheduled in the future.

### 4.2. `js/edit-mode.js` & `js/firebase-config.js`
- Provides an optional in-browser editing toolbar.
- Authenticates using Firebase Auth (`admin@kimsh.kr`).
- Opens form modals to add/edit papers and talks with automatic HTML structure generation.
- Pushes commits directly to `kimshmath/me` using the GitHub REST API (`/repos/kimshmath/me/contents/...`).

---

## 5. LaTeX Engine (`cv.tex` -> `cv.pdf`)

- Standard article class with geometry: 1-inch margins on A4 paper.
- Standard packages: `geometry`, `hyperref`, `enumitem`, `titlesec`, `lmodern`.
- Custom header and clean section dividing lines (`\titlerule`).
- Full publication list and complete seminar/conference talks archive.
- Compiled cleanly via `xelatex -interaction=nonstopmode cv.tex`.

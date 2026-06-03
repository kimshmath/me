/**
 * edit-mode.js — Inline edit mode for kimsh.kr
 *
 * Dependencies:
 *   window.EDIT_MODE_AUTH = { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
 *   (set by firebase-config.js using the modular Firebase SDK)
 *
 * On login the script adds `edit-mode` class to <body>, injects [+ Add] buttons
 * next to each editable <h2>, and provides form modals that generate HTML matching
 * the existing page patterns.  A floating Save button downloads the modified HTML.
 */

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────
  const ADMIN_EMAIL = 'admin@kimsh.kr';
  let dirty = false;                         // track whether edits were made
  let loginBtn = null;

  // ── CSS injection ──────────────────────────────────────────────────────
  function injectStyles() {
    const css = `
      /* ── Login button ─────────────────────────────────────────────── */
      .edit-login-btn {
        background: none;
        border: 1px solid rgba(255,255,255,0.15);
        color: var(--text-muted, #999);
        font-size: 0.85rem;
        padding: 0.25rem 0.55rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        margin-left: 0.5rem;
      }
      .edit-login-btn:hover { border-color: var(--accent, #64ffda); color: var(--accent, #64ffda); }

      /* ── Modal overlay ────────────────────────────────────────────── */
      .edit-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(6px);
        z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.25s;
      }
      .edit-modal-overlay.visible { opacity: 1; }

      /* ── Modal ────────────────────────────────────────────────────── */
      .edit-modal {
        background: rgba(20,20,35,0.92);
        backdrop-filter: blur(18px);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px;
        padding: 2rem 2.2rem;
        max-width: 600px; width: 92vw;
        max-height: 85vh; overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        color: #e0e0e0;
      }
      .edit-modal h3 {
        margin: 0 0 1.2rem;
        font-size: 1.25rem;
        color: var(--accent, #64ffda);
      }

      /* ── Form groups ──────────────────────────────────────────────── */
      .edit-form-group { margin-bottom: 1rem; }
      .edit-form-group label {
        display: block;
        font-size: 0.82rem;
        color: #aaa;
        margin-bottom: 0.3rem;
      }
      .edit-form-group input,
      .edit-form-group textarea {
        width: 100%; box-sizing: border-box;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        padding: 0.55rem 0.75rem;
        color: #e0e0e0;
        font-family: inherit;
        font-size: 0.92rem;
        transition: border-color 0.2s;
      }
      .edit-form-group input:focus,
      .edit-form-group textarea:focus {
        outline: none;
        border-color: var(--accent, #64ffda);
      }
      .edit-form-group textarea { resize: vertical; min-height: 80px; }
      .edit-form-group textarea.mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.82rem; }

      /* ── Buttons inside modals ────────────────────────────────────── */
      .edit-modal-actions {
        display: flex; gap: 0.75rem; margin-top: 1.4rem; justify-content: flex-end;
      }
      .edit-modal-actions button {
        padding: 0.55rem 1.3rem;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.06);
        color: #e0e0e0;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
      }
      .edit-modal-actions button:hover { border-color: var(--accent, #64ffda); }
      .edit-modal-actions button.primary {
        background: var(--accent, #64ffda);
        color: #0a0a1a;
        border: none;
        font-weight: 600;
      }
      .edit-modal-actions button.primary:hover { opacity: 0.85; }

      /* ── [+ Add] buttons ──────────────────────────────────────────── */
      .edit-add-btn {
        display: none;
        background: rgba(100,255,218,0.08);
        border: 1px dashed rgba(100,255,218,0.35);
        color: var(--accent, #64ffda);
        padding: 0.35rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.85rem;
        margin: 0.6rem 0 0.6rem;
        transition: all 0.2s;
      }
      .edit-add-btn:hover { background: rgba(100,255,218,0.15); }
      body.edit-mode .edit-add-btn { display: inline-block; }

      /* ── Floating save button ─────────────────────────────────────── */
      .edit-save-btn {
        display: none;
        position: fixed;
        bottom: 2rem; right: 2rem;
        background: var(--accent, #64ffda);
        color: #0a0a1a;
        border: none;
        padding: 0.75rem 1.6rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(100,255,218,0.3);
        z-index: 9999;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .edit-save-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(100,255,218,0.45); }
      body.edit-mode .edit-save-btn.visible { display: block; }

      /* ── Preview pane ─────────────────────────────────────────────── */
      .edit-preview {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        font-size: 0.88rem;
        color: #ccc;
        max-height: 200px;
        overflow-y: auto;
      }
      .edit-preview .paper-citation { font-size: 0.88rem; }

      /* ── Delete button on items ───────────────────────────────────── */
      .edit-delete-item {
        display: none;
        background: rgba(255,80,80,0.12);
        border: 1px solid rgba(255,80,80,0.3);
        color: #ff5050;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
        margin-left: 0.5rem;
        transition: all 0.2s;
      }
      .edit-delete-item:hover { background: rgba(255,80,80,0.25); }
      body.edit-mode .edit-delete-item { display: inline; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  function currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  function escapeHTML(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Section type detection ─────────────────────────────────────────────

  function detectSectionType(h2Text) {
    const t = h2Text.toLowerCase();
    if (t.includes('published papers'))             return 'published';
    if (t.includes('submitted') || t.includes('accepted')) return 'submitted';
    if (t.includes('unpublished'))                  return 'unpublished';
    if (t.includes('slides') && t.includes('video'))  return 'slides';
    if (t.includes('upcoming'))                     return 'upcoming';
    // For Talks & Panel h2, check for upcoming subheading inside
    if (t.includes('talks'))                        return 'talks';
    return 'generic';
  }

  // ── Build form fields by section type ──────────────────────────────────

  function buildFormFields(type) {
    const fields = [];

    switch (type) {
      case 'published':
        fields.push({ id: 'authors',   label: 'Authors',            type: 'text',     placeholder: 'e.g. Sang-hyun Kim and Thomas Koberda' });
        fields.push({ id: 'title',     label: 'Title',              type: 'text',     placeholder: 'Paper title' });
        fields.push({ id: 'journal',   label: 'Journal name',       type: 'text',     placeholder: 'e.g. Inventiones mathematicae' });
        fields.push({ id: 'volinfo',   label: 'Volume/Number/Pages',type: 'text',     placeholder: 'e.g. 221(2), 421-501 (2020)' });
        fields.push({ id: 'year',      label: 'Year',               type: 'text',     placeholder: '2026' });
        fields.push({ id: 'summary',   label: 'Summary (3-4 sentences)', type: 'textarea' });
        fields.push({ id: 'arxiv',     label: 'arXiv link',         type: 'url',      placeholder: 'https://arxiv.org/abs/...' });
        fields.push({ id: 'journal_url', label: 'Journal / DOI link', type: 'url',    placeholder: 'https://doi.org/...' });
        fields.push({ id: 'bibtex',    label: 'BibTeX',             type: 'textarea', mono: true });
        break;

      case 'submitted':
        fields.push({ id: 'authors',   label: 'Authors',            type: 'text',     placeholder: 'e.g. Sang-hyun Kim' });
        fields.push({ id: 'title',     label: 'Title',              type: 'text',     placeholder: 'Paper title' });
        fields.push({ id: 'year',      label: 'Year',               type: 'text',     placeholder: '2026' });
        fields.push({ id: 'summary',   label: 'Summary (3-4 sentences)', type: 'textarea' });
        fields.push({ id: 'arxiv',     label: 'arXiv link',         type: 'url',      placeholder: 'https://arxiv.org/abs/...' });
        fields.push({ id: 'bibtex',    label: 'BibTeX',             type: 'textarea', mono: true });
        break;

      case 'unpublished':
        fields.push({ id: 'authors',   label: 'Authors',            type: 'text',     placeholder: 'e.g. Sang-hyun Kim' });
        fields.push({ id: 'title',     label: 'Title',              type: 'text',     placeholder: 'Note title' });
        fields.push({ id: 'summary',   label: 'Summary',            type: 'textarea' });
        fields.push({ id: 'arxiv',     label: 'arXiv link',         type: 'url',      placeholder: 'https://arxiv.org/abs/...' });
        fields.push({ id: 'journal_url', label: 'Link (PDF / DOI)', type: 'url',      placeholder: 'https://...' });
        fields.push({ id: 'bibtex',    label: 'BibTeX',             type: 'textarea', mono: true });
        break;

      case 'upcoming':
        fields.push({ id: 'event',     label: 'Event name',         type: 'text',     placeholder: 'Conference / seminar name' });
        fields.push({ id: 'date',      label: 'Date',               type: 'text',     placeholder: 'e.g. June 15, 2026' });
        fields.push({ id: 'location',  label: 'Location',           type: 'text',     placeholder: 'e.g. Seoul, Korea' });
        fields.push({ id: 'link',      label: 'Link URL',           type: 'url',      placeholder: 'https://...' });
        break;

      case 'slides':
        fields.push({ id: 'stitle',    label: 'Title / description',type: 'text',     placeholder: 'Slide or video title' });
        fields.push({ id: 'link',      label: 'Link URL',           type: 'url',      placeholder: 'https://...' });
        break;

      default: // generic — activities, culture, tips
        fields.push({ id: 'content',   label: 'Content text',       type: 'text',     placeholder: 'Item text' });
        fields.push({ id: 'link',      label: 'Link URL (optional)',type: 'url',      placeholder: 'https://...' });
        fields.push({ id: 'linktext',  label: 'Link label (optional)', type: 'text',  placeholder: 'e.g. [Link]' });
        break;
    }
    return fields;
  }

  // ── HTML generation helpers ────────────────────────────────────────────

  /** Build a published / submitted / unpublished paper <li> */
  function buildPaperLI(type, number, vals) {
    const nameAttr = type === 'published' ? 'published' :
                     type === 'submitted' ? 'submitted' : 'notes';

    // Citation line
    let citation = `<strong>${number}.</strong> `;
    if (vals.authors) citation += escapeHTML(vals.authors) + '. ';
    citation += escapeHTML(vals.title || '');
    if (type === 'published' && vals.journal) {
      citation += ', <em>' + escapeHTML(vals.journal) + '</em>';
      if (vals.volinfo) citation += ' ' + escapeHTML(vals.volinfo);
      citation += '.';
    } else if (vals.year) {
      citation += ' (' + escapeHTML(vals.year) + ').';
    }

    // Actions
    let actions = '';

    // Summary
    if (vals.summary) {
      actions += `
                        <details class="paper-details" name="${nameAttr}-${number}">
                            <summary class="action-btn">[Summary]</summary>
                            <div class="summary-content">
                                ${escapeHTML(vals.summary)}
                            </div>
                        </details>`;
    }

    // Journal link
    if (vals.journal_url) {
      const label = type === 'unpublished' ? 'Journal' : 'Journal';
      actions += `
                        <a href="${escapeHTML(vals.journal_url)}" class="action-btn" target="_blank">[${label}]</a>`;
    }

    // Arxiv link
    if (vals.arxiv) {
      actions += `
                        <a href="${escapeHTML(vals.arxiv)}" class="action-btn" target="_blank">[Arxiv]</a>`;
    }

    // BibTeX
    if (vals.bibtex) {
      actions += `
                        <details class="paper-details" name="${nameAttr}-${number}">
                            <summary class="action-btn">[cite]</summary>
                            <div class="cite-content">
                                <button class="copy-cite-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied BibTeX to clipboard!');">Copy</button>
                                <pre>${escapeHTML(vals.bibtex)}</pre>
                            </div>
                        </details>`;
    }

    return `
                <li>
                    <span class="paper-citation">
                        ${citation}
                    </span>
                    <div class="paper-actions">${actions}
                    </div>
                </li>`;
  }

  /** Build an upcoming talk <li> */
  function buildUpcomingLI(number, vals) {
    let text = `${number}. `;
    text += escapeHTML(vals.event || '');
    if (vals.date) text += ', ' + escapeHTML(vals.date);
    if (vals.location) text += ', ' + escapeHTML(vals.location);
    if (vals.link) {
      return `<li>${text} <a href="${escapeHTML(vals.link)}" target="_blank">[Link]</a></li>`;
    }
    return `<li>${text}</li>`;
  }

  /** Build a slides/videos <li> */
  function buildSlideLI(vals) {
    const title = escapeHTML(vals.stitle || 'Untitled');
    if (vals.link) {
      return `<li><a href="${escapeHTML(vals.link)}" target="_blank">${title}</a></li>`;
    }
    return `<li>${title}</li>`;
  }

  /** Build a generic <li> (activities / culture / tips) */
  function buildGenericLI(vals) {
    let html = escapeHTML(vals.content || '');
    if (vals.link) {
      const label = vals.linktext || '[Link]';
      html += ` <a href="${escapeHTML(vals.link)}" target="_blank">${escapeHTML(label)}</a>`;
    }
    return `<li>${html}</li>`;
  }

  // ── Renumbering ────────────────────────────────────────────────────────

  function renumberSection(ul, descending) {
    const items = ul.querySelectorAll(':scope > li');
    const total = items.length;
    items.forEach((li, i) => {
      const strong = li.querySelector('strong');
      if (strong) {
        const num = descending ? (total - i) : (i + 1);
        strong.textContent = num + '.';
      }
    });
  }

  // ── Modal infrastructure ───────────────────────────────────────────────

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'edit-modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
    document.body.appendChild(overlay);
    // Force reflow then add visible
    requestAnimationFrame(() => overlay.classList.add('visible'));
    return overlay;
  }

  function closeModal(overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 260);
  }

  // ── Login modal ────────────────────────────────────────────────────────

  function showLoginModal() {
    const overlay = createOverlay();

    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
      <h3>🔒 Admin Login</h3>
      <div class="edit-form-group">
        <label for="edit-pw">Password</label>
        <input id="edit-pw" type="password" placeholder="Enter password" autocomplete="current-password">
      </div>
      <div id="edit-login-error" style="color:#ff5050;font-size:0.85rem;margin-top:0.5rem;display:none;"></div>
      <div class="edit-modal-actions">
        <button id="edit-cancel">Cancel</button>
        <button id="edit-do-login" class="primary">Login</button>
      </div>
    `;
    overlay.appendChild(modal);

    const pwInput = modal.querySelector('#edit-pw');
    const errDiv  = modal.querySelector('#edit-login-error');
    const cancelBtn = modal.querySelector('#edit-cancel');
    const loginBtnModal = modal.querySelector('#edit-do-login');

    cancelBtn.addEventListener('click', () => closeModal(overlay));

    async function doLogin() {
      const pw = pwInput.value.trim();
      if (!pw) { errDiv.textContent = 'Please enter a password.'; errDiv.style.display = 'block'; return; }

      const authObj = window.EDIT_MODE_AUTH;
      if (!authObj) { errDiv.textContent = 'Firebase not loaded.'; errDiv.style.display = 'block'; return; }

      try {
        loginBtnModal.disabled = true;
        loginBtnModal.textContent = 'Logging in…';
        await authObj.signInWithEmailAndPassword(authObj.auth, ADMIN_EMAIL, pw);
        closeModal(overlay);
      } catch (err) {
        errDiv.textContent = 'Login failed: ' + (err.message || err);
        errDiv.style.display = 'block';
        loginBtnModal.disabled = false;
        loginBtnModal.textContent = 'Login';
      }
    }

    loginBtnModal.addEventListener('click', doLogin);
    pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

    setTimeout(() => pwInput.focus(), 120);
  }

  // ── Add-item modal ─────────────────────────────────────────────────────

  function showAddModal(sectionType, targetUL, h2El) {
    const overlay = createOverlay();
    const modal = document.createElement('div');
    modal.className = 'edit-modal';

    const title = sectionType === 'published'   ? 'Add Published Paper' :
                  sectionType === 'submitted'   ? 'Add Submitted / Accepted Paper' :
                  sectionType === 'unpublished'  ? 'Add Unpublished Note' :
                  sectionType === 'upcoming'     ? 'Add Upcoming Talk' :
                  sectionType === 'slides'       ? 'Add Slide / Video' :
                                                   'Add Item';

    const fields = buildFormFields(sectionType);

    let fieldsHTML = '';
    fields.forEach(f => {
      if (f.type === 'textarea') {
        const monoClass = f.mono ? ' mono' : '';
        fieldsHTML += `
          <div class="edit-form-group">
            <label for="ef-${f.id}">${f.label}</label>
            <textarea id="ef-${f.id}" class="${monoClass}" rows="4" placeholder="${f.placeholder || ''}"></textarea>
          </div>`;
      } else {
        fieldsHTML += `
          <div class="edit-form-group">
            <label for="ef-${f.id}">${f.label}</label>
            <input id="ef-${f.id}" type="${f.type}" placeholder="${f.placeholder || ''}">
          </div>`;
      }
    });

    modal.innerHTML = `
      <h3>${title}</h3>
      ${fieldsHTML}
      <div class="edit-preview" id="edit-preview-pane" style="display:none;"></div>
      <div class="edit-modal-actions">
        <button id="emc-cancel">Cancel</button>
        <button id="emc-preview">Preview</button>
        <button id="emc-insert" class="primary">Insert</button>
      </div>
    `;
    overlay.appendChild(modal);

    const previewPane = modal.querySelector('#edit-preview-pane');

    // Gather values
    function getValues() {
      const vals = {};
      fields.forEach(f => {
        const el = modal.querySelector('#ef-' + f.id);
        vals[f.id] = el ? el.value.trim() : '';
      });
      return vals;
    }

    // Compute next number (prepend to top → highest)
    function nextNumber() {
      if (!targetUL) return 1;
      const items = targetUL.querySelectorAll(':scope > li');
      return items.length + 1;
    }

    function generateHTML(vals, num) {
      switch (sectionType) {
        case 'published':
        case 'submitted':
        case 'unpublished':
          return buildPaperLI(sectionType, num, vals);
        case 'upcoming':
          return buildUpcomingLI(num, vals);
        case 'slides':
          return buildSlideLI(vals);
        default:
          return buildGenericLI(vals);
      }
    }

    modal.querySelector('#emc-cancel').addEventListener('click', () => closeModal(overlay));

    modal.querySelector('#emc-preview').addEventListener('click', () => {
      const vals = getValues();
      const num = nextNumber();
      const html = generateHTML(vals, num);
      previewPane.innerHTML = html;
      previewPane.style.display = 'block';
    });

    modal.querySelector('#emc-insert').addEventListener('click', () => {
      const vals = getValues();
      const num = nextNumber();
      const html = generateHTML(vals, num);

      if (!targetUL) {
        // No <ul> found — try to find or create one
        let section = h2El.closest('section');
        if (!section) section = h2El.parentElement;
        let ul = section.querySelector('ul.paper-list');
        if (!ul) {
          ul = document.createElement('ul');
          ul.className = 'paper-list';
          // Insert after h2
          h2El.after(ul);
        }
        ul.insertAdjacentHTML('afterbegin', html);
        const descending = ['published', 'submitted', 'unpublished'].includes(sectionType);
        renumberSection(ul, descending);
      } else {
        // Prepend to top of list
        targetUL.insertAdjacentHTML('afterbegin', html);
        const descending = ['published', 'submitted', 'unpublished'].includes(sectionType);
        renumberSection(targetUL, descending);
      }

      dirty = true;
      showSaveButton();
      closeModal(overlay);
    });

    // Focus first input
    const firstInput = modal.querySelector('input, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 120);
  }

  // ── Floating Save button ───────────────────────────────────────────────

  let saveBtn = null;

  function createSaveButton() {
    saveBtn = document.createElement('button');
    saveBtn.className = 'edit-save-btn';
    saveBtn.textContent = '💾 Save HTML';
    saveBtn.addEventListener('click', downloadHTML);
    document.body.appendChild(saveBtn);
  }

  function showSaveButton() {
    if (saveBtn) saveBtn.classList.add('visible');
  }

  function downloadHTML() {
    // Remove edit-mode artifacts before serialising
    const clone = document.documentElement.cloneNode(true);

    // Remove edit-mode class from body
    const bodyEl = clone.querySelector('body');
    if (bodyEl) bodyEl.classList.remove('edit-mode');

    // Remove injected elements (login button is inside an <li>, remove the whole <li>)
    clone.querySelectorAll('.edit-add-btn, .edit-save-btn, .edit-modal-overlay, .edit-delete-item').forEach(el => el.remove());
    clone.querySelectorAll('.edit-login-btn').forEach(el => {
      const li = el.closest('li');
      if (li) li.remove(); else el.remove();
    });

    // Remove the injected <style> (last one in head if we added it)
    const styles = clone.querySelectorAll('style');
    styles.forEach(s => {
      if (s.textContent.includes('.edit-login-btn')) s.remove();
    });

    // Build a clean doctype + html string
    let html = '<!DOCTYPE html>\n' + clone.outerHTML;

    // Pretty-print is not critical — just download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentPage();
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 200);
  }

  // ── Section scanning and [+ Add] button injection ──────────────────────

  function injectAddButtons() {
    const h2s = document.querySelectorAll('h2');

    h2s.forEach(h2 => {
      const text = h2.textContent.trim();
      const sectionType = detectSectionType(text);

      // For the "Talks & Panel" section, we handle the Upcoming subheading
      if (sectionType === 'talks') {
        // Look for the "Upcoming" h3 inside this section
        const section = h2.closest('section') || h2.parentElement;
        const upcomingH3 = section.querySelector('h3');
        if (upcomingH3 && upcomingH3.textContent.toLowerCase().includes('upcoming')) {
          const ul = upcomingH3.parentElement.querySelector('ul.paper-list');
          const btn = document.createElement('button');
          btn.className = 'edit-add-btn';
          btn.textContent = '[+ Add Talk]';
          btn.addEventListener('click', () => showAddModal('upcoming', ul, upcomingH3));
          upcomingH3.after(btn);
        }
        return;
      }

      // Find the target <ul> for this section
      let targetUL = null;
      const section = h2.closest('section') || h2.parentElement;

      // Direct sibling <ul> or first paper-list in section
      let sibling = h2.nextElementSibling;
      while (sibling) {
        if (sibling.tagName === 'UL' && sibling.classList.contains('paper-list')) {
          targetUL = sibling;
          break;
        }
        if (sibling.tagName === 'P') {
          sibling = sibling.nextElementSibling;
          continue;
        }
        break;
      }

      if (!targetUL) {
        targetUL = section.querySelector('ul.paper-list');
      }

      const btn = document.createElement('button');
      btn.className = 'edit-add-btn';
      btn.textContent = '[+ Add]';
      btn.addEventListener('click', () => showAddModal(sectionType, targetUL, h2));

      // Insert the button after h2 (and any <p> that immediately follows it)
      let insertAfter = h2;
      let nextEl = h2.nextElementSibling;
      if (nextEl && nextEl.tagName === 'P') insertAfter = nextEl;
      insertAfter.after(btn);
    });
  }

  // ── Auth state management ──────────────────────────────────────────────

  function enterEditMode() {
    document.body.classList.add('edit-mode');
    if (loginBtn) loginBtn.textContent = '[🔓]';
    injectAddButtons();
    createSaveButton();
  }

  function exitEditMode() {
    document.body.classList.remove('edit-mode');
    if (loginBtn) loginBtn.textContent = '[🔒]';
    // Remove add buttons and save button
    document.querySelectorAll('.edit-add-btn, .edit-save-btn').forEach(el => el.remove());
    saveBtn = null;
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────

  function init() {
    injectStyles();

    // Inject login button into nav
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      const li = document.createElement('li');
      loginBtn = document.createElement('button');
      loginBtn.className = 'edit-login-btn';
      loginBtn.textContent = '[🔒]';
      loginBtn.addEventListener('click', () => {
        const authObj = window.EDIT_MODE_AUTH;
        if (authObj && authObj.auth && authObj.auth.currentUser) {
          // Already logged in → logout
          authObj.signOut(authObj.auth).then(() => exitEditMode());
        } else {
          showLoginModal();
        }
      });
      li.appendChild(loginBtn);
      navLinks.appendChild(li);
    }

    // Listen for auth state changes (session persistence)
    function tryAuthListen() {
      const authObj = window.EDIT_MODE_AUTH;
      if (!authObj) {
        // firebase-config.js may not have loaded yet — retry
        setTimeout(tryAuthListen, 300);
        return;
      }
      authObj.onAuthStateChanged(authObj.auth, (user) => {
        if (user && user.email === ADMIN_EMAIL) {
          enterEditMode();
        } else {
          exitEditMode();
        }
      });
    }
    tryAuthListen();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

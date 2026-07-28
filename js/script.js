// Mobile Menu Toggle & Dynamic Talk Highlighting
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            const isExpanded = navLinks.classList.contains('show');
            mobileBtn.setAttribute('aria-expanded', isExpanded);
            mobileBtn.innerHTML = isExpanded ? '✕' : '☰';
        });
    }

    // Scroll reveal animation for elements
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => observer.observe(el));

    // Dynamic upcoming talk highlighter
    updateUpcomingTalks();
});

function updateUpcomingTalks() {
    // Today's date at 00:00:00 local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const talkItems = document.querySelectorAll('.talk-list li, .paper-list li[data-date]');
    talkItems.forEach(li => {
        const dateStr = li.getAttribute('data-date');
        let talkDate = null;

        if (dateStr) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                talkDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            }
        } else {
            const text = li.textContent || '';
            const match = text.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/i);
            if (match) {
                const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
                const monthIdx = monthNames.findIndex(m => match[1].toLowerCase().startsWith(m));
                if (monthIdx !== -1) {
                    talkDate = new Date(parseInt(match[3], 10), monthIdx, parseInt(match[2], 10));
                }
            }
        }

        if (talkDate) {
            talkDate.setHours(0, 0, 0, 0);
            if (talkDate >= today) {
                li.classList.add('is-upcoming');
            } else {
                li.classList.remove('is-upcoming');
            }
        }
    });
}

// Expose globally for edit-mode.js
window.updateUpcomingTalks = updateUpcomingTalks;

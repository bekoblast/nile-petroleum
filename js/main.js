/* ==========================================================================
   Nile Petroleum – Shared JavaScript
   - Sticky nav, mobile drawer, scroll reveal, counters
   - Bilingual (EN ⇄ AR) with persistent localStorage preference
   - RTL flip + Cairo Arabic font auto-loaded on first AR switch
   ========================================================================== */

(function () {
    'use strict';

    /* ===========================================================
       0. AUTO-LOAD: features.css + search.js so every page has them
       (without needing to touch 14 HTML files)
       =========================================================== */
    const IN_PAGES_DIR = /[\/\\]pages[\/\\]/i.test(window.location.pathname);
    const REL = IN_PAGES_DIR ? '../' : '';

    function injectStylesheet(href) {
        if ([].some.call(document.styleSheets, (ss) => ss.href && ss.href.endsWith(href.split('/').pop()))) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
    function injectScript(src) {
        const existing = document.querySelector('script[data-np-injected="' + src + '"]');
        if (existing) return;
        const s = document.createElement('script');
        s.src = src;
        s.defer = false;
        s.setAttribute('data-np-injected', src);
        document.head.appendChild(s);
    }
    injectStylesheet(REL + 'css/features.css');
    injectScript(REL + 'js/search.js');
    injectScript(REL + 'js/interactive.js');
    injectScript(REL + 'js/articles.js');

    /* ===========================================================
       1. INJECT ARABIC FONT (lazy — only when needed)
       =========================================================== */
    let arabicFontLoaded = false;
    function ensureArabicFont() {
        if (arabicFontLoaded) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap';
        document.head.appendChild(link);
        arabicFontLoaded = true;
    }

    /* ===========================================================
       2. STICKY NAVBAR SHADOW
       =========================================================== */
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 4);
        document.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ===========================================================
       3. MOBILE DRAWER
       =========================================================== */
    const navToggle = document.querySelector('.nav-toggle');
    const drawer = document.querySelector('.mobile-drawer');
    const drawerClose = document.querySelector('.mobile-drawer-close');

    const openDrawer = () => drawer && drawer.classList.add('open');
    const closeDrawer = () => drawer && drawer.classList.remove('open');

    if (navToggle) navToggle.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawer) drawer.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });

    /* ===========================================================
       4. SCROLL REVEAL
       =========================================================== */
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('visible');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        revealEls.forEach((el) => io.observe(el));
    }

    /* ===========================================================
       5. COUNTERS — animate on view, with a fallback so they always
       run even if IntersectionObserver doesn't fire for some reason.
       =========================================================== */
    function animateCounter(el) {
        if (el.dataset.counted === '1') return;
        el.dataset.counted = '1';
        const target = parseFloat(el.dataset.counter);
        if (Number.isNaN(target)) return;
        const decimals = (el.dataset.counter.split('.')[1] || '').length;
        const duration = 1600;
        const start = performance.now();
        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const value = target * eased;
            el.textContent = value.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            });
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length) {
        if ('IntersectionObserver' in window) {
            const co = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => {
                        if (e.isIntersecting) {
                            animateCounter(e.target);
                            co.unobserve(e.target);
                        }
                    });
                },
                { threshold: 0.25 }
            );
            counters.forEach((c) => co.observe(c));
        }
        // Safety net: after 800ms, animate any counters that haven't run yet
        // (covers the case where the observer never fires — e.g. if the element
        // is above the fold or the page is short enough that no scroll happens).
        setTimeout(() => counters.forEach(animateCounter), 800);
    }

    /* ===========================================================
       6. SMOOTH ANCHOR
       =========================================================== */
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((a) => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            const tgt = document.querySelector(href);
            if (!tgt) return;
            e.preventDefault();
            window.scrollTo({ top: tgt.offsetTop - 80, behavior: 'smooth' });
        });
    });

    /* ===========================================================
       7. FORM MOCK SUBMIT
       =========================================================== */
    document.querySelectorAll('form[data-mock]').forEach((form) => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('[type="submit"]');
            if (!btn) return;
            const original = btn.innerHTML;
            const sentLabel = (window.__np_lang === 'ar') ? 'تم الإرسال' : 'Sent';
            btn.innerHTML = '<i class="fas fa-check"></i> ' + sentLabel;
            btn.disabled = true;
            setTimeout(() => {
                btn.innerHTML = original;
                btn.disabled = false;
                form.reset();
            }, 2200);
        });
    });

    /* ===========================================================
       8. INTERNATIONALISATION (EN ⇄ AR)
       Walks the DOM, swaps translatable text, persists preference.
       =========================================================== */
    const LANG_KEY = 'np_lang';
    const TR = window.NP_TRANSLATIONS_AR || {};
    const TRANSLATABLE_SELECTOR = [
        'h1','h2','h3','h4','h5','h6',
        'p','a','button','label','summary','li','span',
        'td','th','option','small','div'
    ].join(',');

    /* sort comparator helpers using compareDocumentPosition */
    function leavesFirst(a, b) {
        if (a === b) return 0;
        const pos = a.compareDocumentPosition(b);
        if (pos & Node.DOCUMENT_POSITION_CONTAINED_BY) return 1;  // a is ancestor → a after b
        if (pos & Node.DOCUMENT_POSITION_CONTAINS) return -1;     // a is descendant → a first
        return 0;
    }
    function ancestorsFirst(a, b) {
        if (a === b) return 0;
        const pos = a.compareDocumentPosition(b);
        if (pos & Node.DOCUMENT_POSITION_CONTAINED_BY) return -1; // a is ancestor → a first
        if (pos & Node.DOCUMENT_POSITION_CONTAINS) return 1;      // a is descendant → a after
        return 0;
    }

    /* Skip elements that contain or ARE counter elements — touching their
       innerHTML would detach the running counter span and freeze the count. */
    function isCounterRelated(el) {
        return el.hasAttribute('data-counter') || !!el.querySelector('[data-counter]');
    }

    /* PRE-PASS: snapshot original innerHTML & placeholders BEFORE any translation,
       so subsequent restore-to-English uses true English source. */
    function snapshotOriginals() {
        document.querySelectorAll(TRANSLATABLE_SELECTOR).forEach((el) => {
            if (isCounterRelated(el)) return;
            if (!el.hasAttribute('data-i18n-orig')) {
                el.setAttribute('data-i18n-orig', el.innerHTML);
            }
        });
        document.querySelectorAll('[placeholder]').forEach((el) => {
            if (!el.hasAttribute('data-i18n-orig-placeholder')) {
                el.setAttribute('data-i18n-orig-placeholder', el.placeholder);
            }
        });
        ['title','aria-label','alt'].forEach((attr) => {
            document.querySelectorAll('[' + attr + ']').forEach((el) => {
                const sav = 'data-i18n-orig-' + attr;
                if (!el.hasAttribute(sav)) {
                    el.setAttribute(sav, el.getAttribute(attr));
                }
            });
        });
    }

    function translateOneToArabic(el) {
        if (!el.isConnected) return;
        if (isCounterRelated(el)) return; // never touch counters

        // Strategy A: walk DIRECT text-node children. Preserves icons & inline tags.
        let translated = false;
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const raw = node.textContent;
                const trimmed = raw.trim();
                if (trimmed && Object.prototype.hasOwnProperty.call(TR, trimmed)) {
                    node.textContent = raw.replace(trimmed, TR[trimmed]);
                    translated = true;
                }
            }
        }
        if (translated) return;

        // Strategy B: whole-element fallback (e.g. headings with inline <span>).
        // Only used when no individual text-node match was found.
        const fullText = el.textContent.trim().replace(/\s+/g, ' ');
        if (fullText && Object.prototype.hasOwnProperty.call(TR, fullText)) {
            el.textContent = TR[fullText];
        }
    }

    function restoreOneToEnglish(el) {
        if (!el.isConnected) return;
        if (isCounterRelated(el)) return; // preserve running counter spans
        if (el.hasAttribute('data-i18n-orig')) {
            const orig = el.getAttribute('data-i18n-orig');
            if (el.innerHTML !== orig) {
                el.innerHTML = orig;
            }
        }
    }

    function applyAttributes(lang) {
        document.querySelectorAll('[data-i18n-orig-placeholder]').forEach((el) => {
            const orig = el.getAttribute('data-i18n-orig-placeholder');
            el.placeholder = (lang === 'ar' && TR[orig]) ? TR[orig] : orig;
        });
        ['title','aria-label','alt'].forEach((attr) => {
            document.querySelectorAll('[data-i18n-orig-' + attr + ']').forEach((el) => {
                const orig = el.getAttribute('data-i18n-orig-' + attr);
                el.setAttribute(attr, (lang === 'ar' && TR[orig]) ? TR[orig] : orig);
            });
        });
    }

    /* ===========================================================
       Language persistence: URL param > localStorage > cookie
       (Multi-tier so it survives any preview / hosting setup)
       =========================================================== */
    function getCookie(name) {
        const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
        return m ? decodeURIComponent(m[1]) : null;
    }
    function setCookie(name, val) {
        try { document.cookie = name + '=' + encodeURIComponent(val) + '; max-age=31536000; path=/'; } catch (_) {}
    }
    function detectInitialLang() {
        // 1. URL ?lang=
        try {
            const p = new URLSearchParams(window.location.search).get('lang');
            if (p === 'ar' || p === 'en') return p;
        } catch (_) {}
        // 2. localStorage
        try {
            const ls = localStorage.getItem(LANG_KEY);
            if (ls === 'ar' || ls === 'en') return ls;
        } catch (_) {}
        // 3. Cookie
        const c = getCookie('np_lang');
        if (c === 'ar' || c === 'en') return c;
        return 'en';
    }
    function persistLang(lang) {
        try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
        setCookie('np_lang', lang);
        // Reflect in current URL without reload (keeps sharing/back-button consistent)
        try {
            const u = new URL(window.location.href);
            if (lang === 'ar') u.searchParams.set('lang', 'ar');
            else u.searchParams.delete('lang');
            history.replaceState(null, '', u.toString());
        } catch (_) {}
    }

    /* Append/strip ?lang=ar on every internal link so navigation preserves language. */
    function rewriteHrefForLang(originalHref, lang) {
        if (!originalHref) return originalHref;
        if (/^(https?:\/\/|mailto:|tel:|javascript:|#)/i.test(originalHref)) return originalHref;

        // Split fragment
        let hash = '';
        const hi = originalHref.indexOf('#');
        let base = originalHref;
        if (hi >= 0) { hash = originalHref.substring(hi); base = originalHref.substring(0, hi); }

        // Strip existing lang param from query
        let path = base, query = '';
        const qi = base.indexOf('?');
        if (qi >= 0) {
            path = base.substring(0, qi);
            query = base.substring(qi + 1);
            query = query
                .split('&')
                .filter(p => p && !/^lang=/.test(p))
                .join('&');
        }

        if (lang === 'ar') {
            query = query ? query + '&lang=ar' : 'lang=ar';
        }

        return path + (query ? '?' + query : '') + hash;
    }
    function rewriteInternalLinks(lang) {
        document.querySelectorAll('a[href]').forEach((a) => {
            // Save original href once
            if (!a.hasAttribute('data-i18n-orig-href')) {
                a.setAttribute('data-i18n-orig-href', a.getAttribute('href'));
            }
            const orig = a.getAttribute('data-i18n-orig-href');
            const next = rewriteHrefForLang(orig, lang);
            if (a.getAttribute('href') !== next) {
                a.setAttribute('href', next);
            }
        });
    }

    function setLanguage(lang) {
        window.__np_lang = lang;
        if (lang === 'ar') ensureArabicFont();

        // 1. Snapshot originals first so English restore is exact.
        snapshotOriginals();

        // 2. Direction & body classes
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        document.body.classList.toggle('lang-ar', lang === 'ar');
        document.body.classList.toggle('lang-en', lang !== 'ar');

        // 3. Translate or restore
        const all = Array.from(document.querySelectorAll(TRANSLATABLE_SELECTOR));
        if (lang === 'en') {
            all.sort(ancestorsFirst).forEach(restoreOneToEnglish);
        } else {
            all.sort(leavesFirst).forEach(translateOneToArabic);
        }

        // 4. Apply attribute translations
        applyAttributes(lang);

        // 5. Re-snapshot any newly created elements
        snapshotOriginals();

        // 6. Carry language across navigation
        rewriteInternalLinks(lang);

        // 7. Persist & update toggle button state
        persistLang(lang);
        document.querySelectorAll('.lang-switch button').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    // Expose setLanguage so dynamically-injected content can request a re-translate
    window.__np_setLanguage = setLanguage;

    // Wire toggles
    document.querySelectorAll('.lang-switch button').forEach((btn) => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    // Apply preference on load
    const initial = detectInitialLang();
    if (initial === 'ar') {
        setLanguage('ar');
    } else {
        document.body.classList.add('lang-en');
        window.__np_lang = 'en';
        rewriteInternalLinks('en'); // strips any stray ?lang param
    }
})();

/* ==========================================================================
   Site-wide search
   - Static index of every page + key sub-section
   - Live overlay (Cmd/Ctrl+K shortcut, Esc to close)
   - Bilingual: AR titles/snippets are resolved through the i18n dictionary
   ========================================================================== */

(function () {
    'use strict';

    /* ---- Detect current directory so links resolve correctly ---- */
    const IN_PAGES = /[\/\\]pages[\/\\]/i.test(window.location.pathname);
    function resolveUrl(u) {
        if (IN_PAGES) {
            if (u === 'index.html') return '../index.html';
            if (u.startsWith('pages/')) return u.substring(6);
            return u;
        }
        return u;
    }

    /* ---- Index ---- */
    const INDEX = [
        // Main
        { url: 'index.html', title: 'Home', cat: 'Main',
          keywords: 'home homepage nilepet petroleum sudan energy oil gas refining stations welcome',
          snippet: "Home page — Sudan's National Oil Company powering progress through energy and innovation." },

        // About + subsections
        { url: 'pages/about.html', title: 'About Us', cat: 'About',
          keywords: 'about company profile mission vision leadership chairman team history values established 2004',
          snippet: "Company profile, mission & vision, core values, leadership team, and chairman's message." },
        { url: 'pages/about.html#profile', title: 'Company Profile', cat: 'About',
          keywords: 'company profile history establishment 2004 sudan integrated value chain',
          snippet: 'Two Decades of Energy Leadership — incorporated by the Government of Sudan to oversee the hydrocarbon value chain.' },
        { url: 'pages/about.html#mission', title: 'Mission & Vision', cat: 'About',
          keywords: 'mission vision purpose direction strategy',
          snippet: 'Purpose and direction: our mission to deliver reliable energy and our vision to be Africa\'s most trusted national oil company.' },
        { url: 'pages/about.html#leadership', title: 'Leadership Team', cat: 'About',
          keywords: 'leadership team executives CEO CFO COO CHRO board management',
          snippet: 'Meet the people driving Nilepet — CEO, CFO, COO, CHRO, and senior management team.' },
        { url: 'pages/about.html#chairman', title: "Chairman's Message", cat: 'About',
          keywords: 'chairman message statement letter board chairman of the board',
          snippet: 'Anchored in Purpose, Driven by Progress — message from the Chairman of the Board.' },

        // Services
        { url: 'pages/services.html', title: 'Services', cat: 'Services',
          keywords: 'services upstream exploration production refining distribution logistics retail aviation marine lubricants',
          snippet: 'Upstream exploration, refining, distribution, retail, aviation, and lubricants services.' },
        { url: 'pages/services.html#upstream', title: 'Exploration & Production', cat: 'Services',
          keywords: 'upstream exploration production drilling seismic reservoir blocks concessions',
          snippet: 'Upstream operations across 12 concession blocks with modern seismic, drilling, and reservoir technology.' },
        { url: 'pages/services.html#refining', title: 'Refining & Processing', cat: 'Services',
          keywords: 'refining processing midstream refinery khartoum euro v gasoline diesel jet kerosene lpg',
          snippet: 'Khartoum Refinery operating at 130,000 bbl/day with Phase-II expansion underway.' },
        { url: 'pages/services.html#logistics', title: 'Distribution & Logistics', cat: 'Services',
          keywords: 'distribution logistics pipeline transport rail road marine depot bunker',
          snippet: 'Sudan\'s largest fuel-distribution network with 1,400+ km pipeline, 15 strategic depots.' },
        { url: 'pages/services.html#aviation', title: 'Aviation & Marine Fuels', cat: 'Services',
          keywords: 'aviation marine jet fuel avgas bunker port airport',
          snippet: 'Specialised Jet A-1, Avgas 100LL, and marine bunker supplies at major ports and airports.' },

        // Products
        { url: 'pages/products.html', title: 'Products', cat: 'Products',
          keywords: 'products fuel gasoline diesel jet kerosene heavy fuel oil bitumen lubricant lpg gas',
          snippet: 'Refined fuels (Gasoline, Diesel, Jet A-1, Kerosene), lubricants, LPG, and bitumen products.' },

        // Fuel Stations
        { url: 'pages/fuel-stations.html', title: 'Fuel Stations', cat: 'Stations',
          keywords: 'fuel stations map location search 450 sudan khartoum bahri omdurman port sudan kassala 24/7 ev mart restaurant',
          snippet: '450+ branded fuel stations across Sudan with map, locations, and 24/7 service availability.' },

        // News
        { url: 'pages/news.html', title: 'News & Events', cat: 'News',
          keywords: 'news events announcements press releases milestones',
          snippet: 'Latest news, announcements, events, and operational milestones from Nilepet.' },

        // Careers
        { url: 'pages/careers.html', title: 'Careers', cat: 'Careers',
          keywords: 'careers jobs vacancies employment work apply positions opportunities engineer manager HSE retail cybersecurity',
          snippet: 'Job openings, career paths, benefits, and application process at Nilepet.' },

        // Investor
        { url: 'pages/investor-relations.html', title: 'Investor Relations', cat: 'Investors',
          keywords: 'investor relations financial reports annual quarterly EBITDA revenue earnings ESG governance stock',
          snippet: 'Financial reports, annual reports, governance documents, ESG disclosures, and stock indicators.' },
        { url: 'pages/investor-relations.html#financials', title: 'Financial Reports', cat: 'Investors',
          keywords: 'financial reports financials quarterly annual revenue EBITDA net income EPS',
          snippet: 'Quarterly financial summary with revenue, EBITDA, net income, and earnings per share.' },
        { url: 'pages/investor-relations.html#governance', title: 'Governance', cat: 'Investors',
          keywords: 'governance charter board committees code of conduct',
          snippet: 'Board structure, committees, code of conduct, and governance charter.' },
        { url: 'pages/investor-relations.html#esg', title: 'ESG Disclosures', cat: 'Investors',
          keywords: 'ESG disclosures climate TCFD risk sustainability',
          snippet: 'TCFD-aligned climate disclosures and risk factors.' },

        // HSE & ESG
        { url: 'pages/hse-esg.html', title: 'HSE & ESG', cat: 'Sustainability',
          keywords: 'HSE ESG health safety environment sustainability emissions methane biodiversity community ISO 45001',
          snippet: 'Health, Safety, Environment, ESG performance, sustainability reports, and community impact programs.' },
        { url: 'pages/hse-esg.html#sustainability', title: 'Sustainability Reports', cat: 'Sustainability',
          keywords: 'sustainability report GRI TCFD KPI emissions water TRIR waste recycled',
          snippet: 'Sustainability KPIs tracked, audited, and disclosed annually under GRI and TCFD frameworks.' },
        { url: 'pages/hse-esg.html#community', title: 'Community Impact', cat: 'Sustainability',
          keywords: 'community impact schools clinics training water clean local social',
          snippet: 'Investing where we operate — 23 schools, 12 health clinics, 4,500 trainees, 18 clean-water projects.' },

        // Contact
        { url: 'pages/contact.html', title: 'Contact Us', cat: 'Contact',
          keywords: 'contact phone email address head office support media press inquiry form',
          snippet: 'Contact details, head office address, customer support, complaint channels, and inquiry form.' },

        // Complaint
        { url: 'pages/complaint.html', title: 'Complaint Management', cat: 'Support',
          keywords: 'complaint complaints file track ticket id submit feedback grievance support bilingual arabic english',
          snippet: 'File a new complaint or track existing complaints with a unique tracking ID.' },

        // FAQ / Terms / Privacy
        { url: 'pages/faq.html', title: 'FAQ', cat: 'Help',
          keywords: 'faq frequently asked questions help support common',
          snippet: 'Frequently asked questions about products, services, careers, and corporate operations.' },
        { url: 'pages/terms.html', title: 'Terms & Conditions', cat: 'Legal',
          keywords: 'terms conditions legal usage',
          snippet: 'Terms and conditions for using the Nilepet website and services.' },
        { url: 'pages/privacy.html', title: 'Privacy Policy', cat: 'Legal',
          keywords: 'privacy policy data GDPR ISO 27001 cookies personal information',
          snippet: 'Privacy policy aligned with GDPR principles and ISO 27001 information-security standards.' },
    ];

    /* ---- Translate helper (only used for scoring matches against AR queries) ---- */
    const TR = window.NP_TRANSLATIONS_AR || {};
    /* We BUILD the overlay in English source strings, then ask main.js to re-translate.
       This way the i18n snapshot always holds English originals, so toggling EN↔AR works. */
    function refreshLanguage() {
        // Only re-translate when the active language actually requires it (AR).
        // Calling setLanguage('en') would do a destructive innerHTML restore pass.
        if (window.__np_setLanguage && window.__np_lang === 'ar') {
            window.__np_setLanguage('ar');
        }
    }

    /* ---- Scoring ---- */
    function score(entry, terms) {
        let s = 0;
        const titleLow = entry.title.toLowerCase();
        const catLow = entry.cat.toLowerCase();
        const keyLow = entry.keywords.toLowerCase();
        const snipLow = entry.snippet.toLowerCase();

        // Arabic search: also check translated strings
        const trTitle = (window.__np_lang === 'ar') ? (TR[entry.title] || '').toLowerCase() : '';
        const trSnippet = (window.__np_lang === 'ar') ? (TR[entry.snippet] || '').toLowerCase() : '';

        for (const t of terms) {
            if (!t) continue;
            if (titleLow.includes(t) || trTitle.includes(t)) s += 6;
            if (catLow.includes(t)) s += 4;
            if (keyLow.includes(t)) s += 3;
            if (snipLow.includes(t) || trSnippet.includes(t)) s += 1;
        }
        return s;
    }

    function searchQuery(q) {
        const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (!terms.length) return [];
        const scored = INDEX.map((e) => ({ entry: e, s: score(e, terms) }))
            .filter((r) => r.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, 8);
        return scored.map((r) => r.entry);
    }

    /* ---- HTML build ---- */
    function highlight(text, terms) {
        if (!terms.length) return text;
        const pattern = new RegExp(
            '(' + terms.map(escapeRe).join('|') + ')',
            'gi'
        );
        return text.replace(pattern, '<mark>$1</mark>');
    }
    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function hintHtml() {
        // Always build in English. main.js will translate to current language.
        return `
            <div class="search-hint">
                <i class="fas fa-magnifying-glass-plus"></i>
                <h4>Start typing to search across pages, services, news, and more.</h4>
                <p>Popular searches:</p>
                <div class="search-shortcuts">
                    <a href="#" data-shortcut="fuel stations">Fuel Stations</a>
                    <a href="#" data-shortcut="careers">Careers</a>
                    <a href="#" data-shortcut="complaint">Complaint Management</a>
                    <a href="#" data-shortcut="investor relations">Investor Relations</a>
                    <a href="#" data-shortcut="HSE">HSE & ESG</a>
                </div>
            </div>
        `;
    }

    function buildOverlay() {
        if (document.getElementById('np-search-overlay')) return;
        const html = `
        <div class="search-overlay" id="np-search-overlay" role="dialog" aria-modal="true" aria-label="Search">
            <div class="search-panel">
                <div class="search-input-wrap">
                    <i class="fas fa-magnifying-glass"></i>
                    <input id="np-search-input" type="search" autocomplete="off" spellcheck="false"
                           placeholder="Search the site…" aria-label="Search the site…">
                    <button class="search-close" id="np-search-close">Esc</button>
                </div>
                <div class="search-results" id="np-search-results">${hintHtml()}</div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        // Now ask main.js to apply the active language to the new nodes
        refreshLanguage();
    }

    function renderResults(query) {
        const out = document.getElementById('np-search-results');
        if (!out) return;
        const isAr = window.__np_lang === 'ar';
        const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

        if (!terms.length) {
            out.innerHTML = hintHtml();
            refreshLanguage();
            wireShortcuts();
            return;
        }

        const results = searchQuery(query);
        if (!results.length) {
            out.innerHTML = `
                <div class="search-empty">
                    <i class="fas fa-circle-question"></i>
                    <h4>No results found</h4>
                    <p>Try different keywords or browse the main sections.</p>
                </div>`;
            refreshLanguage();
            return;
        }

        // Build with English source strings then translate via main.js
        out.innerHTML = results.map((e) => {
            const titleHtml = highlight(escapeHtml(e.title), terms);
            const snipHtml = highlight(escapeHtml(e.snippet), terms);
            return `
                <a class="search-result" href="${resolveUrl(e.url)}">
                    <span class="search-result-cat">${escapeHtml(e.cat)}</span>
                    <h4>${titleHtml}</h4>
                    <p>${snipHtml}</p>
                </a>
            `;
        }).join('');
        refreshLanguage();
    }

    function wireShortcuts() {
        document.querySelectorAll('[data-shortcut]').forEach((a) => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const input = document.getElementById('np-search-input');
                if (!input) return;
                input.value = a.dataset.shortcut;
                input.focus();
                renderResults(input.value);
            });
        });
    }

    /* ---- Open / close ---- */
    function openSearch() {
        buildOverlay();
        const overlay = document.getElementById('np-search-overlay');
        const input = document.getElementById('np-search-input');
        if (!overlay || !input) return;
        overlay.classList.add('open');
        wireShortcuts();
        setTimeout(() => input.focus(), 60);
    }
    function closeSearch() {
        const overlay = document.getElementById('np-search-overlay');
        if (!overlay) return;
        overlay.classList.remove('open');
    }

    /* ---- Wire ---- */
    function init() {
        // Open via .nav-search anchors
        document.querySelectorAll('.nav-search, #open-search').forEach((el) => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                openSearch();
            });
        });

        // Live input
        document.addEventListener('input', (e) => {
            if (e.target && e.target.id === 'np-search-input') {
                renderResults(e.target.value);
            }
        });

        // Close button & backdrop & Esc & Ctrl/Cmd+K
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'np-search-close') { closeSearch(); return; }
            const overlay = document.getElementById('np-search-overlay');
            if (overlay && e.target === overlay) closeSearch();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSearch();
            if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                openSearch();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

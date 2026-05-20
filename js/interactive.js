/* ==========================================================================
   Page-specific interactive features (auto-detects page from DOM)
   - News category filter
   - Fuel-stations search filter
   - Job-application modal with tracking IDs
   - Investor charts (loads Chart.js on demand)
   ========================================================================== */

(function () {
    'use strict';

    /* ===========================================================
       FEATURE 1 — News category filter
       =========================================================== */
    function initNewsFilter() {
        const filterContainer = document.querySelector('.news-filter');
        const cards = document.querySelectorAll('.news-grid .news-card');
        if (!filterContainer || !cards.length) return;

        // Derive category from each card's first chip
        cards.forEach((card) => {
            const chip = card.querySelector('.news-meta .chip:first-child');
            if (chip) card.dataset.cat = chip.textContent.trim().toLowerCase();
        });

        const buttons = filterContainer.querySelectorAll('button');
        buttons.forEach((btn) => {
            btn.addEventListener('click', () => {
                buttons.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                const want = btn.textContent.trim().toLowerCase();
                let shown = 0;
                cards.forEach((card) => {
                    const cat = card.dataset.cat || '';
                    const match = want === 'all' || want === 'الكل' || cat === want || cat === translateBack(want);
                    card.style.display = match ? '' : 'none';
                    if (match) shown++;
                });
                if (shown === 0) showNewsEmpty(filterContainer);
                else hideNewsEmpty();
            });
        });
    }
    function translateBack(arabic) {
        const TR = window.NP_TRANSLATIONS_AR || {};
        for (const [en, ar] of Object.entries(TR)) {
            if (ar === arabic) return en.toLowerCase();
        }
        return arabic;
    }
    function showNewsEmpty(container) {
        hideNewsEmpty();
        const grid = document.querySelector('.news-grid');
        if (!grid) return;
        const empty = document.createElement('div');
        empty.id = 'news-empty-msg';
        empty.className = 'track-empty';
        empty.style.gridColumn = '1 / -1';
        empty.innerHTML = '<i class="fas fa-newspaper"></i><h4>No articles in this category</h4><p>Try selecting a different category.</p>';
        grid.appendChild(empty);
        if (window.__np_setLanguage && window.__np_lang === 'ar') window.__np_setLanguage('ar');
    }
    function hideNewsEmpty() {
        const e = document.getElementById('news-empty-msg');
        if (e) e.remove();
    }

    /* ===========================================================
       FEATURE 2 — Fuel-stations filter
       =========================================================== */
    function initStationFilter() {
        const form = document.querySelector('.station-search');
        const items = document.querySelectorAll('.stations-grid-full .station-item');
        if (!form || !items.length) return;

        // Tag each station with state + services derived from its content
        const stateMap = {
            'khartoum': ['khartoum', 'omdurman', 'bahri'],
            'red sea':  ['port sudan'],
            'gezira':   ['madani', 'wad medani'],
            'kassala':  ['kassala'],
            'river nile': ['atbara', 'river nile'],
            'white nile': ['kosti'],
        };
        items.forEach((item) => {
            const name = (item.querySelector('h4') || {}).textContent || '';
            const low = name.toLowerCase();
            let state = '';
            for (const [s, cities] of Object.entries(stateMap)) {
                if (cities.some((c) => low.includes(c))) { state = s; break; }
            }
            item.dataset.state = state;

            const services = [];
            item.querySelectorAll('.station-meta .chip').forEach((chip) => {
                const t = chip.textContent.trim().toLowerCase();
                if (t.includes('24/7')) services.push('24/7');
                if (t.includes('ev')) services.push('ev charging');
                if (t.includes('mart')) services.push('convenience mart');
                if (t.includes('restaurant')) services.push('restaurant');
                if (t.includes('heavy') || t.includes('truck')) services.push('truck stop');
                if (t.includes('marine')) services.push('marine');
                if (t.includes('aviation')) services.push('aviation');
            });
            item.dataset.services = services.join('|');
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            applyStationFilter();
        });
        form.querySelectorAll('select, input').forEach((el) => {
            el.addEventListener('change', applyStationFilter);
            el.addEventListener('input', applyStationFilter);
        });

        function applyStationFilter() {
            const state = (form.querySelector('#state').value || '').toLowerCase();
            const service = (form.querySelector('#service').value || '').toLowerCase();
            const text = (form.querySelector('#search').value || '').toLowerCase().trim();
            const isAllStates = state.includes('all') || state.includes('جميع');
            const isAnyService = service.includes('any') || service.includes('أي');

            let shown = 0;
            items.forEach((item) => {
                const sState = item.dataset.state || '';
                const sServices = item.dataset.services || '';
                const allText = (item.textContent || '').toLowerCase();

                const stateMatch = isAllStates || !state || sState === state;
                const serviceMatch = isAnyService || !service || sServices.includes(service);
                const textMatch = !text || allText.includes(text);

                const match = stateMatch && serviceMatch && textMatch;
                item.style.display = match ? '' : 'none';
                if (match) shown++;
            });
            showStationsEmpty(shown === 0);
        }

        function showStationsEmpty(show) {
            let empty = document.getElementById('stations-empty-msg');
            const grid = document.querySelector('.stations-grid-full');
            if (!show) { if (empty) empty.remove(); return; }
            if (!empty) {
                empty = document.createElement('div');
                empty.id = 'stations-empty-msg';
                empty.className = 'track-empty';
                empty.style.gridColumn = '1 / -1';
                empty.innerHTML = '<i class="fas fa-map-pin"></i><h4>No stations match your filters</h4><p>Try adjusting your search criteria.</p>';
                grid.appendChild(empty);
                if (window.__np_setLanguage && window.__np_lang === 'ar') window.__np_setLanguage('ar');
            }
        }
    }

    /* ===========================================================
       FEATURE 3 — Job applications (modal + tracking IDs)
       =========================================================== */
    const APPS_KEY = 'np_applications';

    function loadApps() { try { return JSON.parse(localStorage.getItem(APPS_KEY)) || []; } catch (_) { return []; } }
    function saveApps(list) { try { localStorage.setItem(APPS_KEY, JSON.stringify(list)); } catch (_) {} }

    function makeAppId() {
        const year = new Date().getFullYear();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let suffix = '';
        for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
        return 'APP-' + year + '-' + suffix;
    }

    function initJobApplications() {
        const jobCards = document.querySelectorAll('.job-card');
        if (!jobCards.length) return;

        // Inject the application modal into the page once
        injectApplicationModal();

        jobCards.forEach((card) => {
            const applyBtn = card.querySelector('a.btn-primary, button.btn-primary');
            if (!applyBtn) return;
            applyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const title = (card.querySelector('h4') || {}).textContent || 'Position';
                const meta = (card.querySelector('.meta') || {}).textContent || '';
                openApplicationModal(title.trim(), meta.trim());
            });
        });

        // Show "My Applications" panel if any exist
        renderMyApplications();
    }

    function injectApplicationModal() {
        if (document.getElementById('app-modal')) return;
        const html = `
        <div class="modal-overlay" id="app-modal" role="dialog" aria-modal="true">
            <div class="modal" style="max-width: 680px; text-align: left;">
                <button class="modal-close-x" data-modal-close
                        style="position:absolute;top:14px;right:18px;background:none;border:none;font-size:1.4rem;color:var(--np-gray-500);cursor:pointer">
                    <i class="fas fa-times"></i>
                </button>
                <h3 style="text-align:left">Apply for Position</h3>
                <p style="text-align:left;color:var(--np-gray-500);margin-bottom:1.5rem">
                    <strong id="app-job-title" style="color:var(--np-navy)">—</strong>
                    <br><span id="app-job-meta" style="font-size:0.85rem">—</span>
                </p>
                <form id="app-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="app-name">Full Name <span style="color:var(--np-red)">*</span></label>
                            <input id="app-name" type="text" placeholder="Your full name" required>
                        </div>
                        <div class="form-group">
                            <label for="app-email">Email <span style="color:var(--np-red)">*</span></label>
                            <input id="app-email" type="email" placeholder="you@example.com" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="app-phone">Phone <span style="color:var(--np-red)">*</span></label>
                            <input id="app-phone" type="tel" placeholder="+249 …" required>
                        </div>
                        <div class="form-group">
                            <label for="app-years">Years of Experience <span style="color:var(--np-red)">*</span></label>
                            <select id="app-years" required>
                                <option value="">Select…</option>
                                <option>0–1 years</option>
                                <option>2–4 years</option>
                                <option>5–7 years</option>
                                <option>8–10 years</option>
                                <option>10+ years</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="app-cv">CV / Résumé (PDF, DOCX) <span style="color:var(--np-red)">*</span></label>
                        <input id="app-cv" type="file" accept=".pdf,.doc,.docx" required>
                    </div>
                    <div class="form-group">
                        <label for="app-cover">Cover Letter</label>
                        <textarea id="app-cover" placeholder="Tell us why you're a great fit (optional)" rows="4"></textarea>
                    </div>
                    <div class="consent-row">
                        <input type="checkbox" id="app-consent" required>
                        <label for="app-consent">
                            I consent to Nile Petroleum processing my application data and contacting me about this and similar future opportunities, per the
                            <a href="privacy.html" style="color:var(--np-red);font-weight:600;text-decoration:underline">Privacy Policy</a>.
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
                        <button type="submit" class="btn btn-primary">Submit Application <i class="fas fa-paper-plane"></i></button>
                    </div>
                </form>
            </div>
        </div>

        <div class="modal-overlay" id="app-success" role="dialog" aria-modal="true">
            <div class="modal">
                <div class="modal-icon"><i class="fas fa-check"></i></div>
                <h3>Application Submitted</h3>
                <p>Thank you for applying. Your application has been recorded. Your tracking ID is:</p>
                <div class="ticket-display">
                    <code id="app-id-display">APP-2026-XXXXXX</code>
                    <button class="copy-btn" id="app-copy"><i class="fas fa-copy"></i> Copy</button>
                </div>
                <p style="font-size:0.85rem;color:var(--np-gray-500)">Our talent team will review your profile within 7 working days and contact you on your registered email.</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-modal-close style="width: 100%; justify-content: center;">Close</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        // Wire close
        document.querySelectorAll('[data-modal-close]').forEach((b) => {
            b.addEventListener('click', () => {
                document.getElementById('app-modal').classList.remove('open');
                document.getElementById('app-success').classList.remove('open');
            });
        });
        document.querySelectorAll('#app-modal, #app-success').forEach((m) => {
            m.addEventListener('click', (e) => {
                if (e.target === m) m.classList.remove('open');
            });
        });

        // Wire submit
        const form = document.getElementById('app-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const cvFile = form.querySelector('#app-cv').files[0];
            const app = {
                id: makeAppId(),
                jobTitle: document.getElementById('app-job-title').textContent,
                jobMeta:  document.getElementById('app-job-meta').textContent,
                name:  form.querySelector('#app-name').value.trim(),
                email: form.querySelector('#app-email').value.trim(),
                phone: form.querySelector('#app-phone').value.trim(),
                years: form.querySelector('#app-years').value,
                cover: form.querySelector('#app-cover').value.trim(),
                cvName: cvFile ? cvFile.name : '',
                submittedAt: Date.now(),
            };
            const all = loadApps();
            all.push(app);
            saveApps(all);

            document.getElementById('app-modal').classList.remove('open');
            document.getElementById('app-id-display').textContent = app.id;
            document.getElementById('app-success').classList.add('open');
            form.reset();
            renderMyApplications();
        });

        // Wire copy
        const copyBtn = document.getElementById('app-copy');
        copyBtn.addEventListener('click', async () => {
            const code = document.getElementById('app-id-display').textContent;
            try { await navigator.clipboard.writeText(code); }
            catch (_) {
                const ta = document.createElement('textarea');
                ta.value = code; document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); } catch (e) {}
                document.body.removeChild(ta);
            }
            copyBtn.classList.add('copied');
            const isAr = window.__np_lang === 'ar';
            const original = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> ' + (isAr ? 'تم النسخ' : 'Copied!');
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = original;
            }, 1800);
        });

        if (window.__np_setLanguage && window.__np_lang === 'ar') window.__np_setLanguage('ar');
    }

    function openApplicationModal(title, meta) {
        document.getElementById('app-job-title').textContent = title;
        document.getElementById('app-job-meta').textContent = meta;
        document.getElementById('app-modal').classList.add('open');
        setTimeout(() => document.getElementById('app-name').focus(), 80);
    }

    function renderMyApplications() {
        const apps = loadApps();
        if (!apps.length) return;
        const jobList = document.querySelector('.job-list');
        if (!jobList) return;

        let panel = document.getElementById('my-apps-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'my-apps-panel';
            panel.style.cssText = 'margin-top:3rem;background:var(--np-white);border:1px solid var(--np-gray-100);border-radius:var(--radius-lg);padding:2rem;';
            jobList.parentElement.appendChild(panel);
        }
        const isAr = window.__np_lang === 'ar';
        panel.innerHTML = `
            <h3 style="margin-bottom:1.2rem;font-size:1.15rem;">
                <i class="fas fa-briefcase" style="color:var(--np-red);margin-right:0.5rem;"></i>
                My Applications (${apps.length})
            </h3>
            <div style="display:flex;flex-direction:column;gap:0.7rem;">
                ${apps.slice().reverse().map((a) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:var(--np-gray-50);border-radius:var(--radius-sm);gap:1rem;flex-wrap:wrap;">
                        <div>
                            <div style="font-weight:700;color:var(--np-navy);">${escapeHtml(a.jobTitle)}</div>
                            <div style="font-size:0.8rem;color:var(--np-gray-500);">${escapeHtml(a.jobMeta)} · ${new Date(a.submittedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}</div>
                        </div>
                        <code style="font-family:'Courier New',monospace;color:var(--np-indigo);font-weight:700;letter-spacing:1px;">${a.id}</code>
                        <span class="track-card-status review"><i class="fas fa-circle" style="font-size:6px"></i> Under Review</span>
                    </div>
                `).join('')}
            </div>
        `;
        if (window.__np_setLanguage && window.__np_lang === 'ar') window.__np_setLanguage('ar');
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ===========================================================
       FEATURE 4 — Investor charts (Chart.js, on demand)
       =========================================================== */
    function initInvestorCharts() {
        // Detect investor page by URL or by ticker-card presence
        if (!document.querySelector('.ticker-card')) return;

        // Load Chart.js
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
        s.onload = () => buildInvestorCharts();
        document.head.appendChild(s);
    }

    function buildInvestorCharts() {
        // 1. Replace SVG ticker chart with a richer interactive Chart.js line chart
        const tickerChart = document.querySelector('.ticker-mini-chart');
        if (tickerChart) {
            tickerChart.innerHTML = '<canvas id="chart-ticker"></canvas>';
            tickerChart.style.height = '90px';
            const ctx = document.getElementById('chart-ticker').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: 30 }, (_, i) => i + 1),
                    datasets: [{
                        data: generateStockData(30),
                        borderColor: '#F2A900',
                        backgroundColor: ctx2 => {
                            const gradient = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 100);
                            gradient.addColorStop(0, 'rgba(242,169,0,0.5)');
                            gradient.addColorStop(1, 'rgba(242,169,0,0)');
                            return gradient;
                        },
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: '#F2A900',
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: {
                        backgroundColor: 'rgba(10,20,56,0.95)',
                        callbacks: { label: (ctx) => '$ ' + ctx.parsed.y.toFixed(2) },
                    } },
                    scales: { x: { display: false }, y: { display: false } },
                },
            });
        }

        // 2. Add a quarterly revenue / EBITDA chart after the financials table
        const table = document.querySelector('.financials-table');
        if (table && !document.getElementById('chart-financials')) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'margin-top:2.5rem;background:var(--np-white);border-radius:var(--radius-lg);padding:2rem;border:1px solid var(--np-gray-100);';
            wrap.innerHTML = '<h3 style="margin-bottom:1.5rem;font-size:1.15rem;">Quarterly Revenue &amp; EBITDA (USD m)</h3><div style="height:280px;position:relative;"><canvas id="chart-financials"></canvas></div>';
            table.parentElement.appendChild(wrap);
            const ctx = document.getElementById('chart-financials').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026'],
                    datasets: [
                        { label: 'Revenue', data: [1156, 1212, 1288, 1420], backgroundColor: '#2A2882', borderRadius: 6, borderSkipped: false },
                        { label: 'EBITDA',  data: [281, 295, 312, 348],     backgroundColor: '#F2A900', borderRadius: 6, borderSkipped: false },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { family: getFontFamily() }, padding: 16 } },
                        tooltip: { backgroundColor: 'rgba(10,20,56,0.95)', callbacks: { label: (ctx) => ctx.dataset.label + ': $ ' + ctx.parsed.y + 'm' } },
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { family: getFontFamily(), weight: '600' } } },
                        y: { ticks: { font: { family: getFontFamily() }, callback: (v) => '$ ' + v + 'm' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                    },
                },
            });
        }

        // 3. ESG breakdown doughnut after the report cards
        const reportGrid = document.querySelector('.report-grid');
        if (reportGrid && !document.getElementById('chart-esg')) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'margin-top:2.5rem;background:var(--np-white);border-radius:var(--radius-lg);padding:2rem;border:1px solid var(--np-gray-100);display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:center;';
            wrap.innerHTML = `
                <div>
                    <h3 style="margin-bottom:0.7rem;font-size:1.15rem;">ESG Investment Allocation 2025</h3>
                    <p style="color:var(--np-gray-500);font-size:0.9rem;margin-bottom:1rem;">Total ESG-aligned capital deployment of <strong style="color:var(--np-navy)">USD 180m</strong>, focused on emissions, community, safety, and energy transition.</p>
                </div>
                <div style="height:280px;position:relative;"><canvas id="chart-esg"></canvas></div>
            `;
            reportGrid.parentElement.appendChild(wrap);
            const ctx = document.getElementById('chart-esg').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Emissions Reduction', 'Community Programs', 'Safety & HSE', 'Energy Transition', 'Governance & Audit'],
                    datasets: [{
                        data: [72, 38, 32, 25, 13],
                        backgroundColor: ['#10B981', '#2A2882', '#E32525', '#F2A900', '#374151'],
                        borderWidth: 3,
                        borderColor: '#fff',
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: { position: 'right', labels: { font: { family: getFontFamily(), size: 12 }, padding: 12, boxWidth: 14 } },
                        tooltip: { backgroundColor: 'rgba(10,20,56,0.95)', callbacks: { label: (ctx) => ctx.label + ': $ ' + ctx.parsed + 'm' } },
                    },
                },
            });
        }

        // Translate any newly added text
        if (window.__np_setLanguage && window.__np_lang === 'ar') window.__np_setLanguage('ar');
    }

    function generateStockData(n) {
        const out = [];
        let v = 132 + Math.random() * 6;
        for (let i = 0; i < n; i++) {
            v += (Math.random() - 0.45) * 2.5;
            out.push(Math.max(125, Math.min(150, v)));
        }
        // Ensure last value is ~142
        out[n - 1] = 142.36;
        return out;
    }
    function getFontFamily() {
        return window.__np_lang === 'ar' ? "Cairo, Inter, sans-serif" : "Inter, sans-serif";
    }

    /* ===========================================================
       INIT
       =========================================================== */
    function init() {
        initNewsFilter();
        initStationFilter();
        initJobApplications();
        initInvestorCharts();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

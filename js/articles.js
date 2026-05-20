/* ==========================================================================
   Articles data + interactions
   - Articles data store (9 entries matching news.html cards)
   - Auto-wires news card links to /pages/news-article.html?id=…
   - Renders article on news-article.html using ?id= query param
   ========================================================================== */

(function () {
    'use strict';

    const IN_PAGES = /[\/\\]pages[\/\\]/i.test(window.location.pathname);
    const REL = IN_PAGES ? '' : 'pages/';

    /* ---------- Article data ---------- */
    const ARTICLES = [
        {
            id: 'refinery-phase-2',
            title: 'Khartoum Refinery Phase-II Upgrade Reaches 70% Completion',
            date: '2026-05-04',
            day: '04', mon: 'May',
            category: 'Operations',
            categoryColor: 'indigo',
            readTime: '3 min read',
            image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1600&q=80',
            excerpt: 'The $480M expansion will boost refining capacity by 30% and lower sulfur output to Euro V standards.',
            body: [
                'The Phase-II upgrade of the Khartoum Refinery — Nilepet\'s flagship downstream asset — has officially passed the 70% mark in May 2026, putting the project firmly on track for mechanical completion by Q4 2026 and commissioning early 2027.',
                'Once complete, the $480-million expansion will lift the refinery\'s total processing capacity from 100,000 to 130,000 barrels per day. A new isomerisation unit and hydrotreaters will allow Nilepet to produce Euro V-compliant gasoline and ultra-low-sulfur diesel, aligning Sudan\'s domestic fuel quality with the highest international standards.',
                '"This is a transformational project for the company and the country," said Eng. Yasir Abdallah, Chief Operating Officer. "Beyond capacity, the upgrade reduces our refinery emissions footprint by an estimated 18% per barrel processed."',
                'The project has also been a major driver of local content: more than 60% of construction services were sourced from Sudanese contractors, with 1,200 skilled-worker training hours delivered as part of the build.',
            ],
        },
        {
            id: 'solar-pilot',
            title: 'Nilepet Launches Solar Pilot at 25 Forecourt Stations',
            date: '2026-04-28',
            day: '28', mon: 'Apr',
            category: 'Sustainability',
            categoryColor: 'green',
            readTime: '5 min read',
            image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1600&q=80',
            excerpt: 'Renewable energy integration cuts grid dependency and supports 24/7 service in remote regions.',
            body: [
                'Nilepet announced today the launch of a year-long solar pilot programme covering 25 strategically located fuel stations across five states. Each pilot site will be equipped with rooftop photovoltaic systems and battery storage.',
                'The objective is twofold: ensure uninterrupted 24/7 service even in regions with intermittent grid availability, and validate the economic case for a much wider rollout across the company\'s 450+ station network.',
                'The initial 25 stations are expected to generate approximately 1.2 GWh of clean electricity per year — equivalent to powering 600 average Sudanese households and offsetting around 850 tonnes of CO₂ annually.',
                'The programme is co-funded by Nilepet\'s sustainability budget and a strategic partnership with a leading regional renewable-energy developer.',
            ],
        },
        {
            id: 'strategic-mou',
            title: 'Strategic MoU Signed With Regional E&P Partner',
            date: '2026-04-12',
            day: '12', mon: 'Apr',
            category: 'Partnerships',
            categoryColor: 'red',
            readTime: '2 min read',
            image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=80',
            excerpt: 'The partnership opens new exploration acreage and strengthens technical capacity sharing.',
            body: [
                'Nilepet has signed a Memorandum of Understanding (MoU) with a leading regional exploration and production company to jointly explore frontier acreage in northern and central Sudan.',
                'Under the agreement, the partners will undertake a phased work programme including 2D and 3D seismic acquisition, geological re-interpretation of existing data, and — subject to results — exploratory drilling within 36 months.',
                'In parallel, the partnership establishes a joint technical capability programme: Nilepet engineers and geoscientists will be embedded in the partner\'s technology centres for 12-month rotations, and Sudan-based training will be co-developed.',
                '"This is exactly the kind of partnership we have been seeking — capital, technology, and capability working together to unlock the next chapter of Sudan\'s hydrocarbon potential," said Eng. Ahmed Mahmoud, CEO.',
            ],
        },
        {
            id: 'q1-2026-earnings',
            title: 'Q1-2026 Earnings: Revenue Up 18% YoY',
            date: '2026-04-02',
            day: '02', mon: 'Apr',
            category: 'Investor',
            categoryColor: 'indigo',
            readTime: '4 min read',
            image: 'https://images.unsplash.com/photo-1554200876-56c2f25224fa?w=1600&q=80',
            excerpt: 'Strong volumes and margins drive solid quarterly results.',
            body: [
                'Nilepet reported its Q1-2026 results, delivering revenue of $1.42 billion — an 18% year-on-year increase — and EBITDA of $348 million, up 24% versus the same quarter last year.',
                'Net income rose to $182 million ($0.42 per share), reflecting both higher refined-product volumes and improved gross margins on retail sales.',
                'Production from upstream operations grew by 12% to an average of 124 kbbl/day, driven by the ramp-up of new wells in Blocks 6 and 17. Refining throughput averaged 116 kbbl/day, with utilisation rising to 89% as Phase-II upgrade activities had limited operational impact.',
                'CFO Dr. Salma El-Tayeb commented: "Our diversified portfolio is delivering consistent performance. We continue to invest in capacity, sustainability and digitalisation while maintaining disciplined capital allocation."',
                'Free cash flow for the quarter was $215 million. The Board reconfirmed the existing capital programme of $620 million for FY2026.',
            ],
        },
        {
            id: 'stem-program',
            title: 'Nilepet Sponsors STEM Program for 1,200 Students',
            date: '2026-03-21',
            day: '21', mon: 'Mar',
            category: 'Community',
            categoryColor: 'gold',
            readTime: '3 min read',
            image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=1600&q=80',
            excerpt: 'Annual scholarship and lab-equipment program expands to 4 new states.',
            body: [
                'Nilepet today expanded its flagship STEM (Science, Technology, Engineering and Mathematics) sponsorship programme to four additional states, bringing the total number of beneficiary schools to 47 and reaching over 1,200 students per academic year.',
                'The programme provides modern laboratory equipment, full-tuition scholarships for top performers entering engineering and earth-sciences degrees, and mentorship matches with Nilepet engineers.',
                'Sixty-two percent of this year\'s scholarship recipients are young women — a deliberate result of the company\'s "Women in Energy" focus.',
                'CHRO Mrs. Fatima Hassan said: "We see this not as charity but as our future workforce — and Sudan\'s future energy sector — being built today."',
            ],
        },
        {
            id: 'energy-summit',
            title: 'Nilepet Showcases Digital Strategy at Energy Summit 2026',
            date: '2026-03-14',
            day: '14', mon: 'Mar',
            category: 'Events',
            categoryColor: 'red',
            readTime: '2 min read',
            image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1600&q=80',
            excerpt: 'CIO presented our digital roadmap at the regional energy conference.',
            body: [
                'Nilepet\'s Chief Information Officer delivered a keynote at the Regional Energy Summit 2026 in Dubai, presenting the company\'s end-to-end digital transformation roadmap — from upstream sensor networks to retail customer experience.',
                'The roadmap covers four pillars: data platform consolidation, AI-enabled reservoir and refinery optimisation, modern enterprise applications, and a future-ready cybersecurity baseline aligned with ISO 27001.',
                '"Digital is no longer a vertical, it is the operating system of the modern energy company," the CIO said in his address.',
                'The keynote was followed by a panel on national oil-company digitalisation in emerging markets.',
            ],
        },
        {
            id: 'kassala-depot',
            title: 'New Strategic Depot Inaugurated in Kassala',
            date: '2026-03-02',
            day: '02', mon: 'Mar',
            category: 'Operations',
            categoryColor: 'indigo',
            readTime: '3 min read',
            image: 'https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=1600&q=80',
            excerpt: 'The 80,000 m³ depot strengthens supply security to eastern Sudan.',
            body: [
                'Nilepet inaugurated a new strategic petroleum-products depot in Kassala with a total storage capacity of 80,000 cubic metres across multiple grades — gasoline, diesel, kerosene and LPG.',
                'The facility — built to international API standards — strengthens fuel-supply security to eastern Sudan, reducing dependency on longer pipelines and improving response times during peak demand or emergency events.',
                'The depot is fitted with modern fire-fighting systems, vapour-recovery units to limit emissions, and a SCADA-enabled control room for real-time stock and movement monitoring.',
                'Construction created 240 jobs at peak; 35 permanent operational roles are being filled, with priority given to local Kassala residents.',
            ],
        },
        {
            id: 'sustainability-2025',
            title: '2025 Sustainability Report Published',
            date: '2026-02-18',
            day: '18', mon: 'Feb',
            category: 'Sustainability',
            categoryColor: 'green',
            readTime: '6 min read',
            image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=80',
            excerpt: '10% emissions reduction, 100% community-grievance response within 7 days.',
            body: [
                'Nilepet published its 2025 Sustainability Report, prepared in accordance with the Global Reporting Initiative (GRI) Standards and aligned with the recommendations of the Task Force on Climate-related Financial Disclosures (TCFD).',
                'Key highlights include a 10% year-on-year reduction in Scope 1 + 2 greenhouse-gas emissions, a 14% reduction in freshwater withdrawals, an industry-leading Total Recordable Incident Rate (TRIR) of 0.21 per 200,000 hours worked, and a 100% response rate to community grievances within seven days.',
                'The report sets out updated 2030 targets including a 25% absolute reduction in Scope 1 + 2 emissions from a 2022 baseline, methane-leakage detection on 100% of operated upstream sites, and 30% female representation in technical roles.',
                'The full report can be downloaded from the Investor Relations section.',
            ],
        },
        {
            id: 'lubricants-jv',
            title: 'Joint Venture for Lubricants Blending Plant Signed',
            date: '2026-02-05',
            day: '05', mon: 'Feb',
            category: 'Partnerships',
            categoryColor: 'red',
            readTime: '3 min read',
            image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80',
            excerpt: 'Strengthens local manufacturing capacity for premium lubricants.',
            body: [
                'Nilepet has signed a 60:40 joint-venture agreement with a leading international lubricants brand to construct and operate a state-of-the-art lubricants blending plant in Sudan with an initial capacity of 35,000 tonnes per year.',
                'The facility — to be located adjacent to the Khartoum Refinery — will produce automotive engine oils, hydraulic fluids, industrial gear oils, and specialty greases for both the Sudanese market and export across East Africa.',
                'Construction is scheduled to begin in Q3 2026 with first product expected by Q4 2027.',
                '"This investment localises a value-added segment of the petroleum chain inside Sudan, replaces imports, and supports skilled employment — all while strengthening the Nilepet brand," said Eng. Ahmed Mahmoud, CEO.',
            ],
        },
    ];

    /* ---------- News card linking (on news.html and home news section) ---------- */
    function wireNewsCardLinks() {
        const cards = document.querySelectorAll('.news-grid .news-card');
        if (!cards.length) return;

        cards.forEach((card) => {
            const titleAnchor = card.querySelector('h3 a');
            if (!titleAnchor) return;
            const titleText = titleAnchor.textContent.trim();

            // Match by exact text or substring
            const article = ARTICLES.find((a) =>
                a.title.toLowerCase() === titleText.toLowerCase() ||
                titleText.toLowerCase().includes(a.title.toLowerCase().substring(0, 40))
            );
            if (!article) return;

            const articleUrl = REL + 'news-article.html?id=' + article.id;
            titleAnchor.setAttribute('href', articleUrl);

            // Update other "Read article" link inside the card
            const readLink = card.querySelector('a.btn-link');
            if (readLink) readLink.setAttribute('href', articleUrl);

            // Mark the card for filtering
            card.dataset.articleId = article.id;
        });
    }

    /* ---------- Article page rendering ---------- */
    function renderArticlePage() {
        const container = document.getElementById('article-container');
        if (!container) return;

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const article = ARTICLES.find((a) => a.id === id);

        if (!article) {
            container.innerHTML = `
                <div class="track-empty" style="margin: 4rem 0;">
                    <i class="fas fa-newspaper"></i>
                    <h4>Article not found</h4>
                    <p>The article you are looking for does not exist.</p>
                    <a href="news.html" class="btn btn-primary" style="margin-top:1.5rem;">
                        <i class="fas fa-arrow-left"></i> Back to News
                    </a>
                </div>
            `;
            if (window.__np_setLanguage && window.__np_lang === 'ar') window.__np_setLanguage('ar');
            return;
        }

        // Set title
        document.title = article.title + ' | Nile Petroleum Company Limited';

        // Build related articles (same category, exclude current)
        const related = ARTICLES.filter((a) => a.category === article.category && a.id !== article.id).slice(0, 3);

        container.innerHTML = `
            <article class="article-detail">
                <header class="article-header">
                    <span class="chip ${article.categoryColor}">${article.category}</span>
                    <h1>${escapeHtml(article.title)}</h1>
                    <div class="article-meta">
                        <span><i class="fas fa-calendar"></i> Published ${formatDate(article.date)}</span>
                        <span><i class="fas fa-clock"></i> ${article.readTime}</span>
                    </div>
                </header>

                <div class="article-hero">
                    <img src="${article.image}" alt="${escapeHtml(article.title)}">
                </div>

                <div class="article-body">
                    ${article.body.map((p) => '<p>' + escapeHtml(p) + '</p>').join('')}
                </div>

                <div class="article-actions">
                    <div class="article-share">
                        <span style="font-weight:600;color:var(--np-navy);margin-right:0.6rem;">Share this article</span>
                        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" aria-label="X / Twitter"><i class="fab fa-x-twitter"></i></a>
                        <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                        <a href="#" aria-label="Copy link" onclick="navigator.clipboard.writeText(window.location.href);return false;"><i class="fas fa-link"></i></a>
                    </div>
                    <a href="news.html" class="btn btn-ghost"><i class="fas fa-arrow-left"></i> Back to News</a>
                </div>
            </article>

            ${related.length ? `
            <section class="article-related">
                <h2 style="margin-bottom: 2rem;">Related Articles</h2>
                <div class="news-grid">
                    ${related.map((r) => `
                        <article class="news-card">
                            <div class="news-thumb">
                                <img src="${r.image}" alt="">
                                <div class="news-date"><span class="day">${r.day}</span><span class="mon">${r.mon}</span></div>
                            </div>
                            <div class="news-body">
                                <div class="news-meta">
                                    <span class="chip ${r.categoryColor}">${r.category}</span>
                                    <span class="chip">${r.readTime}</span>
                                </div>
                                <h3><a href="news-article.html?id=${r.id}">${escapeHtml(r.title)}</a></h3>
                                <p>${escapeHtml(r.excerpt)}</p>
                                <a href="news-article.html?id=${r.id}" class="btn-link">Read article <i class="fas fa-arrow-right"></i></a>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>
            ` : ''}
        `;

        // Re-translate for current language
        if (window.__np_setLanguage && window.__np_lang === 'ar') window.__np_setLanguage('ar');
    }

    function formatDate(iso) {
        const d = new Date(iso);
        const isAr = window.__np_lang === 'ar';
        return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ---------- Init ---------- */
    function init() {
        wireNewsCardLinks();
        renderArticlePage();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

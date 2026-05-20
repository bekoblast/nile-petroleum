/* ============================================================
   Nilepet Technical Proposal — Word document generator
   ============================================================ */

const fs = require('fs');
const path = require('path');
const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, PageOrientation, LevelFormat,
    HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
    PageNumber, PageBreak, TabStopType, TabStopPosition,
    TableOfContents, ExternalHyperlink, Bookmark, InternalHyperlink,
} = require('docx');

/* ----------------------------------------------------------------
   Style constants
   ---------------------------------------------------------------- */
const COLOR = {
    red:    'E32525',
    indigo: '2A2882',
    gold:   'F2A900',
    navy:   '0A1438',
    grayDark:  '374151',
    grayLight: 'D1D5DB',
    grayBg:   'F3F4F6',
    headerBg: '2A2882',
    headerTxt:'FFFFFF',
    altRow:   'F9FAFB',
};

const FONT = 'Calibri';
const BODY_SIZE   = 22;   // 11 pt
const SMALL_SIZE  = 18;   // 9 pt

const A4 = { width: 11906, height: 16838 };
const CONTENT_WIDTH = A4.width - 2 * 1440; // 9026 DXA with 1" margins

/* ---------------- Helpers ---------------- */
function p(text, opts) {
    opts = opts || {};
    return new Paragraph({
        spacing: { before: opts.before || 0, after: opts.after || 120 },
        alignment: opts.align || AlignmentType.LEFT,
        children: Array.isArray(text)
            ? text
            : [new TextRun({ text, bold: !!opts.bold, italics: !!opts.italics,
                             size: opts.size || BODY_SIZE, color: opts.color || '000000', font: FONT })],
    });
}

function heading(text, level, opts) {
    opts = opts || {};
    const headingLevel = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
    }[level];
    return new Paragraph({
        heading: headingLevel,
        spacing: { before: opts.before || (level === 1 ? 480 : 320), after: opts.after || 200 },
        pageBreakBefore: !!opts.pageBreakBefore,
        children: [new TextRun({ text, font: FONT })],
    });
}

function bullet(text, level) {
    return new Paragraph({
        numbering: { reference: 'bullets', level: level || 0 },
        spacing: { after: 100 },
        children: [new TextRun({ text, size: BODY_SIZE, font: FONT })],
    });
}

function numbered(text, level) {
    return new Paragraph({
        numbering: { reference: 'numbers', level: level || 0 },
        spacing: { after: 100 },
        children: [new TextRun({ text, size: BODY_SIZE, font: FONT })],
    });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

/* ---------------- Table builders ---------------- */
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: COLOR.grayLight };
const ALL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function cell(content, opts) {
    opts = opts || {};
    const paragraphs = (Array.isArray(content) ? content : [content]).map((c) => {
        if (typeof c === 'string') {
            return new Paragraph({
                alignment: opts.align || AlignmentType.LEFT,
                spacing: { after: 60 },
                children: [new TextRun({
                    text: c,
                    bold: !!opts.bold,
                    color: opts.color || (opts.header ? COLOR.headerTxt : '000000'),
                    size: opts.size || (opts.header ? 20 : BODY_SIZE),
                    font: FONT,
                })],
            });
        }
        return c;
    });
    return new TableCell({
        width: { size: opts.width, type: WidthType.DXA },
        verticalAlign: VerticalAlign.TOP,
        borders: ALL_BORDERS,
        shading: opts.header
            ? { fill: COLOR.headerBg, type: ShadingType.CLEAR, color: 'auto' }
            : (opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR, color: 'auto' } : undefined),
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: paragraphs,
    });
}

function headerRow(cellsArr, widths) {
    return new TableRow({
        tableHeader: true,
        children: cellsArr.map((txt, i) => cell(txt, { header: true, width: widths[i], bold: true })),
    });
}

function dataRow(cellsArr, widths, alt) {
    return new TableRow({
        children: cellsArr.map((txt, i) =>
            cell(txt, { width: widths[i], shade: alt ? COLOR.altRow : undefined })),
    });
}

function buildTable(headers, rows, widths) {
    const tableRows = [headerRow(headers, widths)];
    rows.forEach((r, idx) => tableRows.push(dataRow(r, widths, idx % 2 === 1)));
    return new Table({
        width: { size: widths.reduce((a,b) => a+b, 0), type: WidthType.DXA },
        columnWidths: widths,
        rows: tableRows,
    });
}

/* ============================================================
   CONTENT
   ============================================================ */

/* ------ COVER PAGE ------ */
const coverContent = [
    new Paragraph({ spacing: { before: 2400, after: 240 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'TECHNICAL PROPOSAL', bold: true, size: 56,
                                  color: COLOR.indigo, font: FONT })] }),
    new Paragraph({ spacing: { after: 1200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Website Development for', size: 32, color: COLOR.grayDark, font: FONT })] }),
    new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'NILE PETROLEUM COMPANY LIMITED', bold: true,
                                  size: 44, color: COLOR.red, font: FONT })] }),
    new Paragraph({ spacing: { after: 1600 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '(Nilepet)', italics: true, size: 28, color: COLOR.grayDark, font: FONT })] }),
    new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'In response to Invitation to Bid (ITB)',
                                  size: 22, color: COLOR.grayDark, font: FONT })] }),
    new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Dated: 10 March 2026 — Version 1.0',
                                  size: 22, color: COLOR.grayDark, font: FONT })] }),
    new Paragraph({ spacing: { before: 2000, after: 100 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Submitted by:', size: 22, color: COLOR.grayDark, font: FONT })] }),
    new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '[Your Company Name]', bold: true, size: 32,
                                  color: COLOR.indigo, font: FONT })] }),
    new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '[Address line — City, Country]', size: 20, color: COLOR.grayDark, font: FONT })] }),
    new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '[Phone] · [Email] · [Website]', size: 20, color: COLOR.grayDark, font: FONT })] }),
    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Submission Date: __________________________',
                                  size: 22, color: COLOR.grayDark, font: FONT })] }),
    pageBreak(),
];

/* ------ TABLE OF CONTENTS ------ */
const tocContent = [
    heading('Table of Contents', 1),
    new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
    pageBreak(),
];

/* ------ COVER LETTER ------ */
const coverLetterContent = [
    heading('Letter of Submission', 1),
    p('[Your Company Letterhead]', { italics: true, color: COLOR.grayDark, after: 240 }),
    p('Date: ___________________', { after: 240 }),
    p('To,'),
    p('The Procurement Committee'),
    p('Nile Petroleum Company Limited'),
    p('Khartoum, Republic of Sudan', { after: 320 }),
    p('Subject: Submission of Technical Proposal for Website Development', { bold: true, after: 320 }),
    p('Dear Sir / Madam,', { after: 240 }),
    p('With reference to your Invitation to Bid (ITB) dated 10 March 2026 for Website Development for Nile Petroleum Company Limited, we are pleased to submit our Technical Proposal for your kind consideration.'),
    p('Our company combines deep technical expertise with a strong track record delivering enterprise web solutions for the energy and petroleum sector. We have carefully studied the requirements set out in the ITB and are confident in our ability to deliver a high-quality, secure, scalable, and fully bilingual (Arabic and English) website that meets every functional, technical, and compliance requirement specified.'),
    p('We confirm our full compliance with the mandatory technology stack (ASP.NET Core MVC with Razor, React frontend, and MS SQL Server backend) and our commitment to adhere to all relevant standards including WCAG 2.1 AA, GDPR, and ISO 27001.'),
    p('We have included a live demonstration of our design vision and approach at the following URL, which can serve as a visual reference accompanying this proposal:'),
    p('Demonstration site: [insert your Netlify demo URL here]', { bold: true, after: 320 }),
    p('Our proposal remains valid for ninety (90) days from the submission date. Should you require any clarification or additional information, please do not hesitate to contact the undersigned.'),
    p('We look forward to the opportunity of partnering with Nile Petroleum Company Limited and contributing to its digital transformation journey.', { after: 320 }),
    p('Yours faithfully,', { after: 480 }),
    p('___________________________________'),
    p('[Authorised Signatory Name]', { bold: true }),
    p('[Designation]'),
    p('[Your Company Name]'),
    p('[Email] · [Phone]'),
    pageBreak(),
];

/* ------ 1. EXECUTIVE SUMMARY ------ */
const execSummary = [
    heading('1. Executive Summary', 1),
    p('This Technical Proposal sets out our complete response to Nile Petroleum Company Limited (hereinafter "Nilepet" or "the Client") for the design, development, deployment, and maintenance of an enterprise-grade corporate website.'),
    heading('1.1 Engagement Snapshot', 2),
    buildTable(
        ['Item', 'Detail'],
        [
            ['Client', 'Nile Petroleum Company Limited (Nilepet), Republic of Sudan'],
            ['Project', 'Design, build, and launch the corporate website (15+ functional pages, multi-language CMS)'],
            ['Mandatory Stack', 'ASP.NET Core MVC (Razor) · React.js · MS SQL Server'],
            ['Languages', 'English & Arabic (RTL); bilingual content authoring'],
            ['Hosting', 'High-availability cloud (Microsoft Azure recommended) with 99.9 % SLA'],
            ['Duration', '100 working days (≈ 4.5 calendar months)'],
            ['Methodology', 'Agile (Scrum) with 2-week sprints and weekly client demos'],
            ['Compliance', 'WCAG 2.1 AA · GDPR · ISO 27001 · TLS 1.3 · HSTS · 2FA · RBAC'],
            ['Warranty', '6 months post-launch warranty plus optional managed support'],
        ],
        [3000, 6026]
    ),
    heading('1.2 Why Our Proposal', 2),
    p('Our proposal stands out on the following strategic dimensions:'),
    bullet('Proven petroleum-sector experience: prior work delivering corporate portals for oil & gas, energy regulators and utilities clients.'),
    bullet('Native bilingual delivery: in-house Arabic content engineering and RTL design specialists; the demo site already evidences full EN ↔ AR support.'),
    bullet('Security-first engineering: every architectural decision is mapped against ISO 27001 controls and GDPR principles.'),
    bullet('Future-proof architecture: clean separation of concerns (presentation, business, data, integration) enabling future modules such as e-tendering, supplier portal, customer self-service.'),
    bullet('Transparent delivery: weekly client demos, fortnightly steering reports, jointly maintained risk register, and full IPR transfer at handover.'),
    bullet('Local empowerment: knowledge-transfer and CMS training are core deliverables, not afterthoughts — Nilepet staff will own and operate the platform from day one.'),
    pageBreak(),
];

/* ------ 2. COMPANY PROFILE ------ */
const companyProfile = [
    heading('2. Company Profile', 1),
    p('Note to vendor: replace the placeholders below with your real company details, financial statements, key engagements, and CVs.', { italics: true, color: COLOR.grayDark }),
    heading('2.1 Identity', 2),
    buildTable(
        ['Field', 'Detail'],
        [
            ['Legal Name', '[Your Company Name]'],
            ['Registration No.', '[CR / VAT / Trade Licence No.]'],
            ['Year Established', '[YYYY]'],
            ['Head Office', '[City, Country]'],
            ['Authorised Signatory', '[Name, Title]'],
            ['Contact', '[Email] · [Phone]'],
            ['Website', '[URL]'],
        ],
        [3000, 6026]
    ),
    heading('2.2 Core Competencies', 2),
    p('We deliver enterprise-grade digital products across the following streams:'),
    bullet('Custom web application development on Microsoft stack (ASP.NET Core MVC, Razor Pages, Blazor) and modern JavaScript frameworks (React, Next.js, Angular).'),
    bullet('Headless and hybrid content management systems (Umbraco, Strapi, Contentful, Sitecore).'),
    bullet('Cloud architecture and DevOps on Microsoft Azure and Amazon Web Services with infrastructure-as-code (Terraform, Bicep).'),
    bullet('Information security advisory aligned with ISO 27001, NIST CSF, and PCI-DSS.'),
    bullet('Accessibility engineering and WCAG audits.'),
    bullet('Arabic localisation and RTL UI/UX design.'),
    heading('2.3 Selected Past Engagements', 2),
    p('(Vendor to populate with real references including client name, project, year, scope, contract value, and contact reference.)', { italics: true, color: COLOR.grayDark }),
    buildTable(
        ['#', 'Client', 'Project', 'Year', 'Value'],
        [
            ['1', '[Petroleum / Energy client]', '[Corporate portal + investor section]', '[2024]', '[USD ___]'],
            ['2', '[Energy regulator]', '[Bilingual portal + e-services]', '[2023]', '[USD ___]'],
            ['3', '[Utility company]', '[CMS migration & mobile app]', '[2022]', '[USD ___]'],
            ['4', '[Government ministry]', '[Public services portal]', '[2022]', '[USD ___]'],
            ['5', '[Industrial corporate]', '[ESG reporting platform]', '[2021]', '[USD ___]'],
        ],
        [600, 2500, 3926, 1000, 1000]
    ),
    heading('2.4 Financial Stability', 2),
    p('Audited financial statements for the last three (3) fiscal years are attached as Appendix A. Our average annual turnover for the past three years is [USD __ million], with positive equity and no outstanding tax or litigation issues. Bankers\' references and a bank-issued financial standing letter are also enclosed.'),
    heading('2.5 Quality & Compliance Certifications', 2),
    bullet('ISO 9001 (Quality Management) — Certificate No. [___]'),
    bullet('ISO 27001 (Information Security) — Certificate No. [___]'),
    bullet('CMMI / industry certifications as applicable'),
    pageBreak(),
];

/* ------ 3. UNDERSTANDING ------ */
const understanding = [
    heading('3. Understanding of Requirements', 1),
    p('Nilepet is the national petroleum company of the Republic of Sudan, operating across upstream, midstream, and downstream segments. The corporate website is a strategic asset that must:'),
    bullet('Project Nilepet as a modern, transparent, and credible national energy company to investors, customers, partners, regulators, and the public.'),
    bullet('Operate flawlessly in both Arabic and English with full content equivalence.'),
    bullet('Centralise communication channels — news, careers, fuel-station locator, investor relations, HSE & ESG, and customer feedback.'),
    bullet('Comply rigorously with international security, privacy, and accessibility standards.'),
    bullet('Be administered locally by Nilepet staff via a powerful but intuitive CMS.'),
    heading('3.1 Key Functional Drivers Identified from the ITB', 2),
    bullet('A retail-fuel-station locator with mapping, search and filter capabilities (Section II of the ITB).'),
    bullet('An investor-relations hub with downloadable reports, financial summary tables and stock/index references (Section V).'),
    bullet('A bilingual complaint-management module with tracking ID, escalation workflow and SLA monitoring (Section II of the General Requirements).'),
    bullet('An advanced search facility with full-text indexing and metadata filtering across news, reports, services, and stations.'),
    bullet('A career portal with online job applications and résumé storage (Annexure B).'),
    bullet('An HSE & ESG section featuring sustainability reports, KPIs, emissions disclosures, and ESG transparency.'),
    bullet('Integration hooks for future ERP/CRM (SAP, Oracle, Microsoft Dynamics) and payment-related systems.'),
    heading('3.2 Non-Functional Drivers', 2),
    bullet('High availability (≥ 99.9 % monthly uptime) — eliminates downtime during peak investor / news events.'),
    bullet('Performance — Largest Contentful Paint ≤ 2.5 s on desktop, ≤ 3.5 s on 3G mobile (Core Web Vitals "Good").'),
    bullet('Security — HTTPS only with TLS 1.3, HSTS, WAF, 2FA for all admin users, RBAC, audit logging.'),
    bullet('Accessibility — WCAG 2.1 Level AA conformance, screen-reader and keyboard navigation friendly.'),
    bullet('Maintainability — clean modular codebase, comprehensive technical documentation, source-code escrow option.'),
    pageBreak(),
];

/* ------ 4. PROPOSED SOLUTION ------ */
const solution = [
    heading('4. Proposed Solution and Architecture', 1),
    heading('4.1 Solution Overview', 2),
    p('We propose a multi-tier web platform built on Microsoft technologies, combining a server-rendered ASP.NET Core MVC backbone (with Razor views) for SEO-friendly public pages, and a React-based single-page front-end for highly interactive sections (fuel-station map, investor dashboards, complaint tracker, search). All content is managed centrally in MS SQL Server through a custom CMS administered by Nilepet staff.'),
    heading('4.2 Mandatory Technology Stack', 2),
    buildTable(
        ['Layer', 'Technology', 'Rationale'],
        [
            ['Server-side rendering', 'ASP.NET Core 8 + Razor Views', 'SEO-friendly HTML, fast first paint, mandated by ITB Section V.'],
            ['Interactive client SPA', 'React 18 + TypeScript + Vite', 'Modern component framework for dashboards, maps, and dynamic UI; mandated by ITB.'],
            ['Database', 'Microsoft SQL Server 2022', 'Mandated by ITB; ACID compliance, full-text search, geo indexes for stations.'],
            ['CMS', 'Custom modules + Umbraco-style admin (.NET-native)', 'Bilingual content authoring, workflows, media library, versioning.'],
            ['Authentication', 'ASP.NET Core Identity + TOTP 2FA', 'RBAC, MFA, lockout, password complexity.'],
            ['API', 'ASP.NET Core Web API (REST + OpenAPI 3)', 'For React front-end and future ERP/CRM integration.'],
            ['Maps', 'Google Maps Platform (or OpenStreetMap fallback)', 'Fuel-station locator, route planning, geocoding.'],
            ['Search', 'SQL Server Full-Text Search + Azure Cognitive Search (optional)', 'Metadata + full-text indexing across content types.'],
            ['Reverse proxy / WAF', 'Azure Application Gateway + WAF (OWASP rules)', 'Layer-7 firewall, DDoS protection, TLS termination.'],
            ['Observability', 'Application Insights + Log Analytics', 'Real-time performance, error tracking, audit trail.'],
            ['CI/CD', 'Azure DevOps Pipelines or GitHub Actions', 'Automated build, test, deploy with approvals.'],
            ['Source Control', 'Git (Azure Repos or GitHub Enterprise)', 'Branch policies, code review, traceability.'],
        ],
        [2200, 2600, 4226]
    ),
    heading('4.3 Logical Architecture', 2),
    p('The platform is organised into five logical tiers:'),
    numbered('Presentation Tier — server-rendered Razor pages for static-leaning content (Home, About, News article reads) and a React SPA for interactive features (locator, investor charts, complaint workflows). Both share the same design system and brand identity.'),
    numbered('Application Tier — ASP.NET Core MVC controllers, Web API endpoints, and background workers (e-mail, scheduled imports, search index rebuilds). Business logic is isolated in service classes; the layer enforces validation, authorisation, and audit logging.'),
    numbered('Data Tier — MS SQL Server with normalised content schema, audit tables, soft-delete patterns, and full-text catalogues. Read replicas can be added for analytics workloads.'),
    numbered('Integration Tier — outbound and inbound webhooks, REST adapters for CRM (Microsoft Dynamics / Salesforce) and ERP (SAP S/4HANA, Oracle E-Business Suite). Decoupled via an internal message bus (Azure Service Bus) for resilience.'),
    numbered('Security & Identity Tier — Azure Application Gateway / WAF in front of all traffic, ASP.NET Core Identity for end users, Microsoft Entra ID (Azure AD) for administrators with conditional access and 2FA.'),
    heading('4.4 Cloud Deployment Topology (Microsoft Azure)', 2),
    bullet('Resource Group per environment: nilepet-dev, nilepet-uat, nilepet-prod.'),
    bullet('Compute: Azure App Service (Linux, Premium v3) — auto-scale 2-10 instances; zone-redundant deployment.'),
    bullet('Database: Azure SQL Database (Business Critical) with geo-replication to a secondary region.'),
    bullet('Storage: Azure Blob Storage for media (images, PDFs) with Azure CDN front-end.'),
    bullet('Secrets: Azure Key Vault (managed identities, no secrets in code).'),
    bullet('Backup: daily encrypted backups with 35-day retention; weekly long-term snapshots.'),
    bullet('DR: cross-region warm-standby, RTO ≤ 4 hours, RPO ≤ 1 hour.'),
    heading('4.5 Security Architecture (summary)', 2),
    bullet('HTTPS-only with TLS 1.3, HSTS enabled, no SHA-1 certificates.'),
    bullet('OWASP Top-10 protections enforced at WAF and in code (CSRF tokens, SQL parameterisation, output encoding).'),
    bullet('Role-Based Access Control (RBAC) for CMS with granular permissions per module.'),
    bullet('Two-Factor Authentication (TOTP) for all administrative roles.'),
    bullet('Encryption at rest (AES-256) and in transit (TLS 1.3); SQL Transparent Data Encryption (TDE) enabled.'),
    bullet('Comprehensive audit log of all CMS actions, exportable for compliance reviews.'),
    bullet('Regular automated and manual security scanning; annual third-party penetration test.'),
    pageBreak(),
];

/* ------ 5. SCOPE RESPONSE ------ */
const scope = [
    heading('5. Scope of Services Response', 1),
    p('The following table summarises our response to each module identified in Annexure B of the ITB.'),
    buildTable(
        ['Component', 'ITB Requirement', 'Our Proposed Deliverable'],
        [
            ['Home Page', 'Banners, news highlights', 'Configurable hero banner, latest news, services preview, investor ticker, ESG snapshot, CTAs.'],
            ['About Us', 'Profile, mission, vision, team, chairman', 'Multi-section module with timeline, leadership grid, chairman quote, downloadable corporate brochure.'],
            ['Services', 'List of services/products', 'CMS-driven services catalogue with per-service detail pages, downloadable datasheets.'],
            ['Fuel Stations', 'Map locations', 'Interactive Google Maps locator with state, service, 24/7 filters and station detail cards.'],
            ['News', 'Latest news + announcements', 'Multi-category news engine with tags, scheduling, image gallery, social-share, RSS feed.'],
            ['Careers', 'Job postings + applications', 'Job-board module: post job, applicant tracker, résumé upload, e-mail notifications.'],
            ['Contact Us', 'Address, map, form', 'Bilingual form, complaint tracker with ticket ID, embedded map, multi-recipient routing.'],
            ['CMS', 'Authoring and publishing', 'Custom Razor-based admin with WYSIWYG editor, draft/publish workflow, version history, media library.'],
            ['Security', 'SSL, RBAC, 2FA', 'TLS 1.3, HSTS, WAF, ASP.NET Identity + TOTP, granular roles, audit log.'],
            ['Integrations', 'ERP / CRM APIs', 'REST + OpenAPI; ready adapters for SAP, Oracle EBS, Dynamics 365, Salesforce.'],
            ['HSE & ESG', 'Policies + reports', 'KPI dashboard, downloadable sustainability reports (PDF), policy library with search.'],
            ['Investor Relations', 'Reports, stock info', 'Reports library, financial-summary widgets, quarterly tables, reference index ticker.'],
            ['Data Visualisation', 'Maps, charts, widgets', 'D3.js / Chart.js dashboards with downloadable raw datasets (CSV / Excel).'],
        ],
        [1700, 2400, 4926]
    ),
    pageBreak(),
];

/* ------ 6. COMPLIANCE MATRIX ------ */
const compliance = [
    heading('6. Compliance Matrix', 1),
    p('We confirm complete compliance with the technical requirements of the ITB. The table below maps each requirement to our proposed solution.'),
    buildTable(
        ['Category', 'ITB Requirement', 'Standard', 'Compliance', 'Our Approach'],
        [
            ['Security', 'SSL & Encryption', 'TLS 1.3, HSTS, no SHA-1', 'Full', 'TLS 1.3, HSTS preloaded, certificates via DigiCert/Sectigo.'],
            ['Security', 'Access Control', 'RBAC + 2FA', 'Full', 'ASP.NET Identity RBAC + TOTP 2FA for all admin accounts; SSO for enterprise users.'],
            ['Performance', 'Hosting & Speed', 'High-availability cloud', 'Full', 'Azure App Service Premium v3, zone-redundant, CDN, autoscaling 2-10 instances.'],
            ['Structure', 'UI/UX & Mobile', 'Responsive, Section 508', 'Full', 'Mobile-first responsive design, WCAG 2.1 AA, keyboard & screen-reader friendly.'],
            ['Content', 'Investor Relations', 'Secure, easily updated', 'Full', 'Dedicated CMS module with secure file uploads, version control, scheduled publication.'],
            ['Content', 'HSE & ESG', 'Visible HSE policies', 'Full', 'Top-level menu, prominent CTAs, KPI dashboard, downloadable PDFs, search-indexed.'],
            ['Functionality', 'Data Visualisation', 'Interactive maps & widgets', 'Full', 'Google Maps + D3.js dashboards; real-time data feeds; downloadable datasheets.'],
            ['Integration', 'Third-party Systems', 'CRM, ERP APIs', 'Full', 'REST + OpenAPI 3 specifications; pre-built adapters for SAP, Oracle, Dynamics.'],
            ['Compliance', 'Data Governance', 'GDPR, ISO 27001', 'Full', 'Privacy notice, consent banner, DSAR workflow, ISO 27001 ISMS aligned controls.'],
            ['Support', 'Maintenance', '24/7 uptime monitoring', 'Full', 'Application Insights, alerting, on-call rota, monthly patching, annual pen-test.'],
            ['Bilingual', 'EN / AR with RTL', 'Modern Standard Arabic', 'Full', 'Native bilingual CMS, full RTL CSS, Arabic content authoring guidelines.'],
            ['Search', 'Full-text + metadata', 'Across all content', 'Full', 'SQL Server Full-Text Search with optional Azure Cognitive Search.'],
            ['Complaints', 'Bilingual management', 'Tracking & SLA', 'Full', 'Ticket module with unique ID, status workflow, e-mail/SMS notifications, dashboards.'],
            ['Accessibility', 'WCAG 2.1 AA', 'Section 508 also', 'Full', 'Automated (axe-core) + manual audits each sprint; remediation prior to UAT.'],
            ['Backup', 'Daily backups', 'High-availability', 'Full', 'Azure SQL automatic daily backups (35-day retention) + LTR snapshots.'],
            ['Monitoring', '24/7 monitoring', 'Patches, pen-tests', 'Full', 'Azure Monitor + Application Insights + Defender for Cloud; quarterly vuln scans.'],
        ],
        [1500, 2000, 1800, 1200, 2526]
    ),
    pageBreak(),
];

/* ------ 7. METHODOLOGY ------ */
const methodology = [
    heading('7. Project Methodology', 1),
    heading('7.1 Approach', 2),
    p('We will deliver the project using a hybrid Agile methodology, blending the rigour of phase-gated stage delivery (so contractual milestones are clear and auditable) with the responsiveness of Agile Scrum (so the client sees and influences working software every two weeks).'),
    heading('7.2 Phases', 2),
    bullet('Phase 1 — Discovery & Planning (10 days): requirements workshops, content audit, design moodboards, technical kick-off, finalised backlog.'),
    bullet('Phase 2 — UI/UX Design (15 days): wireframes, high-fidelity mockups in English & Arabic, design-system tokens, stakeholder sign-off.'),
    bullet('Phase 3 — Development (45 days): six 2-week sprints producing functioning increments; CMS, modules, integrations, security hardening.'),
    bullet('Phase 4 — Testing & UAT (15 days): functional, regression, performance, accessibility, security, browser/device matrix.'),
    bullet('Phase 5 — Deployment & Go-Live (5 days): production cut-over, DNS migration, smoke tests, content load.'),
    bullet('Phase 6 — Training & Knowledge Transfer (5 days): CMS authoring workshops, technical handover, runbook walkthrough.'),
    bullet('Phase 7 — Warranty & Handover (5 days): final acceptance, source-code transfer, IPR assignment, ESCROW deposit.'),
    heading('7.3 Sprint Cadence', 2),
    p('During the development phase we operate on 2-week Scrum sprints with the following ceremonies:'),
    bullet('Sprint Planning (Monday Week 1): backlog grooming, story commitment.'),
    bullet('Daily Stand-up (15 min, remote): progress, blockers, focus for the day.'),
    bullet('Mid-Sprint Demo (Friday Week 1): early visibility for the client.'),
    bullet('Sprint Review & Demo (Friday Week 2): showcase increment, gather feedback.'),
    bullet('Sprint Retrospective (Friday Week 2): continuous improvement.'),
    heading('7.4 Communication & Governance', 2),
    bullet('Weekly status report to the Nilepet Project Manager — progress, risks, decisions needed.'),
    bullet('Fortnightly Steering Committee — scope changes, milestone sign-offs.'),
    bullet('Joint Risk & Issue Register maintained in Azure DevOps Boards (read access for Nilepet).'),
    bullet('Single point of contact (SPOC) on both sides for daily coordination.'),
    pageBreak(),
];

/* ------ 8. PROJECT PLAN ------ */
const plan = [
    heading('8. Project Plan and Gantt Chart', 1),
    p('The following plan delivers the website within 100 working days (≈ 4.5 calendar months) from the contract effective date. It follows the template in Annexure A of the ITB.'),
    buildTable(
        ['Phase', 'Tasks', 'Start (D+)', 'End (D+)', 'Duration', 'Responsible'],
        [
            ['1. Planning',     'Requirements gathering, approvals',  'D+0',  'D+10', '10 days', 'PM + BA'],
            ['2. Design',       'Wireframes, UI/UX, design system',   'D+11', 'D+25', '15 days', 'Design Team'],
            ['3. Development',  'Front-end & Back-end coding',        'D+26', 'D+70', '45 days', 'Dev Team'],
            ['4. Integration',  'API integration, CMS setup, QA',     'D+50', 'D+75', '25 days', 'QA + Dev'],
            ['5. UAT',          'Client testing, bug-fix, sign-off',   'D+76', 'D+85', '10 days', 'Nilepet + QA'],
            ['6. Deployment',   'Hosting setup, Go-live',             'D+86', 'D+90', '5 days',  'DevOps Team'],
            ['7. Training',     'Staff training & documentation',     'D+88', 'D+92', '5 days',  'Training Team'],
            ['8. Handover',     'Final audit, source-code transfer',  'D+93', 'D+95', '3 days',  'PM'],
            ['9. Warranty',     'Post-launch warranty (3 months)',    'D+95', 'D+155','60 days', 'Support'],
        ],
        [1500, 2826, 900, 900, 1200, 1700]
    ),
    p(' ', { after: 60 }),
    p('Note: tasks 4 and 7 overlap with earlier phases to compress the timeline (parallel execution) without compromising quality gates.', { italics: true, color: COLOR.grayDark }),
    heading('8.1 Key Milestones (Payment-Linked)', 2),
    buildTable(
        ['Milestone', 'Trigger', '% Payment'],
        [
            ['M1 — Kick-off',        'Contract signing + mobilisation',   '20 %'],
            ['M2 — Design Approval', 'Sign-off on UI/UX deliverables',    '15 %'],
            ['M3 — Development Complete', 'All modules feature-complete, dev environment demo', '25 %'],
            ['M4 — UAT Acceptance',  'Successful UAT sign-off',           '20 %'],
            ['M5 — Go-Live',         'Production launch on Nilepet URL',  '15 %'],
            ['M6 — Final Acceptance','End of warranty period (3 months post-go-live)', '5 %'],
        ],
        [3026, 4500, 1500]
    ),
    pageBreak(),
];

/* ------ 9. TEAM ------ */
const team = [
    heading('9. Team Structure and Key Personnel', 1),
    p('A dedicated team of 9 specialists will be assigned to the project. Detailed CVs are provided in Appendix B; the table below summarises the key roles.'),
    buildTable(
        ['Role', 'Allocation', 'Key Responsibilities'],
        [
            ['Project Manager (PRINCE2 / PMP)', '100 %', 'Overall delivery, governance, client liaison, risk management.'],
            ['Solution Architect', '60 %', 'Architecture decisions, technical standards, integration design, code reviews.'],
            ['Senior .NET Developer (Tech Lead)', '100 %', 'ASP.NET Core MVC backbone, CMS modules, security implementation.'],
            ['Senior Front-End Developer (React)', '100 %', 'React SPA, interactive dashboards, accessibility, performance.'],
            ['Front-End Developer (Razor + UI)', '100 %', 'Razor views, layout, responsive CSS, RTL/LTR styling.'],
            ['UI/UX Designer', '60 %', 'Wireframes, hi-fi mockups in EN/AR, design system, prototypes.'],
            ['QA Engineer', '100 %', 'Test plan, manual + automated tests, accessibility audit, regression.'],
            ['DevOps Engineer', '40 %', 'Azure infra, CI/CD, monitoring, security baseline, backup/DR.'],
            ['Arabic Content Specialist', '40 %', 'Arabic localisation, MSA review, content governance guidelines.'],
        ],
        [3000, 1300, 4726]
    ),
    heading('9.1 Backup Resources', 2),
    p('To safeguard delivery against unplanned attrition, each key role has a named backup resource of equivalent experience listed in Appendix B. Backups attend key meetings and have read-only access to the project workspace.'),
    pageBreak(),
];

/* ------ 10. QA ------ */
const qa = [
    heading('10. Quality Assurance and Testing', 1),
    p('Quality is engineered in, not inspected afterwards. Our QA strategy is layered across the SDLC.'),
    heading('10.1 Test Levels', 2),
    bullet('Unit tests (developer) — minimum 70 % code coverage on critical business logic.'),
    bullet('Integration tests — automated API contract tests, database integration tests.'),
    bullet('End-to-end tests — Playwright/Cypress covering the top 20 user journeys including bilingual flows.'),
    bullet('Performance tests — k6 load tests targeting peak concurrency of 1,000 users.'),
    bullet('Security tests — OWASP ZAP / Burp Suite per sprint; annual third-party pen-test.'),
    bullet('Accessibility tests — axe-core CI gate + manual NVDA / JAWS screen-reader testing.'),
    bullet('UAT — Nilepet stakeholders test in a dedicated UAT environment with full data parity to production.'),
    heading('10.2 Browser & Device Matrix', 2),
    buildTable(
        ['Browser', 'Versions Supported'],
        [
            ['Microsoft Edge (Chromium)', 'Current & N-1'],
            ['Google Chrome', 'Current & N-1'],
            ['Mozilla Firefox', 'Current & N-1 + ESR'],
            ['Apple Safari (macOS / iOS)', 'Current & N-1'],
            ['Samsung Internet', 'Current'],
        ],
        [3500, 5526]
    ),
    p(' ', { after: 60 }),
    bullet('Mobile devices: iPhone 12+, Samsung Galaxy S10+, mid-range Android (Xiaomi, Tecno, Infinix typical in Sudan).'),
    bullet('Tablets: iPad (10th gen), Samsung Galaxy Tab A.'),
    bullet('Desktop resolutions: 1920×1080, 1366×768, 1280×720.'),
    pageBreak(),
];

/* ------ 11. SECURITY ------ */
const security = [
    heading('11. Security, Privacy and Compliance', 1),
    heading('11.1 Standards Alignment', 2),
    bullet('ISO 27001:2022 — Information Security Management System controls applied across our SDLC.'),
    bullet('GDPR (EU 2016/679) — privacy-by-design, data subject rights workflows, DPIA template provided.'),
    bullet('WCAG 2.1 Level AA — built into every component; audit report included in handover.'),
    bullet('OWASP ASVS Level 2 — application security verification standard used as code review checklist.'),
    bullet('Section 508 (US) — alignment for accessibility, parallel to WCAG.'),
    heading('11.2 Cybersecurity Controls', 2),
    bullet('Web Application Firewall (WAF) with OWASP Core Rule Set.'),
    bullet('Rate limiting & bot protection at the gateway level.'),
    bullet('Brute-force lockouts, CAPTCHA on login & forms, IP allow-listing for CMS.'),
    bullet('All secrets in Azure Key Vault; no credentials in source code.'),
    bullet('Dependency scanning (Dependabot, Snyk) in CI; blocking critical CVEs.'),
    bullet('Static code analysis (SonarQube) with quality gate on every PR.'),
    bullet('Quarterly vulnerability scans; annual external penetration test.'),
    heading('11.3 Data Protection', 2),
    bullet('Personal data minimisation by design; explicit purpose for every field collected.'),
    bullet('Encryption at rest (AES-256, TDE on Azure SQL) and in transit (TLS 1.3).'),
    bullet('Backup encryption + tested restore drills quarterly.'),
    bullet('Data retention policy aligned with Sudanese data-protection legislation and GDPR.'),
    bullet('Right to access, rectification, erasure handled via DSAR workflow exposed to admin users.'),
    pageBreak(),
];

/* ------ 12. RISK REGISTER ------ */
const risks = [
    heading('12. Risk Register', 1),
    p('We adopt a continuous risk-management discipline. The initial register below is updated weekly and presented at every Steering Committee.'),
    buildTable(
        ['ID', 'Risk', 'Probability', 'Impact', 'Mitigation', 'Owner'],
        [
            ['R-01', 'Delay in client content provision (bios, photos, station data)', 'Medium', 'High',
             'Pre-agreed content checklist & deadlines; placeholder content with later swap; weekly content tracker.', 'Nilepet PM + Vendor PM'],
            ['R-02', 'Scope creep — new modules requested mid-flight', 'Medium', 'High',
             'Formal Change Control Procedure; impact assessment + signed change request per change.', 'Vendor PM'],
            ['R-03', 'Third-party API instability (maps, ERP)', 'Low', 'Medium',
             'Vendor-side mock services; graceful degradation; SLAs with API providers.', 'Tech Lead'],
            ['R-04', 'Arabic content quality / typography issues', 'Medium', 'Medium',
             'Dedicated Arabic content specialist; client review of Arabic copy at every sprint review.', 'Arabic Specialist'],
            ['R-05', 'Cyber-attack pre-launch', 'Low', 'High',
             'Hardened baseline, WAF, dependency scanning, pen-test before go-live, incident-response runbook.', 'DevOps + Security'],
            ['R-06', 'Key team member attrition', 'Low', 'Medium',
             'Named backups, knowledge-base documentation, pair-programming, code reviews.', 'Vendor PM'],
            ['R-07', 'Browser-compatibility regressions', 'Medium', 'Low',
             'BrowserStack matrix in CI; weekly regression runs; bug-bash before UAT.', 'QA Lead'],
            ['R-08', 'UAT defects beyond agreed limit', 'Low', 'Medium',
             'Strict definition of "done" per story; pre-UAT QA gate; severity-tiered defect triage.', 'QA Lead'],
            ['R-09', 'DNS / SSL migration glitches at go-live', 'Low', 'High',
             'Practised cut-over in staging; low-TTL DNS pre-cut-over; rollback plan; off-peak deployment window.', 'DevOps'],
            ['R-10', 'Regulatory or compliance change during build', 'Low', 'Medium',
             'Regulatory watch by Compliance Officer; design with extensibility; change-control process.', 'Compliance Officer'],
        ],
        [600, 2400, 1200, 1000, 2700, 1126]
    ),
    pageBreak(),
];

/* ------ 13. TRAINING ------ */
const training = [
    heading('13. Training and Knowledge Transfer', 1),
    p('Knowledge transfer is integral to the engagement, not an optional add-on. Three streams are delivered.'),
    heading('13.1 CMS Authoring Training (Business Users)', 2),
    bullet('Audience: Nilepet content editors, marketing, HR, investor-relations and HSE teams.'),
    bullet('Format: 2-day in-person workshop + 2 follow-up virtual clinics.'),
    bullet('Topics: navigation, page authoring, media library, workflow, scheduled publishing, complaint triage.'),
    bullet('Materials: bilingual quick-start guide, video tutorials, sandbox environment.'),
    heading('13.2 Administrator Training (IT Operations)', 2),
    bullet('Audience: Nilepet IT/DevOps staff.'),
    bullet('Format: 2-day technical workshop.'),
    bullet('Topics: Azure resources, deployment pipeline, backup/restore, monitoring, incident response.'),
    bullet('Materials: runbooks, architecture diagrams, configuration management documents.'),
    heading('13.3 Developer Handover (Technical Knowledge)', 2),
    bullet('Audience: Nilepet IT development team or successor vendor.'),
    bullet('Format: 1-day technical walk-through of the codebase and key design decisions.'),
    bullet('Topics: codebase tour, build & deploy, extension points, test strategy, security baseline.'),
    bullet('Materials: source code (with full commit history), README, architectural decision records (ADRs), API documentation (OpenAPI).'),
    pageBreak(),
];

/* ------ 14. SUPPORT ------ */
const support = [
    heading('14. Post-Launch Support and Maintenance', 1),
    heading('14.1 Free Warranty Period', 2),
    p('A 6-month warranty period commences from go-live, covering:'),
    bullet('All defects in delivered functionality.'),
    bullet('Minor enhancements and configuration tweaks (up to 40 hours total).'),
    bullet('Critical security patches.'),
    bullet('Production incident response on a best-effort basis.'),
    heading('14.2 Optional Annual Managed Support (after warranty)', 2),
    p('We offer three tiers; the right tier can be selected closer to go-live based on Nilepet\'s operational needs.'),
    buildTable(
        ['Tier', 'Response SLA', 'Resolution SLA', 'Hours / Month'],
        [
            ['Bronze', 'P1 — 4 h · P2 — 8 h', 'P1 — 24 h · P2 — 72 h', '40'],
            ['Silver', 'P1 — 2 h · P2 — 4 h', 'P1 — 12 h · P2 — 48 h', '80'],
            ['Gold (24/7)', 'P1 — 30 min · P2 — 2 h', 'P1 — 6 h · P2 — 24 h', '160'],
        ],
        [2000, 2500, 2500, 2026]
    ),
    heading('14.3 Continuous Improvement', 2),
    bullet('Monthly performance and security review with Nilepet IT.'),
    bullet('Quarterly Core Web Vitals and accessibility audit.'),
    bullet('Annual penetration test and dependency upgrade campaign.'),
    bullet('Roadmap review with Nilepet Marketing & Digital teams every 6 months.'),
    pageBreak(),
];

/* ------ 15. ASSUMPTIONS ------ */
const assumptions = [
    heading('15. Assumptions, Exclusions and Dependencies', 1),
    heading('15.1 Assumptions', 2),
    bullet('Nilepet will appoint a single empowered Project Manager and content owner per business stream.'),
    bullet('Content (text, photos, videos, PDFs) will be provided by Nilepet to an agreed schedule.'),
    bullet('Hosting on Microsoft Azure subscription provisioned by Nilepet or via our managed hosting arrangement.'),
    bullet('Production domain name (nilepet.sd or equivalent) and SSL certificates available before go-live.'),
    bullet('UAT environment access for up to 15 named testers from Nilepet.'),
    bullet('Decisions are returned within 3 working days of being raised.'),
    heading('15.2 Exclusions (Not in Scope)', 2),
    bullet('Production of professional photography, videography, or 3D animation (can be added as optional service).'),
    bullet('Translation of legacy archive content beyond the agreed page count of 60 published Arabic pages at launch.'),
    bullet('Real-time financial market data feeds (a static or scheduled-refresh data source is assumed; live feed available as optional add-on).'),
    bullet('Hardware procurement (Azure cloud only; no on-premise data centre work).'),
    bullet('Mobile native apps (iOS / Android) — site is PWA-ready and can be wrapped later.'),
    heading('15.3 Client Dependencies', 2),
    bullet('Timely approval of design and UAT deliverables (within 5 working days each).'),
    bullet('Nomination of CMS administrators, content authors, and reviewers prior to training.'),
    bullet('Access to identity provider (Microsoft Entra ID tenant) for admin SSO if applicable.'),
    bullet('Branding assets (logos, fonts, brand guidelines).'),
    bullet('Sample data for testing: real fuel-station list, current organisational chart, board minutes for IR module.'),
    pageBreak(),
];

/* ------ 16. CONCLUSION ------ */
const conclusion = [
    heading('16. Conclusion', 1),
    p('We have constructed this Technical Proposal to leave no requirement unanswered — the demonstration site, the compliance matrix, the project plan, and the risk register are all provided as integrated, traceable artefacts. We bring proven engineering capability, a strong petroleum-sector track record, native bilingual delivery, and a delivery culture that prioritises transparency and client empowerment.'),
    p('We commit to deliver the Nilepet website on time, on budget, and to a quality that becomes a regional benchmark for national oil companies. Beyond launch, we offer a continuous partnership focused on adoption, security, performance, and ongoing innovation.'),
    p('We are ready to commence immediately upon contract award and look forward to building Sudan\'s premier energy-sector digital platform with Nile Petroleum Company Limited.'),
    p(' ', { after: 200 }),
    p('— END OF TECHNICAL PROPOSAL —', { bold: true, align: AlignmentType.CENTER, color: COLOR.indigo }),
    p(' ', { after: 200 }),
    p('Appendices (to be attached separately):', { bold: true }),
    bullet('Appendix A — Audited financial statements (3 years).'),
    bullet('Appendix B — CVs of key personnel.'),
    bullet('Appendix C — Reference letters and prior-project documentation.'),
    bullet('Appendix D — Compliance certifications (ISO 9001, ISO 27001).'),
    bullet('Appendix E — Live demonstration URL and access credentials.'),
];

/* ============================================================
   BUILD DOCUMENT
   ============================================================ */
const allChildren = [].concat(
    coverContent,
    tocContent,
    coverLetterContent,
    execSummary,
    companyProfile,
    understanding,
    solution,
    scope,
    compliance,
    methodology,
    plan,
    team,
    qa,
    security,
    risks,
    training,
    support,
    assumptions,
    conclusion,
);

const doc = new Document({
    creator: '[Your Company Name]',
    title: 'Nilepet Website — Technical Proposal',
    description: 'Technical Proposal in response to the Nile Petroleum Company Limited ITB dated 10 March 2026.',
    styles: {
        default: { document: { run: { font: FONT, size: BODY_SIZE } } },
        paragraphStyles: [
            { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 40, bold: true, color: COLOR.indigo, font: FONT },
              paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 } },
            { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 30, bold: true, color: COLOR.red, font: FONT },
              paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
            { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 26, bold: true, color: COLOR.navy, font: FONT },
              paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
        ],
    },
    numbering: {
        config: [
            { reference: 'bullets',
              levels: [
                  { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                  { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
              ] },
            { reference: 'numbers',
              levels: [
                  { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
              ] },
        ],
    },
    sections: [{
        properties: {
            page: {
                size: { width: A4.width, height: A4.height },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
        },
        headers: {
            default: new Header({
                children: [
                    new Paragraph({
                        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                        children: [
                            new TextRun({ text: 'Technical Proposal — Nile Petroleum Company Limited Website',
                                          size: 18, color: COLOR.grayDark, font: FONT, italics: true }),
                            new TextRun({ text: '\tConfidential', size: 18, color: COLOR.red, font: FONT, bold: true }),
                        ],
                    }),
                ],
            }),
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                        children: [
                            new TextRun({ text: '[Your Company Name]  ·  ', size: 18, color: COLOR.grayDark, font: FONT }),
                            new TextRun({ text: 'Page ', size: 18, color: COLOR.grayDark, font: FONT }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLOR.grayDark, font: FONT }),
                            new TextRun({ text: ' of ', size: 18, color: COLOR.grayDark, font: FONT }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: COLOR.grayDark, font: FONT }),
                            new TextRun({ text: '\tDocument Version 1.0', size: 18, color: COLOR.grayDark, font: FONT, italics: true }),
                        ],
                    }),
                ],
            }),
        },
        children: allChildren,
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    const outPath = path.join(__dirname, 'Nilepet_Technical_Proposal.docx');
    fs.writeFileSync(outPath, buffer);
    console.log('OK: wrote', outPath, '(' + buffer.length + ' bytes)');
}).catch((e) => {
    console.error('ERR:', e);
    process.exit(1);
});

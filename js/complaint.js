/* ==========================================================================
   Complaint Management
   - Generate unique ticket IDs (NPC-YYYY-XXXXXX)
   - Persist complaints to localStorage
   - File / Track tabs
   - Status timeline calculated from age (mock workflow)
   ========================================================================== */

(function () {
    'use strict';

    const STORAGE_KEY = 'np_complaints';

    /* ---- Storage helpers ---- */
    function loadAll() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch (_) { return []; }
    }
    function saveAll(list) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
        catch (_) {}
    }
    function findById(id) {
        return loadAll().find((c) => c.id.toUpperCase() === id.toUpperCase());
    }

    /* ---- Ticket ID generator ---- */
    function makeTicketId() {
        const year = new Date().getFullYear();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // unambiguous
        let suffix = '';
        for (let i = 0; i < 6; i++) {
            suffix += chars[Math.floor(Math.random() * chars.length)];
        }
        return 'NPC-' + year + '-' + suffix;
    }

    /* ---- Status computed from age ---- */
    function statusOf(complaint) {
        const now = Date.now();
        const ageHours = (now - complaint.submittedAt) / (1000 * 60 * 60);
        if (ageHours < 24) return 'open';
        if (ageHours < 24 * 5) return 'review';
        return 'resolved';
    }

    function statusLabel(status, isAr) {
        const map = isAr
            ? { open: 'مفتوحة', review: 'قيد المراجعة', resolved: 'تم الحل' }
            : { open: 'Open', review: 'Under Review', resolved: 'Resolved' };
        return map[status] || status;
    }

    function fmtDate(ms, isAr) {
        const d = new Date(ms);
        return d.toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    }

    /* ---- Tab switching ---- */
    function setupTabs() {
        const btns = document.querySelectorAll('.feature-tabs button');
        const panels = document.querySelectorAll('.feature-panel');
        btns.forEach((btn) => {
            btn.addEventListener('click', () => {
                btns.forEach((b) => b.classList.remove('active'));
                panels.forEach((p) => p.classList.remove('active'));
                btn.classList.add('active');
                const target = document.getElementById(btn.dataset.panel);
                if (target) target.classList.add('active');
            });
        });
    }

    /* ---- File new complaint ---- */
    function setupFileForm() {
        const form = document.getElementById('complaint-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const id = makeTicketId();
            const complaint = {
                id,
                fullName: form.querySelector('#c-name').value.trim(),
                email: form.querySelector('#c-email').value.trim(),
                phone: form.querySelector('#c-phone').value.trim(),
                category: form.querySelector('#c-category').value,
                subject: form.querySelector('#c-subject').value.trim(),
                description: form.querySelector('#c-description').value.trim(),
                urgency: form.querySelector('input[name="urgency"]:checked').value,
                submittedAt: Date.now(),
            };

            const list = loadAll();
            list.push(complaint);
            saveAll(list);

            showSuccessModal(id);
            form.reset();
        });
    }

    function showSuccessModal(id) {
        const modal = document.getElementById('success-modal');
        const codeEl = document.getElementById('generated-ticket-id');
        if (!modal || !codeEl) return;
        codeEl.textContent = id;
        modal.classList.add('open');
    }

    function setupModalActions() {
        const modal = document.getElementById('success-modal');
        if (!modal) return;

        const closeBtns = modal.querySelectorAll('[data-modal-close]');
        closeBtns.forEach((b) =>
            b.addEventListener('click', () => modal.classList.remove('open'))
        );
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });

        const copyBtn = document.getElementById('copy-ticket');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const code = document.getElementById('generated-ticket-id').textContent;
                try {
                    await navigator.clipboard.writeText(code);
                } catch (_) {
                    // Fallback
                    const ta = document.createElement('textarea');
                    ta.value = code;
                    document.body.appendChild(ta);
                    ta.select();
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
        }

        const trackBtn = document.getElementById('modal-track-btn');
        if (trackBtn) {
            trackBtn.addEventListener('click', () => {
                const code = document.getElementById('generated-ticket-id').textContent;
                modal.classList.remove('open');
                document.querySelector('[data-panel="panel-track"]').click();
                const input = document.getElementById('ticket-id');
                if (input) {
                    input.value = code;
                    document.getElementById('track-form').dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    /* ---- Track existing complaint ---- */
    function setupTrackForm() {
        const form = document.getElementById('track-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const idVal = document.getElementById('ticket-id').value.trim();
            renderTrackResult(idVal);
        });

        // Pre-fill from URL ?id=...
        try {
            const u = new URLSearchParams(window.location.search);
            const idFromUrl = u.get('id');
            if (idFromUrl) {
                document.getElementById('ticket-id').value = idFromUrl;
                document.querySelector('[data-panel="panel-track"]').click();
                renderTrackResult(idFromUrl);
            }
        } catch (_) {}
    }

    function renderTrackResult(id) {
        const out = document.getElementById('track-result');
        if (!out) return;
        const isAr = window.__np_lang === 'ar';

        if (!id) {
            out.innerHTML = '';
            return;
        }

        const c = findById(id);
        if (!c) {
            out.innerHTML = `
                <div class="track-empty">
                    <i class="fas fa-search-minus"></i>
                    <h4>${isAr ? 'الشكوى غير موجودة' : 'Complaint not found'}</h4>
                    <p>${isAr ? 'يرجى التحقق من رقم التتبع والمحاولة مرة أخرى.' : 'Please check the tracking ID and try again.'}</p>
                </div>
            `;
            return;
        }

        const status = statusOf(c);
        const urgencyLabel = (isAr
            ? { low: 'منخفضة', med: 'متوسطة', high: 'عالية' }
            : { low: 'Low', med: 'Medium', high: 'High' })[c.urgency] || c.urgency;

        const lbls = isAr ? {
            id: 'رقم التتبع', submitted: 'تاريخ التقديم', category: 'الفئة', urgency: 'الأهمية',
            subject: 'الموضوع', description: 'التفاصيل',
            name: 'الاسم', email: 'البريد الإلكتروني', phone: 'الهاتف',
            timeline: 'الخط الزمني للحالة',
            stepSubmitted: 'تم استلام الشكوى',
            stepReview: 'قيد المراجعة من قبل الفريق المختص',
            stepResolved: 'تم حل الشكوى',
            pending: 'قيد الانتظار',
            within24: 'سيتم البدء في المراجعة خلال 24 ساعة',
            withinSLA: 'سيتم إغلاق الشكوى ضمن اتفاقية مستوى الخدمة',
            now: 'الآن',
        } : {
            id: 'Tracking ID', submitted: 'Submitted', category: 'Category', urgency: 'Urgency',
            subject: 'Subject', description: 'Description',
            name: 'Name', email: 'Email', phone: 'Phone',
            timeline: 'Status Timeline',
            stepSubmitted: 'Complaint received',
            stepReview: 'Under review by the responsible team',
            stepResolved: 'Complaint resolved',
            pending: 'Pending',
            within24: 'Review begins within 24 hours',
            withinSLA: 'Will be closed within SLA',
            now: 'now',
        };

        const submittedDate = fmtDate(c.submittedAt, isAr);
        const reviewDate = (status === 'review' || status === 'resolved')
            ? fmtDate(c.submittedAt + 24 * 3600 * 1000, isAr)
            : lbls.within24;
        const resolvedDate = (status === 'resolved')
            ? fmtDate(c.submittedAt + 5 * 24 * 3600 * 1000, isAr)
            : lbls.withinSLA;

        out.innerHTML = `
            <div class="track-card">
                <div class="track-card-head">
                    <div>
                        <div class="id">${c.id}</div>
                        <div class="submitted">${lbls.submitted}: ${submittedDate}</div>
                    </div>
                    <span class="track-card-status ${status}">
                        <i class="fas fa-circle" style="font-size:6px"></i> ${statusLabel(status, isAr)}
                    </span>
                </div>

                <div class="track-fields">
                    <div class="track-field"><div class="l">${lbls.name}</div><div class="v">${escapeHtml(c.fullName)}</div></div>
                    <div class="track-field"><div class="l">${lbls.email}</div><div class="v">${escapeHtml(c.email)}</div></div>
                    <div class="track-field"><div class="l">${lbls.phone}</div><div class="v">${escapeHtml(c.phone || '—')}</div></div>
                    <div class="track-field"><div class="l">${lbls.urgency}</div><div class="v">${urgencyLabel}</div></div>
                    <div class="track-field"><div class="l">${lbls.category}</div><div class="v">${escapeHtml(c.category)}</div></div>
                    <div class="track-field"><div class="l">${lbls.subject}</div><div class="v">${escapeHtml(c.subject)}</div></div>
                    <div class="track-field full"><div class="l">${lbls.description}</div><div class="v">${escapeHtml(c.description)}</div></div>
                </div>

                <div class="track-timeline">
                    <h4><i class="fas fa-stream"></i> ${lbls.timeline}</h4>
                    <div class="timeline-step done">
                        <div class="dot"><i class="fas fa-check"></i></div>
                        <div class="step-info">
                            <h5>${lbls.stepSubmitted}</h5>
                            <div class="step-date">${submittedDate}</div>
                        </div>
                    </div>
                    <div class="timeline-step ${status === 'review' ? 'current' : (status === 'resolved' ? 'done' : '')}">
                        <div class="dot"><i class="fas fa-${status === 'open' ? 'clock' : 'check'}"></i></div>
                        <div class="step-info">
                            <h5>${lbls.stepReview}</h5>
                            <div class="step-date">${reviewDate}</div>
                        </div>
                    </div>
                    <div class="timeline-step ${status === 'resolved' ? 'done' : ''}">
                        <div class="dot"><i class="fas fa-${status === 'resolved' ? 'check' : 'flag'}"></i></div>
                        <div class="step-info">
                            <h5>${lbls.stepResolved}</h5>
                            <div class="step-date">${resolvedDate}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ---- Init ---- */
    function init() {
        setupTabs();
        setupFileForm();
        setupTrackForm();
        setupModalActions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

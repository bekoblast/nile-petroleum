/* ==========================================================================
   Interactive station map (Leaflet + OpenStreetMap tiles)
   - Replaces any iframe pointing at openstreetmap.org with a real map
   - Drops 9 station pins across Sudan (the same ones listed on the page)
   - Custom Nilepet-coloured pins per station type, popups with chips
   - HQ map on contact.html stays a single marker
   ========================================================================== */

(function () {
    'use strict';

    /* ---- Station data ---- */
    const STATIONS = [
        { name: 'Khartoum Central – Mek Nimr St.', lat: 15.5007, lng: 32.5599, type: 'retail',
          services: ['24/7', 'Premium 95', 'Diesel', 'LPG'] },
        { name: 'Omdurman – Al-Arda', lat: 15.6440, lng: 32.4773, type: 'retail',
          services: ['Premium 95', 'Diesel', 'Mart'] },
        { name: 'Bahri Industrial Zone', lat: 15.6398, lng: 32.5375, type: 'industrial',
          services: ['24/7', 'Diesel', 'Truck Stop'] },
        { name: 'Madani Highway Hub', lat: 14.4007, lng: 33.5247, type: 'highway',
          services: ['24/7', 'Restaurant', 'Truck Stop'] },
        { name: 'Port Sudan Marine Terminal', lat: 19.6164, lng: 37.2160, type: 'marine',
          services: ['Marine', 'Industrial'] },
        { name: 'Kassala Eastern Gateway', lat: 15.4506, lng: 36.4001, type: 'retail',
          services: ['Standard', 'Mart'] },
        { name: 'Atbara River Nile', lat: 17.7000, lng: 33.9833, type: 'retail',
          services: ['24/7', 'Diesel'] },
        { name: 'El Obeid Western Junction', lat: 13.1832, lng: 30.2173, type: 'retail',
          services: ['Premium 95'] },
        { name: 'Khartoum Airport – Aviation', lat: 15.5895, lng: 32.5532, type: 'aviation',
          services: ['Aviation', 'Restricted'] },
    ];

    const TYPE_STYLES = {
        retail:     { color: '#E32525', icon: 'fa-gas-pump' },
        marine:     { color: '#2A2882', icon: 'fa-ship' },
        aviation:   { color: '#F2A900', icon: 'fa-plane' },
        industrial: { color: '#374151', icon: 'fa-industry' },
        highway:    { color: '#10B981', icon: 'fa-truck' },
    };

    /* ---- Helpers ---- */
    function trText(s) {
        if (window.__np_lang === 'ar' && window.NP_TRANSLATIONS_AR && window.NP_TRANSLATIONS_AR[s]) {
            return window.NP_TRANSLATIONS_AR[s];
        }
        return s;
    }

    function makeIcon(type) {
        const c = TYPE_STYLES[type] || TYPE_STYLES.retail;
        return L.divIcon({
            className: 'np-marker-wrap',
            html: '<div class="np-marker-pin" style="background:' + c.color + '">'
                + '<i class="fas ' + c.icon + '"></i></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -38],
        });
    }

    function buildPopup(s) {
        const chips = s.services
            .map(function (svc) { return '<span>' + trText(svc) + '</span>'; })
            .join('');
        return ''
            + '<div class="np-popup">'
            +     '<strong>' + trText(s.name) + '</strong>'
            +     '<div class="np-popup-chips">' + chips + '</div>'
            + '</div>';
    }

    /* ---- Initialise the big multi-pin stations map ---- */
    function initStationsMap(container) {
        // Center over Sudan, zoom to fit all markers afterwards
        const map = L.map(container, {
            scrollWheelZoom: false,
            zoomControl: true,
        }).setView([15.5, 32.5], 6);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(map);

        const markers = [];
        STATIONS.forEach(function (s) {
            const m = L.marker([s.lat, s.lng], { icon: makeIcon(s.type), title: s.name })
                .addTo(map)
                .bindPopup(buildPopup(s), { maxWidth: 280, closeButton: true });
            markers.push(m);
        });

        if (markers.length) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.15));
        }

        // Dim the decorative ::before overlay that was designed for the iframe
        const parent = container.parentElement;
        if (parent) parent.classList.add('np-leaflet-loaded');
    }

    /* ---- Initialise the HQ map on contact.html (single marker) ---- */
    function initHqMap(container) {
        const map = L.map(container, { scrollWheelZoom: false }).setView([15.5007, 32.5599], 14);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(map);

        L.marker([15.5007, 32.5599], { icon: makeIcon('retail'), title: 'Nilepet HQ' })
            .addTo(map)
            .bindPopup(''
                + '<div class="np-popup">'
                +     '<strong>' + trText('Nile Petroleum Company Limited') + '</strong>'
                +     '<div style="color:var(--np-gray-500);font-size:0.85rem;margin-top:4px;">'
                +         trText('Petroleum Tower, Mek Nimr St.')
                +     '</div>'
                + '</div>',
                { maxWidth: 260 })
            .openPopup();

        const parent = container.parentElement;
        if (parent) parent.classList.add('np-leaflet-loaded');
    }

    /* ---- Replace OSM iframes with Leaflet divs ---- */
    function replaceIframes() {
        if (typeof L === 'undefined') {
            // Leaflet not ready yet — retry briefly
            setTimeout(replaceIframes, 80);
            return;
        }

        const iframes = document.querySelectorAll('iframe[src*="openstreetmap.org"]');
        iframes.forEach(function (iframe) {
            const title = (iframe.title || '').toLowerCase();
            const isHq = title.indexOf('hq') !== -1;

            const div = document.createElement('div');
            div.className = 'np-leaflet-container';
            iframe.parentNode.replaceChild(div, iframe);

            try {
                if (isHq) initHqMap(div);
                else      initStationsMap(div);
            } catch (e) {
                console.warn('Leaflet init failed:', e);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceIframes);
    } else {
        replaceIframes();
    }
})();

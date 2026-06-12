/* 
   Maple Leaf Green Clean - Interactions
*/

document.addEventListener('DOMContentLoaded', () => {
    // Current Year for Footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Theme Toggle Logic
    const themeBtn = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlEl.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        htmlEl.setAttribute('data-theme', 'dark');
    }

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

    hamburger.addEventListener('click', () => {
        const isActive = hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    });

    // Close mobile menu on link click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Sticky Navigation Background
    const nav = document.getElementById('mainNav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });

    // Scroll Reveal Animations
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
});

// Leaflet.js Map Initialization (no API key required)
// We defer init until the #areas-served section is visible because Leaflet
// requires the container to have real dimensions when initialized.
// If it's hidden/transformed by the .reveal animation, tiles won't render.
let leafletMap = null;

function initLeafletMap() {
    const mapElement = document.getElementById('service-map');
    if (!mapElement || typeof L === 'undefined' || leafletMap) return;

    const center = [49.050118, -122.795845]; // South Surrey / White Rock

    leafletMap = L.map('service-map', {
        center: center,
        zoom: 9,
        zoomControl: true,
        scrollWheelZoom: false
    });

    // OpenStreetMap tiles — free, no key needed
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(leafletMap);

    // Service area polygon — 20-mile radius clipped at the US-Canada border (49.0° N)
    // Generates geodesic circle points, then clamps any point south of the border
    // up to 49.0°, producing a flat southern edge that respects the border.
    const BORDER_LAT   = 49.0;        // 49th parallel (US-Canada border in this region)
    const RADIUS_M     = 20000;       // 20 km in metres
    const EARTH_R      = 6371000;
    const NUM_POINTS   = 90;          // resolution — one point every 4°

    function geodesicCirclePoints(centerLatLng, radiusMeters, n, clampLat) {
        const lat  = centerLatLng[0] * Math.PI / 180;
        const lng  = centerLatLng[1] * Math.PI / 180;
        const d    = radiusMeters / EARTH_R;
        const pts  = [];

        for (let i = 0; i <= n; i++) {
            const bearing = (i * 360 / n) * Math.PI / 180;
            const lat2 = Math.asin(
                Math.sin(lat) * Math.cos(d) +
                Math.cos(lat) * Math.sin(d) * Math.cos(bearing)
            );
            const lng2 = lng + Math.atan2(
                Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
                Math.cos(d) - Math.sin(lat) * Math.sin(lat2)
            );
            const latDeg = lat2 * 180 / Math.PI;
            const lngDeg = lng2 * 180 / Math.PI;
            // Clamp: anything south of the border snaps to the border line
            pts.push([Math.max(clampLat, latDeg), lngDeg]);
        }
        return pts;
    }

    const serviceAreaPts = geodesicCirclePoints(center, RADIUS_M, NUM_POINTS, BORDER_LAT);

    L.polygon(serviceAreaPts, {
        color: '#005F25',
        weight: 2,
        opacity: 0.8,
        fillColor: '#00993E',
        fillOpacity: 0.25
    }).addTo(leafletMap);

    // Centre marker
    const markerIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;background:#005F25;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
    L.marker(center, { icon: markerIcon }).addTo(leafletMap)
        .bindPopup('<strong>Maple Leaf Green Clean</strong><br>South Surrey / White Rock');

    // Force tile redraw now that the container is visible
    setTimeout(() => leafletMap.invalidateSize(), 100);
}

// Watch for the areas section becoming visible, then init the map
document.addEventListener('DOMContentLoaded', () => {
    const areasSection = document.getElementById('areas-served');
    if (!areasSection) { initLeafletMap(); return; }

    const mapObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Small delay lets the CSS reveal transition settle first
                setTimeout(initLeafletMap, 150);
                mapObserver.unobserve(areasSection);
            }
        });
    }, { threshold: 0.1 });

    mapObserver.observe(areasSection);
});

// ── Review Carousel ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const track    = document.getElementById('carouselTrack');
    const viewport = document.getElementById('carouselViewport');
    const prevBtn  = document.getElementById('prevBtn');
    const nextBtn  = document.getElementById('nextBtn');
    const dotsEl   = document.getElementById('carouselDots');

    if (!track || !viewport) return;

    const cards = Array.from(track.children);
    let current  = 0;
    let perView  = getPerView();
    let dots     = [];

    function getPerView() {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 900) return 2;
        return 3;
    }

    function getOffset() {
        const gap    = 32; // matches CSS gap: 2rem
        const cardW  = (viewport.offsetWidth - gap * (perView - 1)) / perView;
        return current * perView * (cardW + gap);
    }

    function totalPages() {
        return Math.ceil(cards.length / perView);
    }

    function goTo(page) {
        current = Math.max(0, Math.min(page, totalPages() - 1));
        track.style.transform = `translateX(-${getOffset()}px)`;
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current >= totalPages() - 1;
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function buildDots() {
        dotsEl.innerHTML = '';
        dots = [];
        for (let i = 0; i < totalPages(); i++) {
            const d = document.createElement('button');
            d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', `Go to page ${i + 1}`);
            d.addEventListener('click', () => goTo(i));
            dotsEl.appendChild(d);
            dots.push(d);
        }
    }

    buildDots();
    goTo(0);

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // Keyboard arrow support
    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    });

    // Pointer drag / swipe
    let dragStartX = null;
    viewport.addEventListener('pointerdown', e => {
        dragStartX = e.clientX;
        track.style.transition = 'none';
    });
    window.addEventListener('pointerup', e => {
        if (dragStartX === null) return;
        track.style.transition = '';
        const delta = dragStartX - e.clientX;
        if (Math.abs(delta) > 60) {
            goTo(delta > 0 ? current + 1 : current - 1);
        } else {
            goTo(current);
        }
        dragStartX = null;
    });

    // Recalculate on resize
    new ResizeObserver(() => {
        const newPer = getPerView();
        if (newPer !== perView) {
            perView  = newPer;
            current  = 0;
            buildDots();
        }
        goTo(current);
    }).observe(viewport);
});

// ── Cookie Banner Logic ──────────────────────────────────────
function initCookieConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'accepted') {
        loadGoogleAnalytics();
    } else if (!consent) {
        showCookieBanner();
    }
}

function loadGoogleAnalytics() {
    if (window.gtagLoaded) return;
    window.gtagLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-NJ36HJTRLS";
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function windowGtag(){dataLayer.push(arguments);}
    windowGtag('js', new Date());
    windowGtag('config', 'G-NJ36HJTRLS');
}

function showCookieBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <p>We use cookies to improve your experience and analyze site traffic. Read our <a href="privacy.html" style="color:var(--text-primary); text-decoration:underline;">Privacy Policy</a>.</p>
            <div class="cookie-actions">
                <button id="acceptCookies" class="btn-primary" style="padding: 0.5rem 1.5rem; font-size: 0.9rem;">Accept</button>
                <button id="declineCookies" class="btn-back" style="padding: 0.5rem 1.5rem; font-size: 0.9rem;">Decline</button>
            </div>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('acceptCookies').addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        banner.remove();
        loadGoogleAnalytics();
    });

    document.getElementById('declineCookies').addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined');
        banner.remove();
    });
}

document.addEventListener('DOMContentLoaded', initCookieConsent);

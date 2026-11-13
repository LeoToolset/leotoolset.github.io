/* =====================================================
   LEOSYNC LOADING SCREEN CONTROL
   (Die Sprachen sind eigene Seiten: /leosync/ und /leosync/en/)
   ===================================================== */

function hideLeoLoadingScreen() {

    const loadingScreen =
        document.getElementById("leo-loading");

    if (!loadingScreen) return;

    loadingScreen.classList.add("finished");

    setTimeout(() => {
        loadingScreen.remove();
    }, 700);

}

// Nach vollständigem Laden aller Ressourcen
window.addEventListener("load", () => {

    setTimeout(hideLeoLoadingScreen, 700);

});

// Sicherheitsnetz
setTimeout(hideLeoLoadingScreen, 8000);


/* =====================================================
   MOBILE NAVIGATION (HAMBURGER MENU)
   Der Button wird per JS eingefügt. Ohne JS bleibt die
   normale, umbrechende Navigation sichtbar.
   ===================================================== */

(function initMobileNav() {

    const navigation = document.querySelector(".site-header .navigation");
    const nav = navigation && navigation.querySelector(".nav-links");

    if (!nav) return;

    const isEnglish =
        (document.documentElement.lang || "").toLowerCase().startsWith("en");

    const labelOpen = isEnglish ? "Open menu" : "Menü öffnen";
    const labelClose = isEnglish ? "Close menu" : "Menü schliessen";

    if (!nav.id) nav.id = "site-nav";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-toggle";
    button.setAttribute("aria-controls", nav.id);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", labelOpen);
    button.innerHTML = "<span></span><span></span><span></span>";

    navigation.insertBefore(button, nav);
    navigation.classList.add("nav-ready");

    function setOpen(open) {
        nav.classList.toggle("open", open);
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? labelClose : labelOpen);
    }

    button.addEventListener("click", () => {
        setOpen(!nav.classList.contains("open"));
    });

    nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("open")) {
            setOpen(false);
            button.focus();
        }
    });

    window.matchMedia("(min-width: 681px)").addEventListener("change", (event) => {
        if (event.matches) setOpen(false);
    });

})();


/* =====================================================
   ANKER-SPRUNG MIT LAZY-LOADING-KORREKTUR
   Lazy geladene Bilder vergrössern die Seite beim Scrollen und
   verschieben das Ziel. Darum: sofort springen und das Ziel
   nachführen, bis die Bilder geladen sind (oder der Nutzer scrollt).
   ===================================================== */

(function initAnchorJump() {

    function targetFor(link) {
        if (!link.hash || link.hash.length < 2) return null;
        if (link.pathname.replace(/index\.html$/, "") !==
            location.pathname.replace(/index\.html$/, "")) return null;
        return document.getElementById(decodeURIComponent(link.hash.slice(1)));
    }

    function jump(target) {
        const root = document.documentElement;
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        target.scrollIntoView({ block: "start" });
        root.style.scrollBehavior = previous;
    }

    document.addEventListener("click", (event) => {

        const link = event.target.closest("a[href*='#']");
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey) return;

        const target = targetFor(link);
        if (!target) return;

        event.preventDefault();
        history.pushState(null, "", link.hash);

        // Mobiles Menü zuerst schliessen, damit die Header-Höhe stimmt
        const nav = document.querySelector(".nav-links.open");
        const toggle = document.querySelector(".nav-toggle");
        if (nav) {
            nav.classList.remove("open");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        }

        jump(target);

        let active = true;
        const stop = () => { active = false; };
        ["wheel", "touchstart", "keydown", "mousedown"].forEach((name) =>
            window.addEventListener(name, stop, { once: true, passive: true }));

        const realign = () => { if (active) jump(target); };

        document.querySelectorAll("img[loading='lazy']").forEach((img) => {
            if (!img.complete) img.addEventListener("load", realign, { once: true });
        });

        let ticks = 0;
        const timer = setInterval(() => {
            realign();
            if (!active || ++ticks > 12) clearInterval(timer);
        }, 150);

    });

})();

/* =====================================================
   AKTUELLE VERSION AUS DEM GITHUB-REPOSITORY
   Fuellt <span data-leo-version>. Ohne Netz/Fehler bleibt der
   Platzhalter, die Seite funktioniert unveraendert.
   ===================================================== */

(function initReleaseVersion() {

    const targets = document.querySelectorAll("[data-leo-version]");
    if (!targets.length || !window.fetch) return;

    fetch("https://raw.githubusercontent.com/Apop85/Sync2PC/refs/heads/main/version.properties")
        .then((response) => response.ok ? response.text() : Promise.reject(response.status))
        .then((text) => {
            const get = (key) => {
                const match = text.match(new RegExp("^" + key + "\\s*=\\s*(\\d+)\\s*$", "m"));
                return match ? match[1] : null;
            };
            const parts = [get("VERSION_MAJOR"), get("VERSION_MINOR"), get("VERSION_PATCH")];
            if (parts.some((part) => part === null)) return;
            window.leoVersion = parts.join(".");
            targets.forEach((el) => { el.textContent = window.leoVersion; });
        })
        .catch(() => {});

})();

/* =====================================================
   DOWNLOAD- UND KLICK-TRACKING (cookielos, datensparsam)
   - Es wird nichts gesendet, solange kein Zaehldienst konfiguriert ist:
     <meta name="leo-analytics" content="https://CODE.goatcounter.com/count">
   - "Do Not Track" und "Global Privacy Control" werden respektiert.
   - Es werden keine personenbezogenen Daten erfasst: nur Ereignis,
     Sprache, Seite, Position des Elements und Release-Version.
   - Ein Klick auf GitHub ist kein bestaetigter APK-Download.
   ===================================================== */

(function initTracking() {

    const REPO = "github.com/Apop85/Sync2PC";

    const meta = document.querySelector('meta[name="leo-analytics"]');
    const endpoint = meta && meta.content;
    const optedOut = navigator.doNotTrack === "1" ||
        window.doNotTrack === "1" ||
        navigator.globalPrivacyControl === true;

    // Zaehldienst nur laden, wenn konfiguriert und nicht abgelehnt
    if (endpoint && !optedOut) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://gc.zgo.at/count.js";
        script.dataset.goatcounter = endpoint;
        document.head.appendChild(script);
    }

    function language() {
        return (document.documentElement.lang || "de").toLowerCase().slice(0, 2);
    }

    function position(link) {
        if (link.dataset.pos) return link.dataset.pos;
        if (link.closest(".site-header")) return "header";
        if (link.closest(".site-footer")) return "footer";
        if (link.closest(".cta-band")) return "band";
        if (link.closest(".download-section")) return "download-section";
        return "content";
    }

    function eventFor(link) {
        if (link.dataset.track && link.dataset.track !== "download") return link.dataset.track;
        if (link.classList.contains("language-button") || link.dataset.track === "language_switch") return "language_switch";
        const href = link.href || "";
        if (href.indexOf(REPO + "/releases") !== -1) return "download_click";
        if (link.dataset.track === "download") return "download_click";
        if (href.indexOf(REPO + "/blob/") !== -1 || href.indexOf(REPO + "/tree/") !== -1) return "documentation_click";
        if (href.indexOf(REPO) !== -1) return "github_repository_click";
        return null;
    }

    document.addEventListener("click", (event) => {

        const link = event.target.closest("a[href]");
        if (!link) return;

        const name = eventFor(link);
        if (!name) return;

        const detail = {
            event: name,
            lang: language(),
            page: location.pathname,
            position: position(link),
            version: window.leoVersion || ""
        };

        document.dispatchEvent(new CustomEvent("leo:track", { detail }));

        if (window.goatcounter && typeof window.goatcounter.count === "function") {
            window.goatcounter.count({
                path: name + "/" + detail.lang + "/" + detail.position + (detail.version ? "/" + detail.version : ""),
                title: name,
                referrer: detail.page,
                event: true
            });
        }

    }, { capture: true });

})();
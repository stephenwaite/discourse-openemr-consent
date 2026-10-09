const KEY = "oemr-analytics-consent";

// These URLs carry one-time secret tokens that must never reach analytics.
const TOKEN_PATHS = [
  /^\/u\/password-reset\//,
  /^\/u\/activate-account\//,
  /^\/u\/confirm-new-email\//,
  /^\/u\/confirm-old-email\//,
  /^\/session\/email-login\//,
  /^\/invites\//,
];

export function isTokenPath(pathname) {
  return TOKEN_PATHS.some((re) => re.test(pathname));
}

export function createConsent({ gaId, privacyUrl, win = window }) {
  const doc = win.document;
  let banner = null;

  function getChoice() {
    try {
      return win.localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function setChoice(value) {
    try {
      win.localStorage.setItem(KEY, value);
    } catch (e) {
      // Storage blocked: the choice applies to this page view only.
    }
  }

  function loadAnalytics() {
    if (win.gtag || isTokenPath(win.location.pathname)) {
      return;
    }
    win.dataLayer = win.dataLayer || [];
    win.gtag = function () {
      win.dataLayer.push(arguments);
    };
    win.gtag("js", new Date());
    win.gtag("config", gaId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const s = doc.createElement("script");
    s.async = true;
    s.src =
      "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId);
    doc.head.appendChild(s);
  }

  // GA sets its cookies on the registrable domain, shared with www.open-emr.org.
  function clearAnalyticsCookies() {
    const host = win.location.hostname;
    const parent = host.split(".").slice(-2).join(".");
    doc.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name.indexOf("_ga") !== 0) {
        return;
      }
      [host, "." + host, parent, "." + parent].forEach((d) => {
        doc.cookie = name + "=; Max-Age=0; path=/; domain=" + d;
      });
      doc.cookie = name + "=; Max-Age=0; path=/";
    });
  }

  function choose(choice) {
    const previous = getChoice();
    setChoice(choice);
    banner.hidden = true;
    if (choice === "granted") {
      loadAnalytics();
    } else if (previous === "granted") {
      clearAnalyticsCookies();
      win.location.reload();
    }
  }

  function buildBanner() {
    banner = doc.createElement("div");
    banner.id = "analytics-consent";
    banner.className = "analytics-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Analytics consent");
    banner.hidden = true;

    const inner = doc.createElement("div");
    inner.className = "analytics-consent__inner";

    const text = doc.createElement("p");
    text.className = "analytics-consent__text";
    text.textContent =
      "We'd like to use Google Analytics cookies to understand how people use this site. They're off unless you accept. ";
    const link = doc.createElement("a");
    link.href = privacyUrl;
    link.textContent = "Privacy Policy";
    text.appendChild(link);

    const actions = doc.createElement("div");
    actions.className = "analytics-consent__actions";
    [
      ["denied", "Decline", "btn btn-default"],
      ["granted", "Accept", "btn btn-primary"],
    ].forEach(([value, label, cls]) => {
      const b = doc.createElement("button");
      b.type = "button";
      b.className = cls;
      b.dataset.consent = value;
      b.textContent = label;
      b.addEventListener("click", () => choose(value));
      actions.appendChild(b);
    });

    inner.appendChild(text);
    inner.appendChild(actions);
    banner.appendChild(inner);
    doc.body.appendChild(banner);
  }

  function openSettings() {
    banner.hidden = false;
  }

  function start() {
    buildBanner();

    // Admins can add a "Cookie settings" link anywhere that points at #cookie-settings.
    doc.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest && e.target.closest("a[href]");
        if (a && a.getAttribute("href").endsWith("#cookie-settings")) {
          e.preventDefault();
          openSettings();
        }
      },
      true
    );
    if (win.location.hash === "#cookie-settings") {
      openSettings();
    }

    const choice = getChoice();
    if (choice === "granted") {
      loadAnalytics();
    } else if (choice !== "denied" && !isTokenPath(win.location.pathname)) {
      banner.hidden = false;
    }
  }

  // After an in-app navigation, a visitor who accepted on a token page gets GA now.
  function onPageChange() {
    if (getChoice() === "granted") {
      loadAnalytics();
    }
  }

  return { start, onPageChange, openSettings };
}

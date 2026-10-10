/* LegacyFixer analytics: basic opt-in consent, shared across site and app.
   No Google tag is requested until consent is granted.
   No URL query, GitHub identity or repository identifier is sent to GA4.
*/
(function () {
  "use strict";

  var measurementId = "G-HY4QRXMJ5P";
  var consentName = "lf_analytics_consent";
  var allowed = { trial_cta_click: true, login: true, repo_connected: true };
  var state = "unknown";
  var initialized = false;
  var pending = [];

  function readConsent() {
    var parts = document.cookie.split("; ");
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].split("=");
      if (part[0] === consentName) return part[1];
    }
    return "unknown";
  }

  function writeConsent(value) {
    var domain = /(^|\.)legacyfixer\.ai$/.test(location.hostname)
      ? "; Domain=legacyfixer.ai" : "";
    document.cookie = consentName + "=" + value +
      "; Path=/; Max-Age=15552000; SameSite=Lax; Secure" + domain;
  }

  function cleanPageLocation() {
    return location.origin + location.pathname; // Explicitly omit query and fragment.
  }

  function analyticsConsent(value) {
    return {
      analytics_storage: value,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    };
  }

  function beginAnalytics() {
    if (initialized || state !== "granted") return;
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", analyticsConsent("denied"));
    window.gtag("consent", "update", analyticsConsent("granted"));
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      cookie_domain: "auto",
      page_location: cleanPageLocation(),
      page_referrer: "",
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(measurementId);
    document.head.appendChild(tag);
    while (pending.length) sendEvent(pending.shift());
  }

  function sendEvent(name) {
    if (state !== "granted" || !initialized || !allowed[name]) return;
    window.gtag("event", name, {
      transport_type: "beacon",
      page_location: cleanPageLocation(),
      page_referrer: ""
    });
  }

  window.LegacyFixerAnalytics = {
    track: function (name) {
      if (!allowed[name] || state === "denied") return;
      if (!initialized) {
        // Held only in memory while banner awaits a decision; never sent if rejected.
        if (pending.length < 10) pending.push(name);
        return;
      }
      sendEvent(name);
    }
  };

  function closePrompt() {
    var dialog = document.getElementById("lf-consent-panel");
    if (dialog) dialog.remove();
  }

  function decide(value) {
    state = value;
    writeConsent(value);
    closePrompt();
    if (state === "granted") {
      beginAnalytics();
    } else {
      pending.length = 0;
      if (initialized) {
        window.gtag("consent", "update", analyticsConsent("denied"));
        // Reload to remove the already loaded Google tag entirely.
        location.reload();
      }
    }
  }

  function buildControls() {
    var style = document.createElement("style");
    style.textContent =
      "#lf-consent-panel{position:fixed;z-index:100000;bottom:16px;left:16px;" +
      "right:16px;max-width:620px;padding:18px;background:#fff;color:#102033;" +
      "border:1px solid #cbd5e1;border-radius:16px;box-shadow:0 8px 36px #0003;" +
      "font:15px/1.5 system-ui,sans-serif}" +
      "#lf-consent-panel p{margin:6px 0 12px}" +
      "#lf-consent-panel a{color:#0b7773}" +
      "#lf-consent-panel .lf-choice{display:flex;flex-wrap:wrap;gap:9px}" +
      "#lf-consent-panel button{cursor:pointer;border:1px solid #91aab2;" +
      "background:white;padding:9px 13px;border-radius:9px;font-weight:700}" +
      "#lf-consent-panel button[data-choice=granted]{background:#11b8a6;" +
      "border-color:#11b8a6;color:#091c27}" +
      "#lf-consent-manage{position:fixed;z-index:99999;right:12px;bottom:10px;" +
      "font:12px system-ui,sans-serif;background:#fff;border:1px solid #cbd5e1;" +
      "padding:6px 9px;border-radius:8px;cursor:pointer;color:#344054}";
    document.head.appendChild(style);
    var manage = document.createElement("button");
    manage.id = "lf-consent-manage";
    manage.type = "button";
    manage.textContent = "Analytics preferences";
    manage.setAttribute("aria-label", "Change analytics consent preferences");
    manage.addEventListener("click", showPrompt);
    document.body.appendChild(manage);
  }

  function showPrompt() {
    if (document.getElementById("lf-consent-panel")) return;
    var panel = document.createElement("section");
    panel.id = "lf-consent-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Analytics consent");
    var heading = document.createElement("strong");
    heading.textContent = "Optional website analytics";
    panel.appendChild(heading);
    var info = document.createElement("p");
    info.appendChild(document.createTextNode(
      "We use Google Analytics to understand visits and product onboarding. " +
      "It is optional. No analytics is sent before you accept. "
    ));
    var privacy = document.createElement("a");
    privacy.href = "https://legacyfixer.ai/privacy";
    privacy.textContent = "Privacy policy";
    panel.appendChild(info);
    info.appendChild(privacy);
    var choices = document.createElement("div");
    choices.className = "lf-choice";
    ["denied", "granted"].forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.choice = choice;
      button.textContent = choice === "granted" ? "Accept analytics" : "Reject optional";
      button.addEventListener("click", function () { decide(choice); });
      choices.appendChild(button);
    });
    panel.appendChild(choices);
    document.body.appendChild(panel);
  }

  function ready() {
    state = readConsent();
    buildControls();
    if (location.hostname === "app.legacyfixer.ai" &&
        location.pathname === "/app") {
      var query = new URLSearchParams(location.search);
      var loginSucceeded = query.get("login_success") === "1";
      var repoConnected = query.get("connect_success") === "1";
      if (loginSucceeded || repoConnected) {
        // Remove success flags and IDs from address bar after the page was rendered.
        // The event itself sends no identifiers, and reload cannot replay it.
        history.replaceState(null, "", location.pathname);
        if (loginSucceeded) window.LegacyFixerAnalytics.track("login");
        if (repoConnected) window.LegacyFixerAnalytics.track("repo_connected");
      }
    }
    if (state === "granted") beginAnalytics();
    else if (state !== "denied") showPrompt();
    document.addEventListener("click", function (event) {
      var target = event.target.closest && event.target.closest("a[href]");
      if (!target) return;
      try {
        var link = new URL(target.href, location.href);
        if (link.hostname === "app.legacyfixer.ai" &&
            link.pathname === "/app") {
          window.LegacyFixerAnalytics.track("trial_cta_click");
        }
      } catch (e) { /* Ignore invalid or non-web links. */ }
    }, true);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();

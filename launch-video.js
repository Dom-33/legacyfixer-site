/* LegacyFixer landing: initialize YouTube player only after an explicit click.
   No third-party resources are requested by this script before that click. */
(function () {
  "use strict";

  function ready() {
    var container = document.querySelector(".home-video-player[data-video-id]");
    if (!container) return;
    var play = container.querySelector(".home-video-play");
    if (!play) return;
    play.addEventListener("click", function () {
      if (container.querySelector("iframe")) return;
      var videoId = container.getAttribute("data-video-id");
      // Allow only known-safe YouTube video IDs (the current ID is static in HTML).
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId || "")) return;

      var frame = document.createElement("iframe");
      frame.title = "LegacyFixer launch video";
      frame.setAttribute("allowfullscreen", "");
      frame.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share");
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frame.src = "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&rel=0";
      container.replaceChildren(frame);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();

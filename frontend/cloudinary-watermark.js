(function attachWatermark(window) {
  // Photos are served from ImmoGest's own VPS storage (not Cloudinary), so we
  // can't rewrite the URL to add a Cloudinary overlay transformation anymore.
  // Instead we lay the logo on top of the rendered <img> with CSS, and inject
  // this stylesheet once so any page that includes this script gets it.
  const LOGO_SRC = '/assets/bee-logo-transparent.png';
  const STYLE_ID = 'bee-watermark-style';

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .bee-watermark-logo {
        position: absolute;
        right: 4%;
        bottom: 4%;
        width: 18%;
        max-width: 140px;
        min-width: 40px;
        opacity: 0.58;
        pointer-events: none;
        user-select: none;
        z-index: 2;
      }
    `;
    document.head.appendChild(style);
  }

  // withWatermark is kept as a no-op passthrough so every existing call site
  // (img src=, PDF export, etc.) keeps working unchanged.
  const withWatermark = (imageUrl) => imageUrl;

  // Call after inserting photo <img> elements into the DOM: adds the logo
  // overlay as a sibling inside each `parentSelector` container that isn't
  // already watermarked. Safe to call repeatedly (e.g. after re-renders).
  const applyWatermarks = (parentSelector) => {
    document.querySelectorAll(parentSelector).forEach((parent) => {
      if (parent.querySelector('.bee-watermark-logo')) return;
      if (!parent.querySelector('img')) return;

      const logo = document.createElement('img');
      logo.src = LOGO_SRC;
      logo.alt = '';
      logo.className = 'bee-watermark-logo';
      logo.setAttribute('aria-hidden', 'true');
      parent.appendChild(logo);
    });
  };

  window.BeeImages = {
    ...(window.BeeImages || {}),
    withWatermark,
    applyWatermarks,
    logoSrc: LOGO_SRC
  };
})(window);

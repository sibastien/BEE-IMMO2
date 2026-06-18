// Meta Pixel tracking for public website pages.
(function setupMetaPixel() {
  const pixelId = '976765782020591';

  if (window.fbq) {
    return;
  }

  !(function initPixel(f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function fbq() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');

  const track = (eventName, data = {}) => {
    if (!window.fbq) return;
    window.fbq('track', eventName, data);
  };

  window.BeePixel = {
    track,
    trackContact: (data = {}) => track('Contact', data),
    trackLead: (data = {}) => track('Lead', data),
    trackSearch: (data = {}) => track('Search', data),
    trackViewContent: (property = {}) =>
      track('ViewContent', {
        content_ids: [property.id || property._id || property.reference || 'property'],
        content_name: property.title || 'Annonce immobiliere',
        content_category: property.propertyType || 'property',
        content_type: property.transactionType || 'property',
        currency: 'TND',
        value: Number(property.price) || 0
      })
  };

  document.addEventListener('click', (event) => {
    const whatsappLink = event.target.closest('a[href^="https://wa.me/"]');
    if (whatsappLink) {
      window.BeePixel.trackContact({ content_name: 'WhatsApp' });
      return;
    }

    const contactTrigger = event.target.closest('[data-contact-open], a[href="#contact"]');
    if (contactTrigger) {
      window.BeePixel.trackContact({ content_name: 'Contact website' });
    }
  });
})();

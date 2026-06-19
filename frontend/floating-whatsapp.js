// Adds a floating WhatsApp shortcut on public pages.
(function setupFloatingWhatsApp() {
  const phoneNumber = '21653762520';

  const addButton = () => {
    if (document.querySelector('.floating-whatsapp')) {
      return;
    }

    const link = document.createElement('a');
    link.className = 'floating-whatsapp';
    link.href = `https://wa.me/${phoneNumber}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'Envoyer un message WhatsApp');
    link.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.1 4a7.9 7.9 0 0 0-6.8 11.9L4 20l4.2-1.2A7.9 7.9 0 1 0 12.1 4zm4.6 11.2c-.2.7-1.2 1.3-1.8 1.4-.5.1-1.1.2-3.6-.8-3-1.3-4.9-4.3-5-4.5-.1-.2-1.2-1.6-1.2-3s.8-2.2 1.1-2.5c.2-.2.5-.3.8-.3h.6c.2 0 .5 0 .7.6.2.6.8 2 .9 2.1.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.4.5c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.1c.2-.3.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.5.3.6.4.1.1.1.6-.1 1.2z" />
      </svg>
      <span>WhatsApp</span>
    `;

    document.body.appendChild(link);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
    return;
  }

  addButton();
})();

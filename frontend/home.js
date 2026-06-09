const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE_URL}/api/properties`;
const REQUEST_URL = `${API_BASE_URL}/api/requests`;

const publicProperties = document.getElementById('publicProperties');
const publicCount = document.getElementById('publicCount');
const locationFilter = document.getElementById('locationFilter');
const transactionFilter = document.getElementById('transactionFilter');
const typeFilter = document.getElementById('typeFilter');
const minBudgetFilter = document.getElementById('minBudgetFilter');
const maxBudgetFilter = document.getElementById('maxBudgetFilter');
const clearFilters = document.getElementById('clearFilters');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
const carouselDots = document.getElementById('carouselDots');
const testimonialSlider = document.getElementById('testimonialSlider');
const contactModal = document.getElementById('contactModal');
const contactForm = document.getElementById('contactForm');
const contactMessage = document.getElementById('contactMessage');
const contactOpeners = document.querySelectorAll('[data-contact-open]');
const contactClosers = document.querySelectorAll('[data-contact-close]');
const forcedTransaction = document.body.dataset.transaction || '';
const isCatalogPage = document.body.dataset.pageMode === 'catalog';

let properties = [];
let visibleProperties = [];

const propertyTypeLabels = {
  apartment: 'Appartement',
  house: 'Maison',
  villa: 'Villa',
  land: 'Terrain',
  commercial: 'Commercial'
};

const transactionLabels = {
  sale: 'Vente',
  rent: 'Location'
};

const moneyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'TND',
  maximumFractionDigits: 0
});

const normalize = (value) => String(value || '').toLowerCase().trim();

const icon = (name) => {
  const icons = {
    surface: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 4v16M4 8h16"/></svg>',
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V5"/><path d="M20 19v-6a2 2 0 0 0-2-2H4v8"/><path d="M4 15h16"/><path d="M8 11V7h6a2 2 0 0 1 2 2v2"/></svg>',
    bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 2-2h1"/><path d="M14 6h4"/><path d="M15 4v4"/></svg>',
    garage: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10 12 4l9 6v10H3z"/><path d="M7 20v-7h10v7"/><path d="M9 16h6"/></svg>'
  };

  return icons[name];
};

const getFilteredProperties = () => {
  const location = normalize(locationFilter?.value);
  const transaction = forcedTransaction || transactionFilter?.value || '';
  const type = typeFilter?.value || '';
  const minBudget = Number(minBudgetFilter?.value);
  const maxBudget = Number(maxBudgetFilter?.value);

  return properties.filter((property) => {
    const price = Number(property.price);
    const matchesLocation =
      !location ||
      normalize(property.city).includes(location) ||
      normalize(property.district).includes(location) ||
      normalize(property.address).includes(location);
    const matchesTransaction = !transaction || property.transactionType === transaction;
    const matchesType = !type || property.propertyType === type;
    const matchesMinBudget = !minBudget || price >= minBudget;
    const matchesMaxBudget = !maxBudget || price <= maxBudget;

    return (
      property.status === 'available' &&
      matchesLocation &&
      matchesTransaction &&
      matchesType &&
      matchesMinBudget &&
      matchesMaxBudget
    );
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const renderProperties = () => {
  visibleProperties = getFilteredProperties();
  publicCount.textContent = `${visibleProperties.length} annonce${visibleProperties.length > 1 ? 's' : ''}`;

  if (visibleProperties.length === 0) {
    publicProperties.innerHTML = '<div class="empty-state">Aucune annonce ne correspond aux filtres.</div>';
    carouselPrev?.classList.add('hidden');
    carouselNext?.classList.add('hidden');
    carouselDots?.classList.add('hidden');
    return;
  }

  carouselPrev?.classList.toggle('hidden', isCatalogPage || visibleProperties.length <= 1);
  carouselNext?.classList.toggle('hidden', isCatalogPage || visibleProperties.length <= 1);
  carouselDots?.classList.toggle('hidden', isCatalogPage);

  publicProperties.innerHTML = visibleProperties
    .map((property) => {
      const images = property.images?.length ? property.images : [];
      const image = images.length
        ? `
          <div class="listing-slideshow" data-image-count="${images.length}">
            ${images
              .map(
                (imageUrl, index) =>
                  `<img class="listing-image ${index === 0 ? 'active' : ''}" src="${imageUrl}" alt="${property.title}" />`
              )
              .join('')}
            ${
              images.length > 1
                ? `<div class="image-dots">${images.map((_, index) => `<span class="${index === 0 ? 'active' : ''}"></span>`).join('')}</div>`
                : ''
            }
          </div>
        `
        : '<div class="listing-placeholder">Bee Solution & Consulting</div>';

      return `
        <article class="listing-card">
          ${image}
          <div class="listing-content">
            <div class="listing-topline">
              <span>${transactionLabels[property.transactionType] || property.transactionType}</span>
              <span>${propertyTypeLabels[property.propertyType] || property.propertyType}</span>
            </div>
            <h3>${property.title}</h3>
            <p class="listing-location">${property.city}, ${property.district}</p>
            <strong>${moneyFormatter.format(property.price)}</strong>
            <div class="listing-meta">
              <span title="Superficie">${icon('surface')}${property.surface} m2</span>
              <span title="Chambres">${icon('bed')}${property.bedrooms}</span>
              <span title="Salles de bain">${icon('bath')}${property.bathrooms}</span>
              <span title="Garages">${icon('garage')}${property.garages || 0}</span>
            </div>
            <div class="listing-actions">
              <a class="listing-cta" href="/property/${property.id || property._id}">Voir le detail</a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  if (!isCatalogPage) {
    renderDots();
  }
  startImageSlideshows();
};

const startImageSlideshows = () => {
  document.querySelectorAll('.listing-slideshow').forEach((slideshow) => {
    const images = slideshow.querySelectorAll('.listing-image');
    const dots = slideshow.querySelectorAll('.image-dots span');

    if (images.length <= 1 || slideshow.dataset.ready === 'true') return;

    slideshow.dataset.ready = 'true';
    let activeIndex = 0;

    window.setInterval(() => {
      images[activeIndex].classList.remove('active');
      dots[activeIndex]?.classList.remove('active');

      activeIndex = (activeIndex + 1) % images.length;

      images[activeIndex].classList.add('active');
      dots[activeIndex]?.classList.add('active');
    }, 3200);
  });
};

const getCardWidth = () => {
  const card = publicProperties.querySelector('.listing-card');
  if (!card) return publicProperties.clientWidth;

  const style = window.getComputedStyle(publicProperties);
  const gap = Number.parseFloat(style.columnGap || style.gap || 0);

  return card.getBoundingClientRect().width + gap;
};

const getActiveIndex = () => {
  const cardWidth = getCardWidth();
  return Math.round(publicProperties.scrollLeft / cardWidth);
};

const renderDots = () => {
  if (!carouselDots) return;

  carouselDots.innerHTML = visibleProperties
    .map((property, index) => `
      <button class="carousel-dot ${index === 0 ? 'active' : ''}" type="button" data-slide="${index}" aria-label="Voir annonce ${index + 1}"></button>
    `)
    .join('');
};

const updateActiveDot = () => {
  if (!carouselDots) return;

  const activeIndex = getActiveIndex();

  carouselDots.querySelectorAll('.carousel-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === activeIndex);
  });
};

const scrollToSlide = (index) => {
  publicProperties.scrollTo({
    left: getCardWidth() * index,
    behavior: 'smooth'
  });
};

const moveCarousel = (direction) => {
  const nextIndex = Math.min(
    Math.max(getActiveIndex() + direction, 0),
    visibleProperties.length - 1
  );

  scrollToSlide(nextIndex);
};

const loadProperties = async () => {
  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    properties = result.data || [];
    renderProperties();
  } catch (error) {
    publicCount.textContent = 'API indisponible';
    publicProperties.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
};

const openContactModal = () => {
  contactModal?.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.getElementById('contactName')?.focus();
};

const closeContactModal = () => {
  contactModal?.classList.add('hidden');
  document.body.classList.remove('modal-open');
};

const setContactMessage = (message, isError = false) => {
  if (!contactMessage) return;

  contactMessage.textContent = message;
  contactMessage.classList.toggle('error', isError);
};

const submitContactRequest = async (event) => {
  event.preventDefault();
  setContactMessage('Envoi en cours...');

  try {
    const response = await fetch(REQUEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: 'contact-agence',
        propertyTitle: `Contact agence - ${document.title}`,
        name: document.getElementById('contactName').value,
        phone: document.getElementById('contactPhone').value,
        email: document.getElementById('contactEmail').value,
        message: document.getElementById('contactText').value
      })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Message impossible');
    }

    contactForm.reset();
    setContactMessage('Message envoye. Bee Solution & Consulting vous contactera bientot.');
    window.setTimeout(closeContactModal, 1400);
  } catch (error) {
    setContactMessage(error.message, true);
  }
};

[locationFilter, transactionFilter, typeFilter, minBudgetFilter, maxBudgetFilter].forEach((input) => {
  input?.addEventListener('input', renderProperties);
});

clearFilters?.addEventListener('click', () => {
  if (locationFilter) locationFilter.value = '';
  if (transactionFilter) transactionFilter.value = '';
  if (typeFilter) typeFilter.value = '';
  if (minBudgetFilter) minBudgetFilter.value = '';
  if (maxBudgetFilter) maxBudgetFilter.value = '';
  renderProperties();
});

carouselPrev?.addEventListener('click', () => moveCarousel(-1));
carouselNext?.addEventListener('click', () => moveCarousel(1));
carouselDots?.addEventListener('click', (event) => {
  const slide = event.target.dataset.slide;
  if (slide === undefined) return;

  scrollToSlide(Number(slide));
});
publicProperties.addEventListener('scroll', () => {
  if (isCatalogPage) return;
  window.requestAnimationFrame(updateActiveDot);
});

if (testimonialSlider) {
  testimonialSlider.innerHTML += testimonialSlider.innerHTML;
}

contactOpeners.forEach((opener) => {
  opener.addEventListener('click', (event) => {
    event.preventDefault();
    openContactModal();
  });
});

contactClosers.forEach((closer) => {
  closer.addEventListener('click', closeContactModal);
});

contactModal?.addEventListener('click', (event) => {
  if (event.target === contactModal) {
    closeContactModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !contactModal?.classList.contains('hidden')) {
    closeContactModal();
  }
});

contactForm?.addEventListener('submit', submitContactRequest);
loadProperties();

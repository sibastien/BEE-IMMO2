const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE_URL}/api/properties`;

const publicProperties = document.getElementById('publicProperties');
const publicCount = document.getElementById('publicCount');
const locationFilter = document.getElementById('locationFilter');
const transactionFilter = document.getElementById('transactionFilter');
const typeFilter = document.getElementById('typeFilter');
const maxPriceFilter = document.getElementById('maxPriceFilter');
const clearFilters = document.getElementById('clearFilters');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
const carouselDots = document.getElementById('carouselDots');
const testimonialSlider = document.getElementById('testimonialSlider');

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
  const location = normalize(locationFilter.value);
  const transaction = transactionFilter.value;
  const type = typeFilter.value;
  const maxPrice = Number(maxPriceFilter.value);

  return properties.filter((property) => {
    const matchesLocation =
      !location ||
      normalize(property.city).includes(location) ||
      normalize(property.district).includes(location) ||
      normalize(property.address).includes(location);
    const matchesTransaction = !transaction || property.transactionType === transaction;
    const matchesType = !type || property.propertyType === type;
    const matchesPrice = !maxPrice || Number(property.price) <= maxPrice;

    return (
      property.status === 'available' &&
      matchesLocation &&
      matchesTransaction &&
      matchesType &&
      matchesPrice
    );
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const renderProperties = () => {
  visibleProperties = getFilteredProperties();
  publicCount.textContent = `${visibleProperties.length} annonce${visibleProperties.length > 1 ? 's' : ''}`;

  if (visibleProperties.length === 0) {
    publicProperties.innerHTML = '<div class="empty-state">Aucune annonce ne correspond aux filtres.</div>';
    carouselPrev.classList.add('hidden');
    carouselNext.classList.add('hidden');
    return;
  }

  carouselPrev.classList.toggle('hidden', visibleProperties.length <= 1);
  carouselNext.classList.toggle('hidden', visibleProperties.length <= 1);

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
        : '<div class="listing-placeholder">Bee Consulting</div>';

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

  renderDots();
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
  carouselDots.innerHTML = visibleProperties
    .map((property, index) => `
      <button class="carousel-dot ${index === 0 ? 'active' : ''}" type="button" data-slide="${index}" aria-label="Voir annonce ${index + 1}"></button>
    `)
    .join('');
};

const updateActiveDot = () => {
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

[locationFilter, transactionFilter, typeFilter, maxPriceFilter].forEach((input) => {
  input.addEventListener('input', renderProperties);
});

clearFilters.addEventListener('click', () => {
  locationFilter.value = '';
  transactionFilter.value = '';
  typeFilter.value = '';
  maxPriceFilter.value = '';
  renderProperties();
});

carouselPrev.addEventListener('click', () => moveCarousel(-1));
carouselNext.addEventListener('click', () => moveCarousel(1));
carouselDots.addEventListener('click', (event) => {
  const slide = event.target.dataset.slide;
  if (slide === undefined) return;

  scrollToSlide(Number(slide));
});
publicProperties.addEventListener('scroll', () => {
  window.requestAnimationFrame(updateActiveDot);
});

testimonialSlider.innerHTML += testimonialSlider.innerHTML;
loadProperties();

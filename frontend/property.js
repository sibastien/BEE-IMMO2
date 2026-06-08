const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE_URL}/api/properties`;
const REQUEST_URL = `${API_BASE_URL}/api/requests`;
const detailContainer = document.getElementById('propertyDetail');
const visitForm = document.getElementById('visitForm');
const visitMessage = document.getElementById('visitMessage');
let currentProperty = null;

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

const icon = (name) => {
  const icons = {
    surface: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 4v16M4 8h16"/></svg>',
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V5"/><path d="M20 19v-6a2 2 0 0 0-2-2H4v8"/><path d="M4 15h16"/><path d="M8 11V7h6a2 2 0 0 1 2 2v2"/></svg>',
    bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 2-2h1"/><path d="M14 6h4"/><path d="M15 4v4"/></svg>',
    garage: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10 12 4l9 6v10H3z"/><path d="M7 20v-7h10v7"/><path d="M9 16h6"/></svg>'
  };

  return icons[name];
};

const getPropertyId = () => window.location.pathname.split('/').filter(Boolean).pop();

const renderDetail = (property) => {
  const images = property.images?.length ? property.images : [];
  const mainImage = images[0]
    ? `<img class="detail-main-image" src="${images[0]}" alt="${property.title}" />`
    : '<div class="detail-placeholder">Bee Solution & Consulting</div>';
  const gallery = images
    .slice(1)
    .map((image) => `<img src="${image}" alt="${property.title}" />`)
    .join('');

  detailContainer.innerHTML = `
    <div class="detail-gallery">
      ${mainImage}
      ${gallery ? `<div class="detail-thumbs">${gallery}</div>` : ''}
    </div>

    <aside class="detail-info">
      <div class="listing-topline">
        <span>${transactionLabels[property.transactionType] || property.transactionType}</span>
        <span>${propertyTypeLabels[property.propertyType] || property.propertyType}</span>
      </div>

      <h1>${property.title}</h1>
      <p class="listing-location">${property.city}, ${property.district} - ${property.address}</p>
      <strong class="detail-price">${moneyFormatter.format(property.price)}</strong>

      <div class="detail-meta">
        <span title="Superficie">${icon('surface')}<strong>${property.surface} m2</strong></span>
        <span title="Chambres">${icon('bed')}<strong>${property.bedrooms}</strong></span>
        <span title="Salles de bain">${icon('bath')}<strong>${property.bathrooms}</strong></span>
        <span title="Garages">${icon('garage')}<strong>${property.garages || 0}</strong></span>
      </div>

      <div class="detail-description">
        <h2>Description</h2>
        <p>${property.description}</p>
      </div>

      <a class="gold-button contact-button" href="#contact">Demander une visite</a>
    </aside>
  `;
};

const loadProperty = async () => {
  try {
    const response = await fetch(`${API_URL}/${getPropertyId()}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Annonce introuvable');
    }

    currentProperty = result.data;
    document.title = `Bee Solution & Consulting - ${currentProperty.title}`;
    renderDetail(currentProperty);
  } catch (error) {
    detailContainer.innerHTML = `<div class="empty-state">${error.message}</div>`;
    visitForm.classList.add('hidden');
  }
};

const setVisitMessage = (message, isError = false) => {
  visitMessage.textContent = message;
  visitMessage.classList.toggle('error', isError);
};

const submitVisitRequest = async (event) => {
  event.preventDefault();

  if (!currentProperty) {
    setVisitMessage('Annonce indisponible.', true);
    return;
  }

  setVisitMessage('Envoi en cours...');

  try {
    const response = await fetch(REQUEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: currentProperty.id || currentProperty._id,
        propertyTitle: currentProperty.title,
        name: document.getElementById('visitorName').value,
        phone: document.getElementById('visitorPhone').value,
        email: document.getElementById('visitorEmail').value,
        message: document.getElementById('visitorMessage').value
      })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Demande impossible');
    }

    visitForm.reset();
    document.getElementById('visitorMessage').value =
      'Bonjour, je souhaite organiser une visite pour cette annonce.';
    setVisitMessage('Demande envoyee. Bee Solution & Consulting vous contactera bientot.');
  } catch (error) {
    setVisitMessage(error.message, true);
  }
};

visitForm.addEventListener('submit', submitVisitRequest);
loadProperty();

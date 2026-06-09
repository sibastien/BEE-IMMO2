const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE_URL}/api/properties`;
const AUTH_URL = `${API_BASE_URL}/api/auth`;
const TOKEN_KEY = 'bee_consulting_admin_token';

const loginPanel = document.getElementById('loginPanel');
const dashboardPanels = document.querySelectorAll('.dashboard-panel');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const logoutButton = document.getElementById('logoutButton');
const form = document.getElementById('propertyForm');
const propertiesList = document.getElementById('propertiesList');
const propertyCount = document.getElementById('propertyCount');
const apiStatus = document.getElementById('apiStatus');
const formMessage = document.getElementById('formMessage');
const submitButton = document.getElementById('submitButton');
const resetFormButton = document.getElementById('resetForm');
const refreshButton = document.getElementById('refreshButton');
const imagesInput = document.getElementById('images');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const transactionTypeInput = document.getElementById('transactionType');
const rentalTypeInput = document.getElementById('rentalType');
const rentalTypeField = document.querySelector('.rental-type-field');
const propertyTypeInput = document.getElementById('propertyType');
const bedroomsInput = document.getElementById('bedrooms');
const bathroomsInput = document.getElementById('bathrooms');
const garagesInput = document.getElementById('garages');
const abrisInput = document.getElementById('abris');
const propertyDetailFields = document.querySelectorAll('.property-detail-field');

const fields = [
  'title',
  'description',
  'price',
  'transactionType',
  'rentalType',
  'propertyType',
  'city',
  'district',
  'address',
  'surface',
  'bedrooms',
  'bathrooms',
  'garages',
  'abris',
  'images',
  'status'
];

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

const rentalTypeLabels = {
  standard: 'Location normale',
  summer: 'Location estivale',
  nightly: 'Nuitee'
};

const statusLabels = {
  available: 'Disponible',
  sold: 'Vendue',
  rented: 'Louee'
};

const moneyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'TND',
  maximumFractionDigits: 0
});

const getToken = () => localStorage.getItem(TOKEN_KEY);

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

const setAuthState = (isLoggedIn) => {
  loginPanel.classList.toggle('hidden', isLoggedIn);
  dashboardPanels.forEach((panel) => {
    panel.classList.toggle('hidden', !isLoggedIn);
  });
  logoutButton.classList.toggle('hidden', !isLoggedIn);
  submitButton.disabled = !isLoggedIn;
};

const setStatus = (online) => {
  apiStatus.textContent = online ? 'API connectee' : 'API indisponible';
  apiStatus.className = `api-status ${online ? 'online' : 'offline'}`;
};

const setLoginMessage = (message, isError = false) => {
  loginMessage.textContent = message;
  loginMessage.classList.toggle('error', isError);
};

const setMessage = (message, isError = false) => {
  formMessage.textContent = message;
  formMessage.classList.toggle('error', isError);
};

const getImageValues = () =>
  imagesInput.value
    .split(/\n+/)
    .map((url) => url.trim())
    .filter(Boolean);

const setImageValues = (images) => {
  imagesInput.value = images.join('\n');
  renderImagePreview();
};

const renderImagePreview = () => {
  const images = getImageValues();

  if (!imagePreview) return;

  if (images.length === 0) {
    imagePreview.innerHTML = '<div class="upload-hint">Aucune photo ajoutee.</div>';
    return;
  }

  imagePreview.innerHTML = images
    .map(
      (image, index) => `
        <div class="image-preview-item">
          <img src="${image}" alt="Photo ${index + 1}" />
          <span class="image-order-badge">${index + 1}</span>
          <div class="image-order-controls">
            <button type="button" data-image-move="${index}" data-direction="-1" ${index === 0 ? 'disabled' : ''} aria-label="Monter la photo ${index + 1}">↑</button>
            <button type="button" data-image-move="${index}" data-direction="1" ${index === images.length - 1 ? 'disabled' : ''} aria-label="Descendre la photo ${index + 1}">↓</button>
          </div>
          <button class="image-remove" type="button" data-image-remove="${index}" aria-label="Retirer la photo ${index + 1}">&times;</button>
        </div>
      `
    )
    .join('');
};

const resizeImageFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Veuillez choisir uniquement des images.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 1400;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };

      image.onerror = () => reject(new Error("Impossible de lire l'image."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.readAsDataURL(file);
  });

const handleImageUpload = async () => {
  const files = Array.from(imageUpload.files || []);

  if (files.length === 0) return;

  try {
    setMessage('Preparation des photos...');
    const existingImages = getImageValues();
    const availableSlots = Math.max(0, 8 - existingImages.length);
    const selectedFiles = files.slice(0, availableSlots);

    if (selectedFiles.length === 0) {
      throw new Error('Maximum 8 photos par annonce.');
    }

    const uploadedImages = await Promise.all(selectedFiles.map(resizeImageFile));
    imagesInput.value = [...existingImages, ...uploadedImages].join('\n');
    imageUpload.value = '';
    renderImagePreview();
    setMessage(`${uploadedImages.length} photo${uploadedImages.length > 1 ? 's' : ''} ajoutee${uploadedImages.length > 1 ? 's' : ''}.`);
  } catch (error) {
    setMessage(error.message, true);
  }
};

const getFormData = () => {
  const images = getImageValues();
  const propertyType = propertyTypeInput.value;
  const isLand = propertyType === 'land';

  return {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    price: Number(document.getElementById('price').value),
    transactionType: transactionTypeInput.value,
    rentalType: transactionTypeInput.value === 'rent' ? rentalTypeInput.value : 'standard',
    propertyType,
    city: document.getElementById('city').value.trim(),
    district: document.getElementById('district').value.trim(),
    address: document.getElementById('address').value.trim(),
    surface: Number(document.getElementById('surface').value),
    bedrooms: isLand ? 0 : Number(bedroomsInput.value),
    bathrooms: isLand ? 0 : Number(bathroomsInput.value),
    garages: isLand ? 0 : Number(garagesInput.value || 0),
    abris: isLand ? 0 : Number(abrisInput.value || 0),
    images,
    status: document.getElementById('status').value
  };
};

const updatePropertyDetailRequirements = () => {
  const isLand = propertyTypeInput.value === 'land';

  bedroomsInput.required = !isLand;
  bathroomsInput.required = !isLand;
  garagesInput.required = false;
  abrisInput.required = false;

  propertyDetailFields.forEach((field) => {
    field.classList.toggle('optional-field', isLand);
  });

  if (isLand) {
    bedroomsInput.value = bedroomsInput.value || 0;
    bathroomsInput.value = bathroomsInput.value || 0;
    garagesInput.value = garagesInput.value || 0;
    abrisInput.value = abrisInput.value || 0;
  }
};

const updateRentalTypeVisibility = () => {
  const isRent = transactionTypeInput.value === 'rent';

  rentalTypeField?.classList.toggle('hidden', !isRent);
  rentalTypeInput.disabled = !isRent;

  if (!isRent) {
    rentalTypeInput.value = 'standard';
    return;
  }

  if (!rentalTypeInput.value) {
    rentalTypeInput.value = 'standard';
  }
};

const icon = (name) => {
  const icons = {
    surface: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 4v16M4 8h16"/></svg>',
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V5"/><path d="M20 19v-6a2 2 0 0 0-2-2H4v8"/><path d="M4 15h16"/><path d="M8 11V7h6a2 2 0 0 1 2 2v2"/></svg>',
    bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 2-2h1"/><path d="M14 6h4"/><path d="M15 4v4"/></svg>',
    garage: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10 12 4l9 6v10H3z"/><path d="M7 20v-7h10v7"/><path d="M9 16h6"/></svg>',
    abri: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h14"/><path d="M7 16l1.5-5h7L17 16"/><path d="M8 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/><path d="M16 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>'
  };

  return icons[name];
};

const resetForm = () => {
  form.reset();
  document.getElementById('propertyId').value = '';
  if (imageUpload) imageUpload.value = '';
  submitButton.textContent = "Ajouter l'annonce";
  setMessage('');
  updateRentalTypeVisibility();
  updatePropertyDetailRequirements();
  renderImagePreview();
};

const fillForm = (property) => {
  document.getElementById('propertyId').value = property.id || property._id;

  fields.forEach((field) => {
    const element = document.getElementById(field);
    if (!element) return;

    element.value = Array.isArray(property[field])
      ? property[field].join('\n')
      : property[field] ?? '';
  });

  submitButton.textContent = "Modifier l'annonce";
  updateRentalTypeVisibility();
  updatePropertyDetailRequirements();
  renderImagePreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const renderProperties = (properties) => {
  propertyCount.textContent = `${properties.length} annonce${properties.length > 1 ? 's' : ''}`;

  if (properties.length === 0) {
    propertiesList.innerHTML = '<div class="empty-state">Aucune annonce pour le moment.</div>';
    return;
  }

  propertiesList.innerHTML = properties
    .map((property) => {
      const id = property.id || property._id;
      const isLand = property.propertyType === 'land';
      const image = property.images?.[0]
        ? `<img class="property-image" src="${property.images[0]}" alt="${property.title}" />`
        : '<div class="property-placeholder">Sans image</div>';

      return `
        <article class="property-card">
          <div>${image}</div>
          <div class="property-content">
            <div class="property-header">
              <div>
                <h3 class="property-title">${property.title}</h3>
                <strong>${moneyFormatter.format(property.price)}</strong>
              </div>
              <span class="badge ${property.status}">${statusLabels[property.status] || property.status}</span>
            </div>
            <div class="property-meta">
              <span class="badge">${transactionLabels[property.transactionType] || property.transactionType}</span>
              ${
                property.transactionType === 'rent'
                  ? `<span class="badge">${rentalTypeLabels[property.rentalType] || rentalTypeLabels.standard}</span>`
                  : ''
              }
              <span class="badge icon-badge">${propertyTypeLabels[property.propertyType] || property.propertyType}</span>
              <span class="badge icon-badge" title="Superficie">${icon('surface')}${property.surface} m2</span>
              ${
                isLand
                  ? ''
                  : `
                    <span class="badge icon-badge" title="Chambres">${icon('bed')}${property.bedrooms}</span>
                    <span class="badge icon-badge" title="Salles de bain">${icon('bath')}${property.bathrooms}</span>
                    <span class="badge icon-badge" title="Garages">${icon('garage')}${property.garages || 0}</span>
                    <span class="badge icon-badge" title="Abris voiture">${icon('abri')}${property.abris || 0}</span>
                  `
              }
            </div>
            <p class="property-description">${property.description}</p>
            <p class="property-description">${property.city}, ${property.district} - ${property.address}</p>
            <div class="property-actions">
              <button class="secondary" type="button" data-edit="${id}">Modifier</button>
              <button class="danger" type="button" data-delete="${id}">Supprimer</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
};

const loadProperties = async () => {
  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    setStatus(true);
    renderProperties(result.data);
  } catch (error) {
    setStatus(false);
    propertiesList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
};

const saveProperty = async (event) => {
  event.preventDefault();
  setMessage('Enregistrement...');

  const id = document.getElementById('propertyId').value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/${id}` : API_URL;

  try {
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(getFormData())
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    resetForm();
    setMessage(id ? 'Annonce modifiee.' : 'Annonce ajoutee.');
    await loadProperties();
  } catch (error) {
    setMessage(error.message, true);
  }
};

const deleteProperty = async (id) => {
  if (!confirm('Supprimer cette annonce ?')) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    await loadProperties();
  } catch (error) {
    alert(error.message);
  }
};

const loginAdmin = async (event) => {
  event.preventDefault();
  setLoginMessage('Connexion...');

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('adminEmail').value.trim(),
        password: document.getElementById('adminPassword').value
      })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Connexion impossible');
    }

    localStorage.setItem(TOKEN_KEY, result.token);
    setAuthState(true);
    setLoginMessage('');
    setMessage('Connecte en admin.');
    await loadProperties();
  } catch (error) {
    setLoginMessage(error.message, true);
  }
};

const logoutAdmin = () => {
  localStorage.removeItem(TOKEN_KEY);
  setAuthState(false);
  resetForm();
  setLoginMessage('Deconnecte.');
};

propertiesList.addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const response = await fetch(`${API_URL}/${editId}`);
    const result = await response.json();

    if (response.ok) {
      fillForm(result.data);
    }
  }

  if (deleteId) {
    await deleteProperty(deleteId);
  }
});

form.addEventListener('submit', saveProperty);
transactionTypeInput.addEventListener('change', updateRentalTypeVisibility);
propertyTypeInput.addEventListener('change', updatePropertyDetailRequirements);
imagesInput.addEventListener('input', renderImagePreview);
imageUpload.addEventListener('change', handleImageUpload);
imagePreview.addEventListener('click', (event) => {
  const removeIndex = event.target.dataset.imageRemove;
  const moveIndex = event.target.dataset.imageMove;

  const images = getImageValues();

  if (removeIndex !== undefined) {
    images.splice(Number(removeIndex), 1);
    setImageValues(images);
    return;
  }

  if (moveIndex !== undefined) {
    const from = Number(moveIndex);
    const to = from + Number(event.target.dataset.direction);

    if (to < 0 || to >= images.length) return;

    const [image] = images.splice(from, 1);
    images.splice(to, 0, image);
    setImageValues(images);
  }
});
loginForm.addEventListener('submit', loginAdmin);
logoutButton.addEventListener('click', logoutAdmin);
resetFormButton.addEventListener('click', resetForm);
refreshButton.addEventListener('click', loadProperties);

setAuthState(Boolean(getToken()));
if (getToken()) {
  loadProperties();
} else {
  setStatus(false);
  apiStatus.textContent = 'Connexion admin requise';
}

updatePropertyDetailRequirements();
updateRentalTypeVisibility();
renderImagePreview();

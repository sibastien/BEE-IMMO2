const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const TESTIMONIAL_URL = `${API_BASE_URL}/api/testimonials`;
const AUTH_URL = `${API_BASE_URL}/api/auth`;
const TOKEN_KEY = 'bee_consulting_admin_token';

const loginPanel = document.getElementById('loginPanel');
const dashboardPanels = document.querySelectorAll('.dashboard-panel');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const logoutButton = document.getElementById('logoutButton');
const form = document.getElementById('testimonialForm');
const testimonialsList = document.getElementById('testimonialsList');
const testimonialCount = document.getElementById('testimonialCount');
const apiStatus = document.getElementById('apiStatus');
const formMessage = document.getElementById('formMessage');
const submitButton = document.getElementById('submitButton');
const resetFormButton = document.getElementById('resetForm');
const refreshButton = document.getElementById('refreshButton');

const fields = ['clientName', 'context', 'quote', 'rating', 'sortOrder', 'status'];

const getToken = () => localStorage.getItem(TOKEN_KEY);
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const setAuthState = (isLoggedIn) => {
  loginPanel.classList.toggle('hidden', isLoggedIn);
  dashboardPanels.forEach((panel) => panel.classList.toggle('hidden', !isLoggedIn));
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

const getFormData = () => ({
  clientName: document.getElementById('clientName').value.trim(),
  context: document.getElementById('context').value.trim() || 'Client Bee Solution & Consulting',
  quote: document.getElementById('quote').value.trim(),
  rating: Number(document.getElementById('rating').value),
  sortOrder: Number(document.getElementById('sortOrder').value || 0),
  featured: document.getElementById('featured').checked,
  status: document.getElementById('status').value
});

const resetForm = () => {
  form.reset();
  document.getElementById('testimonialId').value = '';
  document.getElementById('rating').value = '5';
  document.getElementById('sortOrder').value = '0';
  submitButton.textContent = "Publier l'avis";
  setMessage('');
};

const fillForm = (testimonial) => {
  document.getElementById('testimonialId').value = testimonial.id || testimonial._id;

  fields.forEach((field) => {
    const element = document.getElementById(field);
    if (element) element.value = testimonial[field] ?? '';
  });

  document.getElementById('featured').checked = Boolean(testimonial.featured);
  submitButton.textContent = "Modifier l'avis";
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const renderStars = (rating = 5) => '&#9733;'.repeat(Math.max(1, Math.min(5, Number(rating) || 5)));

const renderTestimonials = (testimonials) => {
  testimonialCount.textContent = `${testimonials.length} avis`;

  if (testimonials.length === 0) {
    testimonialsList.innerHTML = '<div class="empty-state">Aucun avis pour le moment.</div>';
    return;
  }

  testimonialsList.innerHTML = testimonials
    .map((testimonial) => {
      const id = testimonial.id || testimonial._id;
      const isPublished = testimonial.status === 'published';

      return `
        <article class="property-card">
          <div class="property-content">
            <div class="property-header">
              <div>
                <h3 class="property-title">${escapeHtml(testimonial.clientName)}</h3>
                <p class="property-description">${escapeHtml(testimonial.context || 'Client Bee Solution & Consulting')}</p>
              </div>
              <span class="badge ${isPublished ? 'available' : 'rented'}">${isPublished ? 'Publie' : 'Brouillon'}</span>
            </div>
            <div class="stars">${renderStars(testimonial.rating)}</div>
            <p class="property-description">"${escapeHtml(testimonial.quote)}"</p>
            <p class="property-description">${testimonial.featured ? 'Mis en avant' : 'Affichage standard'} - Ordre ${testimonial.sortOrder || 0}</p>
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

const loadTestimonials = async () => {
  try {
    const response = await fetch(`${TESTIMONIAL_URL}/admin`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    setStatus(true);
    renderTestimonials(result.data || []);
  } catch (error) {
    setStatus(false);
    testimonialsList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
};

const saveTestimonial = async (event) => {
  event.preventDefault();
  setMessage('Enregistrement...');

  const id = document.getElementById('testimonialId').value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${TESTIMONIAL_URL}/${id}` : TESTIMONIAL_URL;

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
    setMessage(id ? 'Avis modifie.' : 'Avis ajoute.');
    await loadTestimonials();
  } catch (error) {
    setMessage(error.message, true);
  }
};

const deleteTestimonial = async (id) => {
  if (!confirm('Supprimer cet avis ?')) return;

  try {
    const response = await fetch(`${TESTIMONIAL_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    await loadTestimonials();
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
    await loadTestimonials();
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

testimonialsList.addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const response = await fetch(`${TESTIMONIAL_URL}/admin/${editId}`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (response.ok) {
      fillForm(result.data);
    }
  }

  if (deleteId) {
    await deleteTestimonial(deleteId);
  }
});

form.addEventListener('submit', saveTestimonial);
loginForm.addEventListener('submit', loginAdmin);
logoutButton.addEventListener('click', logoutAdmin);
resetFormButton.addEventListener('click', resetForm);
refreshButton.addEventListener('click', loadTestimonials);

setAuthState(Boolean(getToken()));
if (getToken()) {
  loadTestimonials();
} else {
  setStatus(false);
  apiStatus.textContent = 'Connexion admin requise';
}

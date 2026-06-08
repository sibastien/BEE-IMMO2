const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const AUTH_URL = `${API_BASE_URL}/api/auth`;
const REQUEST_URL = `${API_BASE_URL}/api/requests`;
const TOKEN_KEY = 'bee_consulting_admin_token';

const loginPanel = document.getElementById('loginPanel');
const dashboardPanels = document.querySelectorAll('.dashboard-panel');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const logoutButton = document.getElementById('logoutButton');
const apiStatus = document.getElementById('apiStatus');
const refreshRequestsButton = document.getElementById('refreshRequestsButton');
const requestsList = document.getElementById('requestsList');
const requestCount = document.getElementById('requestCount');

const getToken = () => localStorage.getItem(TOKEN_KEY);

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

const setStatus = (online, text) => {
  apiStatus.textContent = text || (online ? 'Admin connecte' : 'Connexion admin requise');
  apiStatus.className = `api-status ${online ? 'online' : 'offline'}`;
};

const setAuthState = (isLoggedIn) => {
  loginPanel.classList.toggle('hidden', isLoggedIn);
  dashboardPanels.forEach((panel) => {
    panel.classList.toggle('hidden', !isLoggedIn);
  });
  logoutButton.classList.toggle('hidden', !isLoggedIn);
  setStatus(isLoggedIn);
};

const setLoginMessage = (message, isError = false) => {
  loginMessage.textContent = message;
  loginMessage.classList.toggle('error', isError);
};

const loadRequests = async () => {
  if (!getToken()) return;

  try {
    const response = await fetch(REQUEST_URL, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    requestCount.textContent = `${result.count} demande${result.count > 1 ? 's' : ''}`;

    if (result.data.length === 0) {
      requestsList.innerHTML = '<div class="empty-state">Aucune demande pour le moment.</div>';
      return;
    }

    requestsList.innerHTML = result.data
      .map((request) => `
        <article class="request-card">
          <div>
            <div class="request-header">
              <h3>${request.name}</h3>
              <span>${new Date(request.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            <p><strong>Annonce:</strong> ${request.propertyTitle}</p>
            <p><strong>Telephone:</strong> ${request.phone}</p>
            ${request.email ? `<p><strong>Email:</strong> ${request.email}</p>` : ''}
            <p>${request.message}</p>
          </div>
          <button class="danger" type="button" data-request-delete="${request._id}">Supprimer</button>
        </article>
      `)
      .join('');
  } catch (error) {
    requestsList.innerHTML = `<div class="empty-state">${error.message}</div>`;
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
    await loadRequests();
  } catch (error) {
    setLoginMessage(error.message, true);
  }
};

const logoutAdmin = () => {
  localStorage.removeItem(TOKEN_KEY);
  requestsList.innerHTML = '';
  requestCount.textContent = '0 demande';
  setAuthState(false);
  setLoginMessage('Deconnecte.');
};

requestsList.addEventListener('click', async (event) => {
  const requestId = event.target.dataset.requestDelete;
  if (!requestId || !confirm('Supprimer cette demande ?')) return;

  try {
    const response = await fetch(`${REQUEST_URL}/${requestId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    await loadRequests();
  } catch (error) {
    alert(error.message);
  }
});

loginForm.addEventListener('submit', loginAdmin);
logoutButton.addEventListener('click', logoutAdmin);
refreshRequestsButton.addEventListener('click', loadRequests);

setAuthState(Boolean(getToken()));
if (getToken()) {
  loadRequests();
}

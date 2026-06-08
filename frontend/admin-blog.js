const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const BLOG_URL = `${API_BASE_URL}/api/blog`;
const AUTH_URL = `${API_BASE_URL}/api/auth`;
const TOKEN_KEY = 'bee_consulting_admin_token';

const loginPanel = document.getElementById('loginPanel');
const dashboardPanels = document.querySelectorAll('.dashboard-panel');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const logoutButton = document.getElementById('logoutButton');
const form = document.getElementById('blogForm');
const postsList = document.getElementById('postsList');
const postCount = document.getElementById('postCount');
const apiStatus = document.getElementById('apiStatus');
const formMessage = document.getElementById('formMessage');
const submitButton = document.getElementById('submitButton');
const resetFormButton = document.getElementById('resetForm');
const refreshButton = document.getElementById('refreshButton');

const fields = ['title', 'excerpt', 'content', 'category', 'author', 'coverImage', 'status'];

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const getToken = () => localStorage.getItem(TOKEN_KEY);
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

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

const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : 'Brouillon');

const getFormData = () => ({
  title: document.getElementById('title').value.trim(),
  excerpt: document.getElementById('excerpt').value.trim(),
  content: document.getElementById('content').value.trim(),
  category: document.getElementById('category').value.trim() || 'Conseils immobiliers',
  author: document.getElementById('author').value.trim() || 'Bee Consulting',
  coverImage: document.getElementById('coverImage').value.trim(),
  status: document.getElementById('status').value
});

const resetForm = () => {
  form.reset();
  document.getElementById('postId').value = '';
  document.getElementById('category').value = 'Conseils immobiliers';
  document.getElementById('author').value = 'Bee Consulting';
  submitButton.textContent = "Publier l'article";
  setMessage('');
};

const fillForm = (post) => {
  document.getElementById('postId').value = post.id || post._id;

  fields.forEach((field) => {
    const element = document.getElementById(field);
    if (element) element.value = post[field] ?? '';
  });

  submitButton.textContent = "Modifier l'article";
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const renderPosts = (posts) => {
  postCount.textContent = `${posts.length} article${posts.length > 1 ? 's' : ''}`;

  if (posts.length === 0) {
    postsList.innerHTML = '<div class="empty-state">Aucun article pour le moment.</div>';
    return;
  }

  postsList.innerHTML = posts
    .map((post) => {
      const id = post.id || post._id;
      const image = post.coverImage
        ? `<img class="property-image" src="${post.coverImage}" alt="${post.title}" />`
        : '<div class="property-placeholder">Sans image</div>';
      const publicLink = post.status === 'published'
        ? `<a class="secondary" href="/blog/${post.slug}" target="_blank">Voir</a>`
        : '';

      return `
        <article class="property-card">
          <div>${image}</div>
          <div class="property-content">
            <div class="property-header">
              <div>
                <h3 class="property-title">${post.title}</h3>
                <p class="property-description">${post.category || 'Conseils immobiliers'} - ${formatDate(post.publishedAt || post.createdAt)}</p>
              </div>
              <span class="badge ${post.status === 'published' ? 'available' : 'rented'}">${post.status === 'published' ? 'Publie' : 'Brouillon'}</span>
            </div>
            <p class="property-description">${post.excerpt}</p>
            <div class="property-actions">
              ${publicLink}
              <button class="secondary" type="button" data-edit="${id}">Modifier</button>
              <button class="danger" type="button" data-delete="${id}">Supprimer</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
};

const loadPosts = async () => {
  try {
    const response = await fetch(`${BLOG_URL}/admin`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    setStatus(true);
    renderPosts(result.data || []);
  } catch (error) {
    setStatus(false);
    postsList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
};

const savePost = async (event) => {
  event.preventDefault();
  setMessage('Enregistrement...');

  const id = document.getElementById('postId').value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${BLOG_URL}/${id}` : BLOG_URL;

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
    setMessage(id ? 'Article modifie.' : 'Article ajoute.');
    await loadPosts();
  } catch (error) {
    setMessage(error.message, true);
  }
};

const deletePost = async (id) => {
  if (!confirm('Supprimer cet article ?')) return;

  try {
    const response = await fetch(`${BLOG_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur API');
    }

    await loadPosts();
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
    await loadPosts();
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

postsList.addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const response = await fetch(`${BLOG_URL}/admin/${editId}`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (response.ok) {
      fillForm(result.data);
    }
  }

  if (deleteId) {
    await deletePost(deleteId);
  }
});

form.addEventListener('submit', savePost);
loginForm.addEventListener('submit', loginAdmin);
logoutButton.addEventListener('click', logoutAdmin);
resetFormButton.addEventListener('click', resetForm);
refreshButton.addEventListener('click', loadPosts);

setAuthState(Boolean(getToken()));
if (getToken()) {
  loadPosts();
} else {
  setStatus(false);
  apiStatus.textContent = 'Connexion admin requise';
}

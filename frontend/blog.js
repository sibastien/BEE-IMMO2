const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const BLOG_URL = `${API_BASE_URL}/api/blog`;
const blogPosts = document.getElementById('blogPosts');
const blogCount = document.getElementById('blogCount');

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
});

const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : 'Bientot');

const renderPosts = (posts) => {
  blogCount.textContent = `${posts.length} article${posts.length > 1 ? 's' : ''}`;

  if (posts.length === 0) {
    blogPosts.innerHTML = '<div class="empty-state">Aucun article publie pour le moment.</div>';
    return;
  }

  blogPosts.innerHTML = posts
    .map((post) => {
      const image = post.coverImage
        ? `<img class="blog-card-image" src="${post.coverImage}" alt="${post.title}" />`
        : '<div class="blog-card-placeholder">Bee Solution & Consulting</div>';

      return `
        <article class="blog-card">
          ${image}
          <div class="blog-card-content">
            <div class="blog-meta">
              <span>${post.category || 'Conseils immobiliers'}</span>
              <span>${formatDate(post.publishedAt || post.createdAt)}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <a class="listing-cta" href="/blog/${post.slug}">Lire l'article</a>
          </div>
        </article>
      `;
    })
    .join('');
};

const loadPosts = async () => {
  try {
    const response = await fetch(BLOG_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Blog indisponible');
    }

    renderPosts(result.data || []);
  } catch (error) {
    blogCount.textContent = 'API indisponible';
    blogPosts.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
};

loadPosts();

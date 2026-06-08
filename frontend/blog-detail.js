const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const BLOG_URL = `${API_BASE_URL}/api/blog`;
const blogArticle = document.getElementById('blogArticle');

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
});

const getSlug = () => window.location.pathname.split('/').filter(Boolean).pop();
const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : 'Bientot');
const renderContent = (content) =>
  content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('');

const renderArticle = (post) => {
  document.title = `Bee Solution & Consulting - ${post.title}`;

  const image = post.coverImage
    ? `<img class="article-cover" src="${post.coverImage}" alt="${post.title}" />`
    : '<div class="article-cover article-placeholder">Bee Solution & Consulting</div>';

  blogArticle.innerHTML = `
    ${image}
    <div class="article-content">
      <div class="blog-meta">
        <span>${post.category || 'Conseils immobiliers'}</span>
        <span>${formatDate(post.publishedAt || post.createdAt)}</span>
        <span>${post.author || 'Bee Solution & Consulting'}</span>
      </div>
      <h1>${post.title}</h1>
      <p class="article-excerpt">${post.excerpt}</p>
      <div class="article-body">${renderContent(post.content)}</div>
    </div>
  `;
};

const loadArticle = async () => {
  try {
    const response = await fetch(`${BLOG_URL}/${getSlug()}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Article introuvable');
    }

    renderArticle(result.data);
  } catch (error) {
    blogArticle.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
};

loadArticle();

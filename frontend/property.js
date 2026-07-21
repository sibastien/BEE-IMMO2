const API_BASE_URL = (window.BEE_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE_URL}/api/properties`;
const REQUEST_URL = `${API_BASE_URL}/api/requests`;
const detailContainer = document.getElementById('propertyDetail');
const visitForm = document.getElementById('visitForm');
const visitMessage = document.getElementById('visitMessage');
const photoLightbox = document.getElementById('photoLightbox');
const photoLightboxImage = document.getElementById('photoLightboxImage');
const photoLightboxClose = document.getElementById('photoLightboxClose');
const photoLightboxPrev = document.getElementById('photoLightboxPrev');
const photoLightboxNext = document.getElementById('photoLightboxNext');
let currentProperty = null;
let currentPhotoIndex = 0;
let detailCarouselTimer = null;

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
  standard: 'Location annuelle',
  summer: 'Location estivale',
  nightly: 'Nuitee'
};

// Equipements & prestations: maps ImmoGest's French feature labels to an icon key.
const featureIconKeys = {
  'Parking': 'parking',
  'Ascenseur': 'elevator',
  'Piscine': 'pool',
  'Jardin': 'garden',
  'Terrasse': 'terrace',
  'Balcon': 'balcony',
  'Climatisation': 'ac',
  'Meublé': 'furnished',
  'Gardien': 'guard',
  'Concierge': 'concierge',
  'Cave': 'cave',
  'Buanderie': 'laundry',
  'Vue mer': 'sea',
  'Neuf': 'new',
  'Viabilisé': 'utilities',
  'WiFi': 'wifi'
};

const featureIcon = (label) => icon(featureIconKeys[label] || 'check');

const moneyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'TND',
  maximumFractionDigits: 0
});

const formatPropertyPrice = (property) => {
  return moneyFormatter.format(property.price);
};

const displayImageUrl = (imageUrl) => window.BeeImages?.withWatermark?.(imageUrl) || imageUrl;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const cleanDescriptionText = (description) =>
  String(description || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const splitLongDescription = (description) => {
  const cleanText = cleanDescriptionText(description);
  if (!cleanText) return [];

  // Every Enter pressed in the admin becomes a new line on the site
  const manualParagraphs = cleanText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (manualParagraphs.length > 1) {
    return manualParagraphs;
  }

  const sentences = cleanText
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ÿ0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [cleanText];
  }

  const paragraphs = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(' '));
  }

  return paragraphs;
};

const renderFormattedDescription = (description) => {
  const paragraphs = splitLongDescription(description);

  if (!paragraphs.length) {
    return '<p>Details du bien disponibles sur demande.</p>';
  }

  return paragraphs
    .map((paragraph, index) =>
      index === 0
        ? `<p class="description-lead">${escapeHtml(paragraph)}</p>`
        : `<p>${escapeHtml(paragraph)}</p>`
    )
    .join('');
};

const icon = (name) => {
  const icons = {
    surface: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 4v16M4 8h16"/></svg>',
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V5"/><path d="M20 19v-6a2 2 0 0 0-2-2H4v8"/><path d="M4 15h16"/><path d="M8 11V7h6a2 2 0 0 1 2 2v2"/></svg>',
    bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 2-2h1"/><path d="M14 6h4"/><path d="M15 4v4"/></svg>',
    garage: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10 12 4l9 6v10H3z"/><path d="M7 20v-7h10v7"/><path d="M9 16h6"/></svg>',
    abri: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h14"/><path d="M7 16l1.5-5h7L17 16"/><path d="M8 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/><path d="M16 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>',
    parking: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>',
    elevator: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M10 9l2-2 2 2"/><path d="M10 15l2 2 2-2"/></svg>',
    pool: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/><path d="M6 13V6a2 2 0 0 1 2-2h3l7 7"/></svg>',
    garden: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22V12"/><path d="M12 12c0-4-3-7-7-7 0 4 3 7 7 7"/><path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7"/></svg>',
    terrace: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18"/><path d="M5 20V10l7-5 7 5v10"/><path d="M9 20v-6h6v6"/></svg>',
    balcony: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="4" rx="1"/><path d="M6 14v6M12 14v6M18 14v6"/></svg>',
    ac: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="6" rx="1"/><path d="M7 16v3M12 16v3M17 16v3"/></svg>',
    furnished: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5"/><path d="M4 15h16"/><path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/></svg>',
    guard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
    concierge: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/></svg>',
    cave: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V11a8 8 0 0 1 16 0v10"/><path d="M4 21h16"/></svg>',
    laundry: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6h1"/></svg>',
    sea: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/><path d="M3 20c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/><circle cx="17" cy="6" r="2"/></svg>',
    new: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/></svg>',
    utilities: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  return icons[name];
};

const getPropertyId = () => window.location.pathname.split('/').filter(Boolean).pop();

const getCurrentImages = () => {
  if (!currentProperty) return [];
  // Support both new 'images' array and old 'image' field
  if (Array.isArray(currentProperty.images) && currentProperty.images.length > 0) {
    return currentProperty.images.filter(img => img && typeof img === 'string');
  }
  if (currentProperty.image && typeof currentProperty.image === 'string') {
    return [currentProperty.image];
  }
  return [];
};

const updateGallery = (index) => {
  const images = getCurrentImages();
  if (!images.length) return;

  currentPhotoIndex = (index + images.length) % images.length;
  const activeImage = displayImageUrl(images[currentPhotoIndex]);
  const mainImage = detailContainer.querySelector('.detail-main-image');
  const counter = detailContainer.querySelector('.detail-photo-count');

  if (mainImage) {
    mainImage.src = activeImage;
    mainImage.alt = `${currentProperty.title} - photo ${currentPhotoIndex + 1}`;
  }

  if (counter) {
    counter.textContent = `${currentPhotoIndex + 1} / ${images.length}`;
  }

};

const openLightbox = (index = currentPhotoIndex) => {
  const images = getCurrentImages();
  if (!images.length) return;

  updateGallery(index);
  photoLightboxImage.src = displayImageUrl(images[currentPhotoIndex]);
  photoLightboxImage.alt = `${currentProperty.title} - photo ${currentPhotoIndex + 1}`;
  photoLightbox.classList.remove('hidden');
  document.body.classList.add('modal-open');
};

const closeLightbox = () => {
  photoLightbox.classList.add('hidden');
  photoLightboxImage.src = '';
  document.body.classList.remove('modal-open');
};

const movePhoto = (direction) => {
  updateGallery(currentPhotoIndex + direction);

  if (!photoLightbox.classList.contains('hidden')) {
    const images = getCurrentImages();
    photoLightboxImage.src = displayImageUrl(images[currentPhotoIndex]);
    photoLightboxImage.alt = `${currentProperty.title} - photo ${currentPhotoIndex + 1}`;
  }
};

const stopDetailCarousel = () => {
  if (!detailCarouselTimer) return;

  window.clearInterval(detailCarouselTimer);
  detailCarouselTimer = null;
};

const startDetailCarousel = () => {
  stopDetailCarousel();

  if (getCurrentImages().length <= 1) return;

  detailCarouselTimer = window.setInterval(() => {
    if (!photoLightbox.classList.contains('hidden')) return;
    movePhoto(1);
  }, 4200);
};

const shareProperty = async () => {
  const shareUrl = window.location.href;
  const shareTitle = currentProperty?.title || document.title;

  try {
    if (navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: 'Decouvrez ce bien sur Bee Immobilier',
        url: shareUrl
      });
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    const shareButton = detailContainer.querySelector('[data-share-property]');
    if (!shareButton) return;

    const originalText = shareButton.textContent;
    shareButton.textContent = 'Lien copie';
    window.setTimeout(() => {
      shareButton.textContent = originalText;
    }, 1600);
  } catch (error) {
    window.prompt('Copiez le lien de ce bien', shareUrl);
  }
};

const safePdfText = (value) =>
  String(value || '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .trim();

const getPdfFileName = (property) => {
  const reference = property.reference || 'bien';
  const title = String(property.title || 'immobilier')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 44);

  return `brochure-${reference}-${title || 'bee-immobilier'}.pdf`;
};

const loadWatermarkLogo = (() => {
  let promise = null;
  return () => {
    if (!promise) {
      promise = new Promise((resolve) => {
        const logo = new Image();
        logo.onload = () => resolve(logo);
        logo.onerror = () => resolve(null);
        logo.src = window.BeeImages?.logoSrc || '/assets/bee-logo-transparent.png';
      });
    }
    return promise;
  };
})();

const getImageData = (imageUrl) =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);

      const logo = await loadWatermarkLogo();
      if (logo) {
        const logoWidth = canvas.width * 0.18;
        const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth);
        const margin = canvas.width * 0.04;
        context.globalAlpha = 0.58;
        context.drawImage(
          logo,
          canvas.width - logoWidth - margin,
          canvas.height - logoHeight - margin,
          logoWidth,
          logoHeight
        );
        context.globalAlpha = 1;
      }

      resolve({
        dataUrl: canvas.toDataURL('image/jpeg', 0.88),
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };
    image.onerror = () => resolve(null);
    image.src = imageUrl;
  });

const drawWrappedText = (doc, text, x, y, maxWidth, lineHeight, options = {}) => {
  const lines = doc.splitTextToSize(safePdfText(text), maxWidth);
  const maxLines = options.maxLines || lines.length;
  const visibleLines = lines.slice(0, maxLines);

  doc.text(visibleLines, x, y);
  return y + visibleLines.length * lineHeight;
};

const ensurePdfSpace = (doc, y, neededHeight, margin) => {
  if (y + neededHeight <= 287) {
    return y;
  }

  doc.addPage();
  return margin;
};

const addPdfImage = (doc, imageData, x, y, maxWidth, maxHeight) => {
  if (!imageData) return y;

  const ratio = Math.min(maxWidth / imageData.width, maxHeight / imageData.height);
  const width = imageData.width * ratio;
  const height = imageData.height * ratio;
  const centeredX = x + (maxWidth - width) / 2;

  doc.addImage(imageData.dataUrl, 'JPEG', centeredX, y, width, height);
  return y + height;
};

const addPdfImageCover = (doc, imageData, x, y, width, height) => {
  if (!imageData) return;

  const ratio = Math.min(width / imageData.width, height / imageData.height);
  const drawWidth = imageData.width * ratio;
  const drawHeight = imageData.height * ratio;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  doc.setFillColor(248, 245, 238);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
  doc.addImage(imageData.dataUrl, 'JPEG', drawX, drawY, drawWidth, drawHeight);
};

const downloadPropertyBrochure = async () => {
  if (!currentProperty) return;

  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    window.alert('Le generateur PDF est en cours de chargement. Reessayez dans quelques secondes.');
    return;
  }

  const downloadButton = detailContainer.querySelector('[data-download-brochure]');
  const originalText = downloadButton?.textContent;
  if (downloadButton) {
    downloadButton.disabled = true;
    downloadButton.textContent = 'Preparation...';
  }

  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const margin = 14;
    const pageWidth = 210;
    const contentWidth = pageWidth - margin * 2;
    const images = getCurrentImages();
    const pdfImages = (await Promise.all(images.map((imageUrl) => getImageData(displayImageUrl(imageUrl))))).filter(Boolean);
    const mainImage = pdfImages[0];
    const detailRows = [
      ['Reference', currentProperty.reference || '-'],
      ['Transaction', transactionLabels[currentProperty.transactionType] || currentProperty.transactionType],
      ['Type de bien', propertyTypeLabels[currentProperty.propertyType] || currentProperty.propertyType],
      ['Prix', formatPropertyPrice(currentProperty)],
      ['Localisation', `${currentProperty.city}, ${currentProperty.district}`],
      ['Adresse', currentProperty.address],
      ['Surface', `${currentProperty.surface} m2`]
    ];

    if (currentProperty.propertyType !== 'land') {
      detailRows.push(
        ['Chambres', currentProperty.bedrooms || 0],
        ['Salles de bain', currentProperty.bathrooms || 0],
        ['Garages', currentProperty.garages || 0],
        ['Abris voiture', currentProperty.abris || 0]
      );
    }

    doc.setFillColor(23, 21, 17);
    doc.rect(0, 0, pageWidth, 46, 'F');
    doc.setTextColor(213, 168, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Bee Immobilier', margin, 18);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Brochure immobiliere', margin, 26);
    doc.setTextColor(213, 168, 61);
    doc.setFontSize(11);
    doc.text(currentProperty.reference ? `REF ${currentProperty.reference}` : 'REF -', pageWidth - margin, 18, { align: 'right' });

    let y = 56;
    doc.setTextColor(23, 21, 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    y = drawWrappedText(doc, currentProperty.title, margin, y, contentWidth, 8, { maxLines: 3 }) + 2;

    doc.setFontSize(17);
    doc.setTextColor(165, 121, 22);
    doc.text(safePdfText(formatPropertyPrice(currentProperty)), margin, y + 5);
    y += 17;

    if (mainImage) {
      addPdfImageCover(doc, mainImage, margin, y, contentWidth, 98);
      y += 106;
    }

    const coverGalleryImages = pdfImages.slice(1, 3);
    if (coverGalleryImages.length) {
      const gap = 4;
      const thumbWidth = (contentWidth - gap) / 2;
      const thumbHeight = 50;

      coverGalleryImages.forEach((imageData, index) => {
        addPdfImageCover(
          doc,
          imageData,
          margin + index * (thumbWidth + gap),
          y,
          thumbWidth,
          thumbHeight
        );
      });
    }

    if (pdfImages.length > 3) {
      doc.addPage();
      y = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(23, 21, 17);
      doc.text('Galerie photos', margin, y);
      y += 10;

      const gap = 5;
      const photoWidth = (contentWidth - gap) / 2;
      const photoHeight = 72;

      pdfImages.slice(3).forEach((imageData, index) => {
        if (index > 0 && index % 6 === 0) {
          doc.addPage();
          y = margin;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.setTextColor(23, 21, 17);
          doc.text('Galerie photos', margin, y);
          y += 10;
        }

        const position = index % 6;
        const column = position % 2;
        const row = Math.floor(position / 2);
        const x = margin + column * (photoWidth + gap);
        const imageY = y + row * (photoHeight + 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(111, 81, 0);
        doc.text(`Photo ${index + 4}`, x, imageY);
        addPdfImageCover(doc, imageData, x, imageY + 3, photoWidth, photoHeight);
      });
    }

    doc.addPage();
    y = margin;
    doc.setDrawColor(222, 215, 202);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(12);
    detailRows.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const boxWidth = (contentWidth - 6) / 2;
      const x = margin + column * (boxWidth + 6);
      const boxY = y + row * 17;

      doc.setFillColor(251, 248, 239);
      doc.roundedRect(x, boxY, boxWidth, 13, 2, 2, 'F');
      doc.setTextColor(111, 81, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(safePdfText(label).toUpperCase(), x + 4, boxY + 4.5);
      doc.setTextColor(23, 21, 17);
      doc.setFontSize(9);
      doc.text(safePdfText(value), x + 4, boxY + 9.8, { maxWidth: boxWidth - 8 });
    });

    y += Math.ceil(detailRows.length / 2) * 17 + 8;
    y = ensurePdfSpace(doc, y, 54, margin);

    doc.setTextColor(23, 21, 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Description', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(92, 84, 73);

    splitLongDescription(currentProperty.description).forEach((paragraph) => {
      y = ensurePdfSpace(doc, y, 28, margin);
      y = drawWrappedText(doc, paragraph, margin, y, contentWidth, 5.5) + 5;
    });

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 112, 96);
      doc.text('Bee Immobilier - Avenue Abu Dhabi, Hammamet - +21653762500', margin, 291);
      doc.text(`${page}/${pageCount}`, pageWidth - margin, 291, { align: 'right' });
    }

    doc.save(getPdfFileName(currentProperty));
  } catch (error) {
    window.alert('Impossible de generer le PDF pour le moment.');
  } finally {
    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.textContent = originalText;
    }
  }
};

const renderDetail = (property) => {
  // Support both new 'images' array and old 'image' field
  const images = Array.isArray(property.images)
    ? property.images.filter(img => img && typeof img === 'string')
    : (property.image && typeof property.image === 'string' ? [property.image] : []);
  const isLand = property.propertyType === 'land';
  const mainImage = images[0]
    ? `
      <div class="detail-carousel">
        <button class="detail-main-button" type="button" data-photo-open="0" aria-label="Agrandir la photo principale">
          <img class="detail-main-image" src="${displayImageUrl(images[0])}" alt="${property.title} - photo 1" />
        </button>
        ${
          images.length > 1
            ? `
              <button class="detail-carousel-arrow detail-carousel-prev" type="button" data-photo-prev aria-label="Photo precedente">&lsaquo;</button>
              <button class="detail-carousel-arrow detail-carousel-next" type="button" data-photo-next aria-label="Photo suivante">&rsaquo;</button>
              <span class="detail-photo-count">1 / ${images.length}</span>
            `
            : ''
        }
      </div>
    `
    : '<div class="detail-placeholder">Bee Immobilier</div>';

  detailContainer.innerHTML = `
    <div class="detail-gallery">
      ${mainImage}
      <div class="agent-contact-card agent-top">
        <div class="agent-flip" aria-label="Conseillere Bee Immobilier">
          <img class="agent-contact-photo agent-flip-front" src="/assets/bee-agent.png" alt="Conseillere Bee Immobilier" />
          <img class="agent-contact-photo agent-flip-back" src="/assets/bee-solution-consulting-logo.jpg" alt="" />
        </div>
        <div class="agent-contact-content">
          <span>Votre agent immobilier</span>
          <h2>Mariem Sellami</h2>
          <p>Un conseiller vous accompagne pour les visites, les informations du bien et les prochaines etapes.</p>
          <div class="agent-contact-links">
            <a href="tel:+21653762500">+21653762500</a>
            <a href="mailto:direction@beeimmobilier.com">direction@beeimmobilier.com</a>
          </div>
        </div>
      </div>

      <div class="detail-description">
        <h2>Description</h2>
        <div class="formatted-description">${renderFormattedDescription(property.description)}</div>
      </div>
    </div>

    <aside class="detail-side">
      <div class="detail-info">
      <div class="detail-actions">
        <button class="detail-share-button" type="button" data-share-property>Partager</button>
        <button class="detail-download-button" type="button" data-download-brochure>Telecharger la brochure PDF</button>
      </div>
      <div class="listing-topline">
        <span>${transactionLabels[property.transactionType] || property.transactionType}</span>
        ${
          property.transactionType === 'rent'
            ? `<span>${rentalTypeLabels[property.rentalType] || rentalTypeLabels.standard}</span>`
            : ''
        }
        <span>${propertyTypeLabels[property.propertyType] || property.propertyType}</span>
      </div>

      <h1>${property.title}</h1>
      ${property.reference ? `<p class="property-reference detail-reference">REF ${property.reference}</p>` : ''}
      <p class="listing-location">${property.city}, ${property.district} - ${property.address}</p>
      <strong class="detail-price">${formatPropertyPrice(property)}</strong>

      <div class="detail-meta">
        <span title="Superficie">${icon('surface')}<strong>${property.surface} m2</strong></span>
        ${
          isLand
            ? ''
            : `
              <span title="Chambres">${icon('bed')}<strong>${property.bedrooms}</strong></span>
              <span title="Salles de bain">${icon('bath')}<strong>${property.bathrooms}</strong></span>
              <span title="Garages">${icon('garage')}<strong>${property.garages || 0}</strong></span>
              <span title="Abris voiture">${icon('abri')}<strong>${property.abris || 0}</strong></span>
            `
        }
      </div>

      ${
        Array.isArray(property.features) && property.features.length > 0
          ? `
            <div class="detail-features">
              <h2>Equipements &amp; prestations</h2>
              <div class="detail-features-list">
                ${property.features
                  .map((f) => `<span class="feature-tag">${featureIcon(f)}<span>${escapeHtml(f)}</span></span>`)
                  .join('')}
              </div>
            </div>
          `
          : ''
      }

      </div>

      <div class="detail-contact-slot" id="detailContactSlot"></div>
    </aside>
  `;

  // Move the visit form (with its listeners intact) into the sticky sidebar
  const contactSection = document.getElementById('contact');
  const contactSlot = document.getElementById('detailContactSlot');
  if (contactSection && contactSlot) {
    contactSlot.appendChild(contactSection);
  }

  // Prefill the WhatsApp link with the property reference and link
  const whatsappLink = document.getElementById('visitWhatsapp');
  if (whatsappLink) {
    const message = `Bonjour, je suis interesse par votre annonce "${property.title}"${property.reference ? ` (REF ${property.reference})` : ''} : ${window.location.href}`;
    whatsappLink.href = `https://wa.me/21653762500?text=${encodeURIComponent(message)}`;
  }

  window.BeeImages?.applyWatermarks?.('.detail-carousel');
};

const loadProperty = async () => {
  try {
    const response = await fetch(`${API_URL}/${getPropertyId()}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Annonce introuvable');
    }

    currentProperty = result.data;
    document.title = `Bee Immobilier - ${currentProperty.title}`;
    renderDetail(currentProperty);
    startDetailCarousel();
    window.BeePixel?.trackViewContent(currentProperty);
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
    setVisitMessage('Demande envoyee. Bee Immobilier vous contactera bientot.');
    window.BeePixel?.trackLead({
      content_name: currentProperty.title,
      content_category: currentProperty.propertyType,
      content_ids: [currentProperty.id || currentProperty._id || currentProperty.reference || 'property'],
      value: Number(currentProperty.price) || 0,
      currency: 'TND'
    });
  } catch (error) {
    setVisitMessage(error.message, true);
  }
};

visitForm.addEventListener('submit', submitVisitRequest);
detailContainer.addEventListener('click', (event) => {
  const openButton = event.target.closest('[data-photo-open]');
  const prevButton = event.target.closest('[data-photo-prev]');
  const nextButton = event.target.closest('[data-photo-next]');
  const shareButton = event.target.closest('[data-share-property]');
  const downloadButton = event.target.closest('[data-download-brochure]');

  if (openButton) {
    openLightbox(currentPhotoIndex);
    return;
  }

  if (prevButton) {
    movePhoto(-1);
    return;
  }

  if (nextButton) {
    movePhoto(1);
    return;
  }

  if (shareButton) {
    shareProperty();
    return;
  }

  if (downloadButton) {
    downloadPropertyBrochure();
  }
});

photoLightboxClose.addEventListener('click', closeLightbox);
photoLightboxPrev.addEventListener('click', () => movePhoto(-1));
photoLightboxNext.addEventListener('click', () => movePhoto(1));
photoLightbox.addEventListener('click', (event) => {
  if (event.target === photoLightbox) {
    closeLightbox();
  }
});

document.addEventListener('keydown', (event) => {
  if (photoLightbox.classList.contains('hidden')) return;

  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') movePhoto(-1);
  if (event.key === 'ArrowRight') movePhoto(1);
});

loadProperty();

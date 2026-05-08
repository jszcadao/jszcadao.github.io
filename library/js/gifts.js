let activeFilters = {
  rarity: new Set(),
  statusType: new Set(),
  buffType: new Set()
};

let hidePopupTimer = null;

/* Initialization of the gift data, filter buttons, and gift grid */
async function init() {
  await loadData();
  renderFilterButtons();
  renderGiftGrid();
  initPopupHoverBridge();
}

/* Obtains the gift rarity, converting rarity '6' to 'EX' */
function getRarityDisplay(rarity) {
  if (rarity === 6 || rarity === 'EX') return 'EX';
  return `Tier ${rarity}`;
}

/* Source of the status type icons */
function getStatusIconPath(statusType) {
  return `../html/assets/icons/keywords/${statusType.toLowerCase()}.png`;
}

/* Rendering of the filter buttons */
function renderFilterButtons() {

  /* Render rarity filter buttons */
  const rarities = getRarities();
  const rarityContainer = document.getElementById('rarityFilterButtons');
  rarities.forEach(rarity => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = getRarityDisplay(rarity);
    btn.dataset.value = rarity;
    btn.addEventListener('click', () => toggleFilter('rarity', rarity));
    rarityContainer.appendChild(btn);
  });

  /* Render status type buttons with icons */
  const statusTypes = getStatusTypes();
  const statusContainer = document.getElementById('statusFilterButtons');
  statusTypes.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.value = type;

    const icon = document.createElement('img');
    icon.src = getStatusIconPath(type);
    icon.alt = type;
    icon.className = 'filter-btn-icon';
    icon.onerror = () => { icon.style.display = 'none'; };

    const label = document.createElement('span');
    label.textContent = type;
    const colorClass = getKeywordClass(type);
    if (colorClass) label.classList.add(colorClass);

    btn.appendChild(icon);
    btn.appendChild(label);
    btn.addEventListener('click', () => toggleFilter('statusType', type));
    statusContainer.appendChild(btn);
  });

  /* Render effect type filter buttons */
  const buffTypes = getBuffTypes();
  const buffContainer = document.getElementById('buffFilterButtons');
  buffTypes.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.value = type;
    btn.innerHTML = colorizeKeywords(type);
    btn.addEventListener('click', () => toggleFilter('buffType', type));
    buffContainer.appendChild(btn);
  });
}

/* Filter toggle that allows the user to select multiple filters at once */
function toggleFilter(filterType, value) {
  const filterSet = activeFilters[filterType];
  if (filterSet.has(value)) {
    filterSet.delete(value);
  } else {
    filterSet.add(value);
  }
  updateFilterButtonStates(filterType);
  renderGiftGrid();
}

function updateFilterButtonStates(filterType) {
  const containerIds = {
    rarity: 'rarityFilterButtons',
    statusType: 'statusFilterButtons',
    buffType: 'buffFilterButtons'
  };
  const container = document.getElementById(containerIds[filterType]);
  if (!container) return;

  const filterSet = activeFilters[filterType];
  container.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = filterSet.has(btn.dataset.value) ||
                     filterSet.has(Number(btn.dataset.value));
    btn.classList.toggle('filter-btn--active', isActive);
  });
}

/* Loading data of gifts according to the active filters */
function filterGifts() {
  return giftsData.filter(gift => {
    if (activeFilters.rarity.size > 0 && !activeFilters.rarity.has(gift.rarity)) return false;
    if (activeFilters.statusType.size > 0) {
      if (!gift.statusTypes.some(t => activeFilters.statusType.has(t))) return false;
    }
    if (activeFilters.buffType.size > 0) {
      if (!gift.buffTypes.some(t => activeFilters.buffType.has(t))) return false;
    }
    return true;
  });
}

/* Rendering of the gift grid container */
function renderGiftGrid() {
  const grid = document.getElementById('giftGrid');
  grid.innerHTML = '';
  const filtered = filterGifts();
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-results">No gifts match the selected filters.</p>';
    return;
  }
  filtered.forEach(gift => grid.appendChild(createGiftCard(gift)));
}

/* Creating and displaying of the gift card to be placed inside the gift grid */
function createGiftCard(gift) {
  const card = document.createElement('div');
  card.className = 'gift-card';
  card.dataset.giftId = gift.id;

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'gift-card-image-wrapper';

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.src = gift.icon;
  img.alt = gift.name;
  img.className = 'gift-card-image';
  img.onerror = function () {
    this.style.display = 'none';
    const ph = document.createElement('div');
    ph.className = 'placeholder-img';
    ph.style.backgroundColor = getRarityColor(gift.rarity);
    imageWrapper.insertBefore(ph, this);
  };
  imageWrapper.appendChild(img);

  if (gift.statusTypes.length > 0) {
    const statusIcon = document.createElement('img');
    statusIcon.src = getStatusIconPath(gift.statusTypes[0]);
    statusIcon.alt = gift.statusTypes[0];
    statusIcon.className = 'gift-card-status-icon';
    statusIcon.onerror = () => { statusIcon.style.display = 'none'; };
    imageWrapper.appendChild(statusIcon);
  }

  const name = document.createElement('p');
  name.className = 'gift-card-name';
  name.textContent = gift.name;

  card.appendChild(imageWrapper);
  card.appendChild(name);

  card.addEventListener('mouseenter', (e) => { cancelHidePopup(); showGiftPopup(gift, e); });
  card.addEventListener('mouseleave', scheduleHidePopup);

  return card;
}

/* Placeholder base colors in case of error in loading the gift image */
function getRarityColor(rarity) {
  const colors = { 1: '#4a4a4a', 2: '#5a6a4a', 3: '#5a5a6a', 4: '#6a5a6a', 5: '#6a5a5a', 6: '#6a6a5a' };
  return colors[rarity] || '#4a4a4a';
}

/* Pop up box upon hovering over a gift while also keeping the pop up active if cursor hovers over it */
function initPopupHoverBridge() {
  const popup = document.getElementById('giftPopup');
  popup.addEventListener('mouseenter', cancelHidePopup);
  popup.addEventListener('mouseleave', scheduleHidePopup);
}

function scheduleHidePopup() {
  hidePopupTimer = setTimeout(() => {
    document.getElementById('giftPopup').hidden = true;
  }, 80);
}

function cancelHidePopup() {
  if (hidePopupTimer !== null) {
    clearTimeout(hidePopupTimer);
    hidePopupTimer = null;
  }
}

/* Pop up box upon hovering over the gift, displaying their relevant information */
function showGiftPopup(gift, event) {
  const popup = document.getElementById('giftPopup');
  document.getElementById('popupGiftName').textContent = gift.name;
  document.getElementById('popupGiftRarity').textContent = getRarityDisplay(gift.rarity);
  const statusDiv = document.getElementById('popupGiftStatus');
  statusDiv.innerHTML = gift.statusTypes.length > 0
    ? `<strong>Status:</strong> ${gift.statusTypes.map(t => colorizeKeywords(t)).join(', ')}` : '';
  const buffDiv = document.getElementById('popupGiftBuffs');
  buffDiv.innerHTML = gift.buffTypes.length > 0
    ? `<strong>Effects:</strong> ${gift.buffTypes.map(t => colorizeKeywords(t)).join(', ')}` : '';
  const recipeDiv = document.getElementById('popupGiftRecipe');
  recipeDiv.innerHTML = '';

  /* For fusion gifts */
  if (gift.fusionIngredients && gift.fusionIngredients.length > 0) {
    const label = document.createElement('p');
    label.className = 'gift-popup-recipe-label';
    label.textContent = 'Fusion Recipe:';
    recipeDiv.appendChild(label);

    const row = document.createElement('div');
    row.className = 'popup-fusion-row';

    gift.fusionIngredients.forEach((id, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'popup-fusion-separator';
        sep.textContent = '+';
        row.appendChild(sep);
      }
      row.appendChild(buildFusionGiftCard(getGiftById(id)));
    });

    const arrow = document.createElement('span');
    arrow.className = 'popup-fusion-separator';
    arrow.textContent = '→';
    row.appendChild(arrow);
    row.appendChild(buildFusionGiftCard(gift));
    recipeDiv.appendChild(row);

    /* For fusion recipe gifts */
  } else if (gift.fusionResult && gift.fusionResult.length > 0) {
    const label = document.createElement('p');
    label.className = 'gift-popup-recipe-label';
    label.textContent = 'Used in:';
    recipeDiv.appendChild(label);

    gift.fusionResult.forEach(resultId => {
      const resultGift = getGiftById(resultId);
      if (!resultGift) return;

      /* Display other required gifts in relation to the current fusion recipe */
      const row = document.createElement('div');
      row.className = 'popup-fusion-row';

      if (resultGift.fusionIngredients) {
        resultGift.fusionIngredients.forEach((ingId, i) => {
          if (i > 0) {
            const sep = document.createElement('span');
            sep.className = 'popup-fusion-separator';
            sep.textContent = '+';
            row.appendChild(sep);
          }
          row.appendChild(buildFusionGiftCard(getGiftById(ingId)));
        });
      }

      const arrow = document.createElement('span');
      arrow.className = 'popup-fusion-separator';
      arrow.textContent = '→';
      row.appendChild(arrow);
      row.appendChild(buildFusionGiftCard(resultGift));
      recipeDiv.appendChild(row);
    });
  }

  /* Notice for exclusive gifts */
  const packDiv = document.getElementById('popupGiftPack');
  if (gift.packExclusive && gift.packExclusive.length > 0) {
    const packs = gift.packExclusive.map(id => getPackById(id)?.name || id).join(', ');
    packDiv.innerHTML = `<strong>Exclusive to:</strong><br>${packs}`;
  } else {
    packDiv.innerHTML = '';
  }

  const descDiv = document.getElementById('popupGiftDescription');
  if (descDiv) {
    const description = getGiftDescription(gift.name);
    if (description) {
      descDiv.innerHTML = colorizeKeywords(description.replace(/\n/g, '<br>'));
      descDiv.hidden = false;
    } else {
      descDiv.innerHTML = '';
      descDiv.hidden = true;
    }
  }

  /* Pop up positioning with boundary logic */
  const offsetX = 12;
  const offsetY = 12;
  let left = event.clientX + offsetX;
  let top = event.clientY + offsetY;

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.hidden = false;

  const rect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  /* Adjust if overflowing right */
  if (rect.right > viewportWidth) {
    left = event.clientX - rect.width - offsetX;
  }
  /* Adjust if overflowing left */
  if (left < 0) {
    left = offsetX;
  }
  /* Adjust if overflowing bottom */
  if (rect.bottom > viewportHeight) {
    top = event.clientY - rect.height - offsetY;
  }
  /* Adjust if overflowing top */
  if (top < 0) {
    top = offsetY;
  }

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
}

/* Creates a mini version of the gift for fusion recipes */
function buildFusionGiftCard(gift) {
  if (!gift) return document.createTextNode('?');

  const card = document.createElement('div');
  card.className = 'popup-fusion-gift';

  const img = document.createElement('img');
  img.src = gift.icon || '';
  img.alt = gift.name;
  img.className = 'popup-fusion-gift-img';
  img.loading = 'lazy';
  img.onerror = () => {
    const ph = document.createElement('div');
    ph.className = 'placeholder-img';
    ph.style.backgroundColor = getRarityColor(gift.rarity);
    img.replaceWith(ph);
  };

  const name = document.createElement('p');
  name.className = 'popup-fusion-gift-name';
  name.textContent = gift.name;

  card.appendChild(img);
  card.appendChild(name);
  return card;
}

document.addEventListener('DOMContentLoaded', init);
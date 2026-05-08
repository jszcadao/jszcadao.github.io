let activeFilters = {
  statusType: new Set()
};
let activePackCard = null;
let hidePopupTimer = null;

/* Initialization of the planner data, filter buttons, and the theme pack grid */
async function init() {
  await loadData();
  renderStatusFilterButtons();
  renderPackGrid();
  initPopupHoverBridge();
}

/* Renders the filter buttons for the status types (multi‑select toggle) */
function renderStatusFilterButtons() {
  const container = document.getElementById('statusFilterButtons');
  const statusTypes = getStatusTypes();

  statusTypes.forEach(type => {
    const btn = createStatusFilterButton(type);
    container.appendChild(btn);
  });
}

/* Creates and inserts the filter buttons along with the status type icons */
function createStatusFilterButton(type) {
  const btn = document.createElement('button');
  btn.className = 'filter-btn';
  btn.dataset.value = type;

  const icon = document.createElement('img');
  icon.src = `../html/assets/icons/keywords/${type.toLowerCase()}.png`;
  icon.alt = type;
  icon.className = 'filter-btn-icon';
  icon.onerror = () => { icon.style.display = 'none'; };

  const label = document.createElement('span');
  label.textContent = type;
  const colorClass = getKeywordClass(type);
  if (colorClass) label.classList.add(colorClass);

  btn.appendChild(icon);
  btn.appendChild(label);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFilter(type, btn);
  });
  return btn;
}

/* Toggle filter on/off (multi‑select) */
function toggleFilter(type, btn) {
  if (activeFilters.statusType.has(type)) {
    activeFilters.statusType.delete(type);
    btn.classList.remove('filter-btn--active');
  } else {
    activeFilters.statusType.add(type);
    btn.classList.add('filter-btn--active');
  }
  renderPackGrid();

  if (activePackCard) {
    const packId = activePackCard.dataset.packId;
    const pack = getPackById(packId);
    if (pack) populateRightPanel(pack);
  }
}

/* Loads the data of theme packs according to the filters (any matching status) */
function getFilteredPacks() {
  if (activeFilters.statusType.size === 0) return packsData;

  return packsData.filter(pack => {
    if (pack.exclusiveGifts.length === 0) return false;
    return pack.exclusiveGifts.some(giftId => {
      const gift = getGiftById(giftId);
      return gift && gift.statusTypes.some(s => activeFilters.statusType.has(s));
    });
  });
}

/* Renders the theme pack grid */
function renderPackGrid() {
  const grid = document.getElementById('packGrid');
  grid.innerHTML = '';

  const packs = getFilteredPacks();

  if (packs.length === 0) {
    grid.innerHTML = '<p class="no-content">No packs found for the selected status types.</p>';
    return;
  }

  packs.forEach(pack => {
    const card = createPackCard(pack);
    grid.appendChild(card);
  });
}

/* Creates the theme pack card to be placed inside the pack grid */
function createPackCard(pack) {
  const card = document.createElement('div');
  card.className = 'pack-card';
  card.dataset.packId = pack.id;

  const img = document.createElement('img');
  img.className = 'pack-card-image';
  img.src = pack.image;
  img.alt = `${pack.name} theme pack`;
  img.loading = 'lazy';

  img.onerror = () => {
    const fallback = document.createElement('div');
    fallback.className = 'placeholder-img placeholder-img--rect';
    img.replaceWith(fallback);
  };

  card.appendChild(img);

  card.addEventListener('click', () => {
    if (activePackCard) {
      activePackCard.classList.remove('pack-card--active');
    }
    card.classList.add('pack-card--active');
    activePackCard = card;
    populateRightPanel(pack);
  });

  return card;
}

/* Displays the information of the chosen pack from the grid on the right panel */
function populateRightPanel(pack) {
  document.getElementById('plannerRightDefault').hidden = true;
  document.getElementById('plannerRightDetail').hidden = false;

  document.getElementById('detailPackName').textContent = pack.name;
  
  /* Display of the pack's floor availabilty */
  const floorsContainer = document.getElementById('detailPackFloors');
  floorsContainer.innerHTML = '';
  pack.floors.forEach(floor => {
    const badge = document.createElement('span');
    badge.className = 'floor-badge';
    if (floor === 5 || floor === 11) badge.classList.add('floor-badge--special');
    if (floor === 5) badge.textContent = 'Floor 5 (eligible for 6-10)';
    else if (floor === 11) badge.textContent = 'Floors 11-15';
    else badge.textContent = `Floor ${floor}`;
    floorsContainer.appendChild(badge);
  });

  /* Display of the encounterable bosses in the pack */
  const bossContainer = document.getElementById('detailPackBoss');
  bossContainer.innerHTML = '';
  const bossLabel = document.createElement('p');
  bossLabel.className = 'boss-label';
  bossLabel.textContent = pack.boss.length > 1 ? 'Bosses:' : 'Boss:';
  bossContainer.appendChild(bossLabel);
  pack.boss.forEach(bossName => {
    const span = document.createElement('span');
    span.className = 'boss-name';
    span.textContent = bossName;
    bossContainer.appendChild(span);
  });

  renderExclusiveGifts(pack);
}

/* Displays any exclusive gifts of the pack */
function renderExclusiveGifts(pack) {
  const container = document.getElementById('detailExclusiveGifts');
  container.innerHTML = '';

  if (pack.exclusiveGifts.length === 0) {
    container.innerHTML = '<p class="no-content">No exclusive gifts available.</p>';
    return;
  }

  pack.exclusiveGifts.forEach(giftId => {
    const gift = getGiftById(giftId);
    if (!gift) return;
    const card = createGiftCard(gift);
    container.appendChild(card);
  });
}

/* Creates the gift card where the exclusive gifts are to be placed */
function createGiftCard(gift) {
  const card = document.createElement('div');
  card.className = 'gift-card';
  card.dataset.giftId = gift.id;

  const img = document.createElement('img');
  img.className = 'gift-card-image';
  img.src = gift.icon || '';
  img.alt = `${gift.name} icon`;
  img.loading = 'lazy';

  img.onerror = () => {
    const fallback = document.createElement('div');
    fallback.className = 'placeholder-img';
    fallback.style.backgroundColor = getRarityColor(gift.rarity);
    img.replaceWith(fallback);
  };

  const name = document.createElement('p');
  name.className = 'gift-card-name';
  name.innerHTML = colorizeKeywords(gift.name);

  const rarity = document.createElement('p');
  rarity.className = 'gift-card-rarity';
  rarity.textContent = gift.rarity === 'EX' ? 'EX' : `Tier ${gift.rarity}`;

  card.appendChild(img);
  card.appendChild(name);
  card.appendChild(rarity);

  card.addEventListener('mouseenter', (e) => { cancelHidePopup(); showGiftPopup(gift, e); });
  card.addEventListener('mouseleave', scheduleHidePopup);

  return card;
}

/* Placeholder base colors in case of error on loading the image */
function getRarityColor(rarity) {
  const colors = {
    1: '#4a4a4a',
    2: '#4a5a4a',
    3: '#4a4a6a',
    4: '#6a4a6a',
    5: '#6a4a4a',
    'EX': '#6a6a4a'
  };
  return colors[rarity] || '#4a4a4a';
}

/* Pop up box event handling */
function initPopupHoverBridge() {
  const popup = document.getElementById('giftPopup');
  if (!popup) return;
  popup.addEventListener('mouseenter', cancelHidePopup);
  popup.addEventListener('mouseleave', scheduleHidePopup);
}

function scheduleHidePopup() {
  hidePopupTimer = setTimeout(() => {
    const popup = document.getElementById('giftPopup');
    if (popup) popup.hidden = true;
  }, 80);
}

function cancelHidePopup() {
  if (hidePopupTimer !== null) {
    clearTimeout(hidePopupTimer);
    hidePopupTimer = null;
  }
}

/* Pop up box upon hovering on a gift */
function showGiftPopup(gift, event) {
  const popup = document.getElementById('giftPopup');
  if (!popup) return;

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

  /* Display for fusion related gifts */
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
  } else if (gift.fusionResult && gift.fusionResult.length > 0) {
    const label = document.createElement('p');
    label.className = 'gift-popup-recipe-label';
    label.textContent = 'Used in:';
    recipeDiv.appendChild(label);

    gift.fusionResult.forEach(resultId => {
      const resultGift = getGiftById(resultId);
      if (!resultGift) return;

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

  // Position popup with boundary detection
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

  // Adjust if overflowing right
  if (rect.right > viewportWidth) {
    left = event.clientX - rect.width - offsetX;
  }
  // Adjust if overflowing left
  if (left < 0) {
    left = offsetX;
  }
  // Adjust if overflowing bottom
  if (rect.bottom > viewportHeight) {
    top = event.clientY - rect.height - offsetY;
  }
  // Adjust if overflowing top
  if (top < 0) {
    top = offsetY;
  }

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
}

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

function getRarityDisplay(rarity) {
  if (rarity === 6 || rarity === 'EX') return 'EX';
  return `Tier ${rarity}`;
}

document.addEventListener('DOMContentLoaded', init);
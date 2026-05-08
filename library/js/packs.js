let activeFloorFilter = null;
let hidePopupTimer = null;

/* Initialization of the theme pack data, filter buttons, and the theme pack grid */
async function init() {
  await loadData();
  renderFloorFilterButtons();
  renderPackGrid();
  initPopupHoverBridge();
}

/* Creates the filter buttons and its functionality */
function renderFloorFilterButtons() {
  const filterBar = document.getElementById('filterBar');
  if (!filterBar) return;

  filterBar.innerHTML = `
    <h2 class="filter-bar-title">Filter by Floor</h2>
    <div class="filter-bar-buttons" id="floorFilterButtons"></div>
  `;

  const buttonContainer = document.getElementById('floorFilterButtons');

  /* 'All Floors' button */
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn filter-btn--active';
  allBtn.textContent = 'All Floors';
  allBtn.addEventListener('click', () => {
    setFloorFilter(null, allBtn, buttonContainer);
  });
  buttonContainer.appendChild(allBtn);

  /* Individual floor buttons for floor 1 through floor 5 */
  for (let floor = 1; floor <= 5; floor++) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = `Floor ${floor}`;
    btn.dataset.floor = floor;
    btn.addEventListener('click', () => {
      setFloorFilter(floor, btn, buttonContainer);
    });
    buttonContainer.appendChild(btn);
  }

  /* Group buttons for floors 6-10 and floors 11-15 */
  const groupRanges = [
    { label: 'Floors 6-10', value: '6-10' },
    { label: 'Floors 11-15', value: '11-15' }
  ];
  groupRanges.forEach(range => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = range.label;
    btn.dataset.value = range.value;
    btn.addEventListener('click', () => {
      setFloorFilter(range.value, btn, buttonContainer);
    });
    buttonContainer.appendChild(btn);
  });
}

/* Updates the filter visuals depending on what filter being activated */
function setFloorFilter(value, clickedBtn, container) {
  container.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.remove('filter-btn--active')
  );
  clickedBtn.classList.add('filter-btn--active');
  activeFloorFilter = value;
  renderPackGrid();
}

/* Updates the data being processed according to the filters */
function filterPacks() {
  if (!activeFloorFilter) return packsData;

  return packsData.filter(pack => {
    if (typeof activeFloorFilter === 'number') {
      return pack.floors.includes(activeFloorFilter);
    } else if (activeFloorFilter === '6-10') {
      return pack.floors.includes(5);
    } else if (activeFloorFilter === '11-15') {
      return pack.floors.includes(11);
    }
    return true;
  });
}

/* Rendering the grid for the pack cards */
function renderPackGrid() {
  const grid = document.getElementById('packGrid');
  grid.innerHTML = '';

  const filteredPacks = filterPacks();

  if (filteredPacks.length === 0) {
    grid.innerHTML = '<p class="no-results">No packs match the selected filter.</p>';
    return;
  }

  filteredPacks.forEach(pack => {
    const card = createPackCard(pack);
    grid.appendChild(card);
  });
}

/* Creates the theme pack card */
function createPackCard(pack) {
  const card = document.createElement('div');
  card.className = 'pack-card';
  card.dataset.packId = pack.id;

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.src = pack.image;
  img.alt = pack.name;
  img.className = 'pack-card-image';
  img.onerror = () => {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-img';
    placeholder.style.backgroundColor = getFloorColor(pack.floors);
    img.parentNode.replaceChild(placeholder, img);
  };

  card.appendChild(img);

  card.addEventListener('mouseenter', (e) => { cancelHidePopup(); showPackPopup(pack, e); });
  card.addEventListener('mouseleave', scheduleHidePopup);

  return card;
}

/* Function for the placeholder base color in case of errors */
function getFloorColor(floors) {
  const minFloor = Math.min(...floors);
  const colors = {
    1: '#4a5a4a', 2: '#4a4a5a', 3: '#5a4a5a',
    4: '#5a5a4a', 5: '#5a4a4a', 11: '#6a4a4a'
  };
  return colors[minFloor] || '#4a4a4a';
}

/* Pop up box initialization */
function initPopupHoverBridge() {
  const popup = document.getElementById('packPopup');
  if (!popup) return;
  popup.addEventListener('mouseenter', cancelHidePopup);
  popup.addEventListener('mouseleave', scheduleHidePopup);
}

function scheduleHidePopup() {
  hidePopupTimer = setTimeout(() => {
    const popup = document.getElementById('packPopup');
    if (popup) popup.hidden = true;
  }, 80);
}

function cancelHidePopup() {
  if (hidePopupTimer !== null) {
    clearTimeout(hidePopupTimer);
    hidePopupTimer = null;
  }
}

/* Pop up box when hovering on a pack, displaying the relevant information of that pack */
function showPackPopup(pack, event) {
  const popup = document.getElementById('packPopup');

  document.getElementById('popupPackName').textContent = pack.name;

  const bossDiv = document.getElementById('popupPackBoss');
  bossDiv.innerHTML = `<strong>${pack.boss.length > 1 ? 'Bosses' : 'Boss'}:</strong> ${pack.boss.join(', ')}`;

  const giftsDiv = document.getElementById('popupPackGifts');
  giftsDiv.innerHTML = '';

  const label = document.createElement('p');
  label.className = 'pack-popup-exclusive-label';
  label.textContent = 'Exclusive Gifts:';
  giftsDiv.appendChild(label);

  if (pack.exclusiveGifts.length === 0) {
    const noGifts = document.createElement('p');
    noGifts.className = 'pack-popup-no-gifts';
    noGifts.textContent = 'No exclusive gifts available.';
    giftsDiv.appendChild(noGifts);
  } else {
    const giftsGrid = document.createElement('div');
    giftsGrid.className = 'pack-popup-gifts-grid';

    pack.exclusiveGifts.forEach(giftId => {
      const gift = getGiftById(giftId);
      if (!gift) return;

      const giftCard = document.createElement('div');
      giftCard.className = 'popup-gift-card';

      const giftImg = document.createElement('img');
      giftImg.src = gift.icon;
      giftImg.alt = gift.name;
      giftImg.className = 'popup-gift-card-image';
      giftImg.loading = 'lazy';
      giftImg.onerror = () => {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder-img';
        placeholder.style.backgroundColor = getRarityColor(gift.rarity);
        giftImg.parentNode.replaceChild(placeholder, giftImg);
      };

      const giftName = document.createElement('p');
      giftName.className = 'popup-gift-card-name';
      giftName.innerHTML = colorizeKeywords ? colorizeKeywords(gift.name) : gift.name;

      giftCard.appendChild(giftImg);
      giftCard.appendChild(giftName);
      giftsGrid.appendChild(giftCard);
    });

    giftsDiv.appendChild(giftsGrid);
  }

  /* Position boundary logic to not overflow past the website */
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

  if (rect.right > viewportWidth) {
    left = event.clientX - rect.width - offsetX;
  }
  if (left < 0) {
    left = offsetX;
  }
  if (rect.bottom > viewportHeight) {
    top = event.clientY - rect.height - offsetY;
  }
  if (top < 0) {
    top = offsetY;
  }

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
}

function hidePackPopup() {
  cancelHidePopup();
  document.getElementById('packPopup').hidden = true;
}

function getRarityColor(rarity) {
  const colors = {
    1: '#4a4a4a', 2: '#5a6a4a', 3: '#5a5a6a',
    4: '#6a5a6a', 5: '#6a5a5a', 6: '#6a6a5a'
  };
  return colors[rarity] || '#4a4a4a';
}

document.addEventListener('DOMContentLoaded', init);
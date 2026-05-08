/* Arrays to contain the gift data, pack data, and descriptions across the entirety of the website */
let giftsData = [];
let packsData = [];
let descriptionsData = [];

/* Fixed array for the status types */
const statusTypeOrder = [
  'Bleed', 'Burn', 'Tremor', 'Rupture', 'Sinking', 'Poise', 'Charge', 'Slash', 'Pierce', 'Blunt'
];

/* Designation of colors for specific keywords */
const keywordColorMap = {
  'Wrath': 'kw-red',
  'Bleed': 'kw-red',
  'Lust': 'kw-orange',
  'Burn': 'kw-orange',
  'Sloth': 'kw-yellow',
  'Tremor': 'kw-yellow',
  'Gluttony': 'kw-green',
  'Rupture': 'kw-teal',
  'Gloom': 'kw-cyan',
  'Charge': 'kw-cyan',
  'Pride': 'kw-blue',
  'Sinking': 'kw-blue',
  'Envy': 'kw-violet',
  'Poise': 'kw-gray',
  'Slash': 'kw-brown',
  'Pierce': 'kw-brown',
  'Blunt': 'kw-brown'
};

function getKeywordClass(word) {
  return keywordColorMap[word] || null;
}

/* Wrapper for the specific keywords to be placed in a text string with <span> tags and its color*/
function colorizeKeywords(text) {
  if (!text) return text;
  const keywords = Object.keys(keywordColorMap).sort((a, b) => b.length - a.length);
  let result = text;
  keywords.forEach(kw => {
    const cls = keywordColorMap[kw];
    const regex = new RegExp(`\\b${kw}\\b`, 'g');
    result = result.replace(regex, `<span class="${cls}">${kw}</span>`);
  });
  return result;
}

/* Data loading from the .json files */
async function loadData() {
  try {
    const [giftsResponse, packsResponse, descriptionsResponse] = await Promise.all([
      fetch('../data/gifts.json'),
      fetch('../data/packs.json'),
      fetch('../data/gift_descriptions.json')
    ]);
    giftsData = await giftsResponse.json();
    packsData = await packsResponse.json();
    descriptionsData = await descriptionsResponse.json();
    console.log(`Loaded ${giftsData.length} gifts, ${packsData.length} packs, ${descriptionsData.length} descriptions`);
    return { gifts: giftsData, packs: packsData, descriptions: descriptionsData };
  } catch (error) {
    console.error('Error loading data:', error);
    return { gifts: [], packs: [], descriptions: [] };
  }
}

function getGiftById(id) {
  return giftsData.find(gift => gift.id === id);
}

function getPackById(id) {
  return packsData.find(pack => pack.id === id);
}

function getGiftDescription(name) {
  const entry = descriptionsData.find(d => d.name === name);
  return entry ? entry.description : null;
}

function getUniqueGiftValues(field) {
  const values = new Set();
  giftsData.forEach(gift => {
    if (Array.isArray(gift[field])) {
      gift[field].forEach(val => values.add(val));
    } else if (gift[field]) {
      values.add(gift[field]);
    }
  });
  return Array.from(values).sort();
}

function getStatusTypes() {
  const typesSet = new Set();
  giftsData.forEach(gift => { gift.statusTypes.forEach(type => typesSet.add(type)); });
  return Array.from(typesSet).sort((a, b) => {
    const ia = statusTypeOrder.indexOf(a);
    const ib = statusTypeOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function getBuffTypes() { return getUniqueGiftValues('buffTypes'); }
function getRarities()  { return getUniqueGiftValues('rarity'); }
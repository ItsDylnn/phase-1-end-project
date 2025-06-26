const RAWG_API = '7d8d1eb8fd5240c0a51cb37503b7d3b7';
let user = '';
const cache = {};

function debounce(func, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

async function fetchWithCache(url) {
  if (cache[url]) return cache[url];
  const res = await fetch(url);
  const data = await res.json();
  cache[url] = data;
  return data;
}

function login() {
  user = document.getElementById('username').value.trim();
  if (!user) return alert('Please enter a username.');
  document.getElementById('add-favorite').style.display = 'block';
  loadFavoritesAndRecommendations();
  loadTrending(true);
}

async function fetchGameDetails(id) {
  try {
    const url = `https://api.rawg.io/api/games/${id}?key=${RAWG_API}`;
    const data = await fetchWithCache(url);
    return data.description_raw || 'No description available.';
  } 
  catch{
    return 'No description available.';
  }
}

async function loadTrending(showIcons = false) {
  const data = await fetchWithCache(`https://api.rawg.io/api/games/lists/main?key=${RAWG_API}&ordering=-added&page_size=8`);
  const gamesWithDescriptions = await Promise.all(
    data.results.map(async (game) => {
      const description = await fetchGameDetails(game.id);
      return { ...game, description };
    })
  );
  renderTiles('trending-list', gamesWithDescriptions, false, showIcons);
}

async function loadFavoritesAndRecommendations() {
  const res = await fetch(`http://localhost:5000/api/favorites?username=${encodeURIComponent(user)}`);
  const data = await res.json();
  if (data.error) return alert(data.error);
  renderTiles('fav-list', data.favorites, true);
  const recs = await Promise.all(data.recommendations.map(async g => {
    const description = await fetchGameDetails(g.id);
    return { ...g, description };
  }));
  renderTiles('rec-list', recs);
}

async function addFavorite() {
  const game = document.getElementById('fav-game').value.trim();
  if (!game || !user) return alert('Enter a game and be logged in.');

  const res = await fetch('http://localhost:5000/api/favorites', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, game })
  });
  const data = await res.json();
  if (data.error) return alert(data.error);
  document.getElementById('fav-game').value = '';
  loadFavoritesAndRecommendations();
}

function addGameByName(gameName) {
  if (!user) return alert('Please log in first.');
  fetch('http://localhost:5000/api/favorites', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, game: gameName })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) return alert(data.error);
    loadFavoritesAndRecommendations();
  })
  .catch(() => alert('Failed to add game to favorites.'));
}

function removeFavorite(gameName) {
  if (!user) return alert('You must be logged in.');
  fetch('http://localhost:5000/api/favorites', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, game: gameName })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) return alert(data.error);
    loadFavoritesAndRecommendations();
  });
}

function renderTiles(containerId, games, isFavorite = false, showIcons = true) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  games.forEach((game, index) => {
    const tile = createTile(game, index, isFavorite, showIcons);
    container.appendChild(tile);
  });
}

function createTile(game, index, isFavorite = false, showIcons = true) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.style.animationDelay = `${index * 0.1}s`;
  const imgSrc = game.image || game.background_image || 'https://placehold.co/160x180?text=No+Image';
  const tags = (game.genres || game.tags || []).map(tag => typeof tag === 'string' ? tag : tag.name).join(', ') || 'No tags';
  const rating = game.rating ? `⭐ ${game.rating.toFixed(1)}` : '';
  const desc = game.description || 'No description available';
  const safeName = game.name.replace(/'/g, "\\'");
  const favIcon = (!isFavorite && user && showIcons)
    ? `<button class="fav-button" onclick="addGameByName('${safeName}')">♡</button>`
    : (isFavorite ? `<button onclick="removeFavorite('${safeName}')">Remove</button>` : '');

  tile.innerHTML = `
    ${favIcon}
    <img src="${imgSrc}" alt="${game.name}" loading="lazy" />
    <div class="info">
      <strong>${game.name}</strong>
      <div class="tags">${tags}</div>
      <div class="tags">${rating}</div>
    </div>
    <div class="description">${desc.slice(0, 300)}</div>
  `;
  return tile;
}

loadTrending();

let currentFocus = -1;

document.getElementById('fav-game').addEventListener('input', async function () {
  const val = this.value.trim();
  const list = document.getElementById('autocomplete-list');
  if (!val) return list.innerHTML = '';

  try {
    const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API}&search=${encodeURIComponent(val)}&page_size=5`);
    const data = await res.json();

    list.innerHTML = '';
    data.results.forEach(game => {
      const li = document.createElement('li');
      li.textContent = game.name;
      li.onclick = () => {
        document.getElementById('fav-game').value = game.name;
        list.innerHTML = '';
      };
      list.appendChild(li);
    });
  } 
  catch {
    list.innerHTML = '';
  }
});

document.getElementById('fav-game').addEventListener('keydown', function (e) {
  const list = document.getElementById('autocomplete-list');
  let items = list.getElementsByTagName('li');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    currentFocus = (currentFocus + 1) % items.length;
    addActive(items);
  } 
  else if (e.key === 'ArrowUp') {
    currentFocus = (currentFocus - 1 + items.length) % items.length;
    addActive(items);
  } 
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (currentFocus > -1) items[currentFocus].click();
  }
});

function addActive(items) {
  removeActive(items);
  if (items.length && currentFocus >= 0) items[currentFocus].classList.add('autocomplete-active');
}

function removeActive(items) {
  for (let item of items) item.classList.remove('autocomplete-active');
}

document.addEventListener('click', e => {
  if (!e.target.closest('#add-favorite')) {
    document.getElementById('autocomplete-list').innerHTML = '';
    currentFocus = -1;
  }
});


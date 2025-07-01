require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const users = {};
const gameCache = new Map(); 
const idCache = new Map();   

async function fetchGameByName(name) {
  if (gameCache.has(name)) return gameCache.get(name);

  const res = await axios.get("https://api.rawg.io/api/games", {
    params: { search: name, page_size: 1, key: process.env.RAWG_API_KEY }
  });

  const result = res.data.results?.[0];
  if (result) gameCache.set(name, result);
  return result;
}

async function fetchGameDetailsById(id) {
  if (idCache.has(id)) return idCache.get(id);

  const res = await axios.get(`https://api.rawg.io/api/games/${id}`, {
    params: { key: process.env.RAWG_API_KEY }
  });

  idCache.set(id, res.data);
  return res.data;
}

app.post("/api/favorites", async (req, res) => {
  const { username, game } = req.body;
  if (!username || !game) return res.status(400).json({ error: "Username & game required" });

  if (!users[username]) users[username] = [];

  try {
    const result = await fetchGameByName(game);
    if (!result) return res.status(404).json({ error: "Game not found" });

    const officialName = result.name;
    if (!users[username].includes(officialName)) {
      users[username].push(officialName);
    }

    res.json({ 
      success: true, 
      game: {
        name: officialName,
        image: result.background_image || null,
        rating: result.rating || null
      }
    });
  } catch (err) {
    console.error("Error adding favorite:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/favorites", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: "Username query param is required" });

  const favorites = users[username] || [];

  try {
    const favoritePromises = favorites.map(async (name) => {
      try {
        const game = await fetchGameByName(name);
        return {
          name: game.name,
          image: game.background_image || null,
          tags: [...(game.genres?.map(g => g.name) || []), ...(game.tags?.slice(0, 3).map(t => t.name) || [])],
          rating: game.rating || null
        };
      } catch {
        return { name, image: null, rating: null };
      }
    });

    const favWithImages = await Promise.all(favoritePromises);

    const recommendations = [];
    const recommendationSet = new Set();

    const recPromises = favorites.map(async (name) => {
      try {
        const base = await fetchGameByName(name);
        if (!base?.id) return;

        const details = await fetchGameDetailsById(base.id);
        const genreSlugs = details.genres?.map(g => g.slug).join(',') || '';
        const tagSlugs = details.tags?.slice(0, 3).map(t => t.slug).join(',') || '';

        const simParams = {
          key: process.env.RAWG_API_KEY,
          page_size: 10,
          ordering: "-rating",
          ...(genreSlugs && { genres: genreSlugs }),
          ...(tagSlugs && { tags: tagSlugs })
        };

        const simRes = await axios.get("https://api.rawg.io/api/games", { params: simParams });

        for (const g of simRes.data.results) {
          const name = g.name;
          if (!favorites.includes(name) && !recommendationSet.has(name)) {
            recommendationSet.add(name);
            recommendations.push({
              name,
              image: g.background_image || null,
              tags: [...(g.genres?.map(gen => gen.name) || []), ...(g.tags?.slice(0, 3).map(t => t.name) || [])],
              rating: g.rating || null
            });
          }
        }
      } catch (e) {
        console.error(`Error getting recommendations for ${name}:`, e.message);
      }
    });

    await Promise.all(recPromises);

    res.json({
      favorites: favWithImages,
      recommendations: recommendations.slice(0, 20)
    });
  } catch (e) {
    console.error("GET /api/favorites failed:", e.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/favorites", (req, res) => {
  const { username, game } = req.body;
  if (!username || !game) return res.status(400).json({ error: "Username and game are required" });
  if (!users[username]) return res.status(404).json({ error: "User not found" });

  users[username] = users[username].filter(g => g !== game);
  res.json({ success: true, removed: game });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

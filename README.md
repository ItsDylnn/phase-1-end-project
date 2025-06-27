# 🎮Games Domain🎮

A web app that recommends games based on your favorites using the RAWG Video Games Database API. Login, add favorite games, and get personalized recommendations with descriptions — all in a slick interface.

---

## 🌟 Features

- 🔐 Simple username-based login (no password required)
- 🕹 Add your favorite games (with autocomplete powered by RAWG)
- 🤖 Get personalized game recommendations
- 📝 Game descriptions provided
- 📈 Browse trending games
- ❤️ Add or remove favorites
- ✨ Smooth animations and dark UI theme

---

## 📸 Preview

![image](https://github.com/user-attachments/assets/7d541d40-7bc7-4b60-b32b-11f8401de270)

---

## 🚀 Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **API:** [RAWG Video Games Database](https://rawg.io/apidocs)
- **Other:** Autocomplete dropdown, animated tiles, local caching

---

## 🔧 Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/games-domain.git
cd games-domain
```

#### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables
Create a .env file in the root directory and add the RAWG API key:
```bash
RAWG_API_KEY=your_rawg_api_key_here
```

### 4. Start the server
```bash
node server.js
```
By default, the backend runs on http://localhost:5000.

### 5. Open the frontend
Simply open index.html in your browser or use a local server.

---

### 🧠 How It Works
- When a user logs in with a username, their favorites are stored in memory.

- The app uses the RAWG API to fetch game data and recommendations based on genres and tags.

- Local caching minimizes repeated API calls.

- Autocomplete suggests games while typing.

  ---

### 🙌 Acknowledgments
- https://RAWG.io for the awesome video game API







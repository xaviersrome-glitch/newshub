# 📡 NEWSTERM — Intelligence Feed Aggregator

A dark terminal-style news aggregator dashboard for Finance, Tech/AI, Military, World News, Politics, Crypto, and Sports. Built with pure HTML/CSS/JS — no framework, no build step, deploys instantly to GitHub Pages.

![NEWSTERM Screenshot](screenshot.png)

---

## ✨ Features

- **7 categories**: Finance, Tech/AI, Military/Defense, World News, Politics, Crypto, Sports
- **Multiple live sources**: RSS feeds, Reddit JSON API, Hacker News API, NewsAPI.org
- **Bloomberg-style dark terminal UI** with scanline effects
- **Live trending topics** extracted from headlines
- **Search across all feeds** in real time
- **Auto-refresh** every 5 minutes
- **Article modal** with read-more link
- **Zero backend** — runs entirely in the browser
- **GitHub Pages ready** — just push and deploy

---

## 🚀 Quick Start

### Option 1: GitHub Pages (recommended)

1. Fork or clone this repo
2. Go to **Settings → Pages → Source: main branch / root**
3. Visit `https://yourusername.github.io/newsterm`

### Option 2: Local

```bash
git clone https://github.com/yourusername/newsterm
cd newsterm
# Open index.html in your browser
# OR serve with any static server:
npx serve .
python3 -m http.server 8080
```

---

## 🔑 Data Sources

| Source | Key Required | Cost | Notes |
|--------|-------------|------|-------|
| RSS Feeds (BBC, Reuters, TechCrunch, etc.) | No | Free | Via AllOrigins CORS proxy |
| Reddit JSON API | No | Free | Hot posts per subreddit |
| Hacker News API | No | Free | Official Firebase API |
| NewsAPI.org | Yes | Free tier | 100 req/day, non-commercial |
| Twitter/X | Yes | $100+/mo | See Twitter section below |

### NewsAPI.org (Optional)
1. Register free at [newsapi.org/register](https://newsapi.org/register)
2. Copy your API key
3. Paste it in the yellow banner when you open the app — or hardcode it in `config.js`:

```js
NEWSAPI_KEY: 'your_key_here',
```

### Twitter/X (Optional)
Twitter API v2 requires a paid Basic developer plan ($100/month). Options:
- Add your Bearer Token to `config.js` under `TWITTER_BEARER_TOKEN`
- Use a [Nitter](https://github.com/zedeus/nitter) instance's RSS feed (add to `RSS_FEEDS` in config.js)

---

## ⚙️ Configuration

All feeds and settings are in **`config.js`**:

```js
// Add custom RSS feeds
RSS_FEEDS: [
  { url: 'https://example.com/rss', label: 'My Feed', category: 'tech' },
  ...
]

// Add/remove subreddits
REDDIT_FEEDS: [
  { sub: 'wallstreetbets', category: 'finance' },
  ...
]

// Adjust display
ARTICLES_PER_PAGE: 30,
AUTO_REFRESH_MINUTES: 5,
```

**Valid categories**: `finance` · `tech` · `military` · `world` · `politics` · `crypto` · `sports`

---

## 📁 File Structure

```
newsterm/
├── index.html      # Main HTML structure
├── style.css       # Dark terminal stylesheet
├── app.js          # Feed engine + UI controller
├── config.js       # All feeds, sources, and settings
└── README.md
```

---

## 🛠 Customization

### Add a new RSS feed
```js
// In config.js, add to RSS_FEEDS:
{ url: 'https://feeds.example.com/rss', label: 'My Source', category: 'world' }
```

### Add a new subreddit
```js
// In config.js, add to REDDIT_FEEDS:
{ sub: 'geopolitics', category: 'military' }
```

### Change auto-refresh interval
```js
AUTO_REFRESH_MINUTES: 10,  // Change from 5 to 10 minutes
```

---

## 🔒 Privacy & Limitations

- No data is sent to any server other than the news APIs themselves
- NewsAPI key is stored in `localStorage` (browser-only)
- CORS proxy used: [AllOrigins](https://allorigins.win) (open source, self-hostable)
- Some RSS feeds may block CORS — swap AllOrigins for [cors.sh](https://cors.sh) or host your own proxy

---

## 📜 License

MIT — free to use, fork, and modify.

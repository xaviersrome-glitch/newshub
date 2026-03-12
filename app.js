// ============================================================
//  NewsHub — app.js  v2.0
//  Live stocks (Finnhub) + crypto (CoinGecko) + richer feeds
// ============================================================

const CFG = window.NEWSTERM_CONFIG;

// ── State ─────────────────────────────────────────────────────
const state = {
  articles: [], filtered: [], page: 1,
  activeCategory: 'all', activeSource: 'all',
  sortBy: 'date', searchQuery: '',
  loading: false, lastRefresh: null,
  marketData: {},
};

// ── CORS proxy ────────────────────────────────────────────────
const CORS = (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

// ── Category config ───────────────────────────────────────────
const CAT = {
  finance:  { label: 'Finance',   color: '#0a7c3e', emoji: '📈' },
  tech:     { label: 'Tech / AI', color: '#0057b8', emoji: '💻' },
  military: { label: 'Military',  color: '#b91c1c', emoji: '🎖️' },
  world:    { label: 'World',     color: '#7c3aed', emoji: '🌍' },
  politics: { label: 'Politics',  color: '#1e40af', emoji: '🏛️' },
  crypto:   { label: 'Crypto',    color: '#c2410c', emoji: '₿'  },
  sports:   { label: 'Sports',    color: '#0e7490', emoji: '🏆' },
};
const catLabel = (c) => CAT[c]?.label || c;
const catColor = (c) => CAT[c]?.color || '#555';
const catEmoji = (c) => CAT[c]?.emoji || '📰';

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (isNaN(diff) || diff < 0) return '';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function san(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}
function fmt(n, dec = 2) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtPrice(n) {
  if (n >= 1000) return '$' + fmt(n, 0);
  if (n >= 1) return '$' + fmt(n, 2);
  return '$' + Number(n).toFixed(4);
}
function dedupeArticles(arr) {
  const seen = new Set();
  return arr.filter(a => {
    const k = (a.title || '').toLowerCase().replace(/\W/g, '').slice(0, 55);
    if (!k || seen.has(k)) return false;
    seen.add(k); return true;
  });
}
function srcLabel(t) {
  return { rss: 'RSS', reddit: 'Reddit', hackernews: 'HN', newsapi: 'NewsAPI' }[t] || t;
}

// ── Clock ─────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('live-clock');
  if (el) el.textContent = new Date().toLocaleString('en-US',
    { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ════════════════════════════════════════════════════════════
//  MARKET DATA
// ════════════════════════════════════════════════════════════

// ── CoinGecko crypto (free, no key) ──────────────────────────
async function fetchCrypto() {
  try {
    const ids = CFG.CRYPTO.map(c => c.id).join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    return CFG.CRYPTO.map(c => ({
      symbol: c.symbol,
      label: c.label,
      price: data[c.id]?.usd ?? null,
      change: data[c.id]?.usd_24h_change ?? null,
      type: 'crypto',
    })).filter(c => c.price !== null);
  } catch (e) {
    console.warn('CoinGecko failed', e.message);
    return [];
  }
}

// ── Finnhub stocks (free key required) ───────────────────────
async function fetchStocksFinnhub(key) {
  const results = [];
  for (const stock of CFG.STOCKS) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${key}`,
        { signal: AbortSignal.timeout(6000) }
      );
      const d = await res.json();
      if (d.c) {
        const change = ((d.c - d.pc) / d.pc) * 100;
        results.push({ symbol: stock.symbol, label: stock.label, price: d.c, change, type: 'stock' });
      }
    } catch (e) { /* silent per-stock */ }
  }
  return results;
}

// ── Yahoo Finance proxy fallback (no key) ────────────────────
async function fetchStocksYahoo() {
  const results = [];
  // Use a batch approach via allorigins
  for (const stock of CFG.STOCKS.slice(0, 6)) { // limit to avoid flooding
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}?interval=1d&range=2d`;
      const res = await fetch(CORS(url), { signal: AbortSignal.timeout(8000) });
      const wrapper = await res.json();
      const parsed = JSON.parse(wrapper.contents);
      const meta = parsed?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const change = ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100;
        results.push({
          symbol: stock.symbol, label: stock.label,
          price: meta.regularMarketPrice, change, type: 'stock',
        });
      }
    } catch (e) { /* silent */ }
  }
  return results;
}

// ── Master market fetch ───────────────────────────────────────
async function fetchMarketData() {
  const finnhubKey = CFG.FINNHUB_KEY;
  const [cryptoData, stockData] = await Promise.all([
    fetchCrypto(),
    finnhubKey ? fetchStocksFinnhub(finnhubKey) : fetchStocksYahoo(),
  ]);

  const all = [...stockData, ...cryptoData];
  all.forEach(item => { state.marketData[item.symbol] = item; });

  renderMarketBar(all);
  renderMarketSidebar(all);
}

// ── Render market ticker bar ──────────────────────────────────
function renderMarketBar(items) {
  if (!items.length) return;
  const inner = document.getElementById('market-inner');
  const chunk = items.map(item => {
    const up = item.change >= 0;
    const chg = (up ? '+' : '') + fmt(item.change, 2) + '%';
    return `<span class="market-item">
      <span class="m-sym">${san(item.symbol)}</span>
      <span class="m-price">${fmtPrice(item.price)}</span>
      <span class="m-chg ${up ? 'up' : 'down'}">${chg}</span>
    </span>`;
  }).join('<span class="m-divider">|</span>');
  // Duplicate for seamless scroll
  inner.innerHTML = chunk + '<span class="m-spacer"></span>' + chunk;
}

// ── Render market sidebar widget ──────────────────────────────
function renderMarketSidebar(items) {
  const el = document.getElementById('market-sidebar');
  if (!items.length) {
    el.innerHTML = `<div class="market-loading-sm">No market data. Add a <a href="https://finnhub.io/register" target="_blank">Finnhub key</a> in ⚙ Settings for stocks.</div>`;
    return;
  }
  const stocks = items.filter(i => i.type === 'stock');
  const crypto = items.filter(i => i.type === 'crypto');

  let html = '';
  if (stocks.length) {
    html += `<div class="mw-section-label">Stocks</div>`;
    html += stocks.map(s => marketRow(s)).join('');
  }
  if (crypto.length) {
    html += `<div class="mw-section-label">Crypto</div>`;
    html += crypto.slice(0, 6).map(s => marketRow(s)).join('');
  }
  el.innerHTML = html;
}

function marketRow(item) {
  const up = item.change >= 0;
  return `<div class="mw-row">
    <div class="mw-left">
      <span class="mw-sym">${san(item.symbol)}</span>
      <span class="mw-label">${san(item.label)}</span>
    </div>
    <div class="mw-right">
      <span class="mw-price">${fmtPrice(item.price)}</span>
      <span class="mw-chg ${up ? 'up' : 'down'}">${up?'▲':'▼'} ${Math.abs(item.change).toFixed(2)}%</span>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════
//  NEWS FETCHERS
// ════════════════════════════════════════════════════════════

async function fetchRSS(feed) {
  try {
    const res = await fetch(CORS(feed.url), { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const xml = new DOMParser().parseFromString(data.contents, 'text/xml');
    const items = [...xml.querySelectorAll('item, entry')];
    return items.slice(0, 15).map(item => {
      const get = (tag) => item.querySelector(tag)?.textContent?.trim() || '';
      const getAttr = (tag, attr) => item.querySelector(tag)?.getAttribute(attr) || '';

      const link = get('link') || getAttr('link', 'href');
      const pub  = get('pubDate') || get('published') || get('updated');

      // Aggressive thumbnail extraction
      let thumb = '';
      const candidates = [
        getAttr('enclosure', 'url'),
        getAttr('media\\:content', 'url'),
        getAttr('media:content', 'url'),
        getAttr('media\\:thumbnail', 'url'),
        getAttr('media:thumbnail', 'url'),
        getAttr('media\\:group media\\:content', 'url'),
      ];
      for (const c of candidates) { if (c && c.startsWith('http')) { thumb = c; break; } }

      // Also try to pull from description HTML
      if (!thumb) {
        const desc = get('description') || get('summary');
        const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1].startsWith('http')) thumb = imgMatch[1];
      }

      // Clean description (strip HTML tags)
      const rawDesc = get('description') || get('summary') || get('content');
      const cleanDesc = rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

      return {
        id: link + pub,
        title: get('title'),
        description: cleanDesc,
        url: link,
        source: feed.label,
        sourceType: 'rss',
        category: feed.category,
        publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
        thumbnail: thumb,
      };
    }).filter(a => a.title && a.url);
  } catch (e) {
    console.warn(`RSS failed: ${feed.label}`, e.message);
    return [];
  }
}

async function fetchReddit(feed) {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${feed.sub}/hot.json?limit=10`,
      { signal: AbortSignal.timeout(9000) }
    );
    const data = await res.json();
    return (data?.data?.children || []).map(c => {
      const p = c.data;
      let thumb = '';
      if (p.thumbnail && p.thumbnail.startsWith('http')) thumb = p.thumbnail;
      if (p.preview?.images?.[0]?.source?.url) {
        thumb = p.preview.images[0].source.url.replace(/&amp;/g, '&');
      }
      return {
        id: `r-${p.id}`,
        title: p.title,
        description: p.selftext?.trim().slice(0, 300) || `r/${feed.sub} · ${p.ups.toLocaleString()} upvotes`,
        url: p.url.startsWith('/r/') ? `https://reddit.com${p.url}` : p.url,
        source: `r/${feed.sub}`,
        sourceType: 'reddit',
        category: feed.category,
        publishedAt: new Date(p.created_utc * 1000).toISOString(),
        score: p.ups,
        comments: p.num_comments,
        thumbnail: thumb,
        redditLink: `https://reddit.com${p.permalink}`,
      };
    }).filter(a => a.title && !a.title.startsWith('['));
  } catch (e) {
    console.warn(`Reddit failed: r/${feed.sub}`, e.message);
    return [];
  }
}

async function fetchHackerNews() {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json',
      { signal: AbortSignal.timeout(9000) });
    const ids = await res.json();
    const items = await Promise.allSettled(
      ids.slice(0, CFG.HN_STORY_COUNT).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
    );
    return items
      .filter(r => r.status === 'fulfilled' && r.value?.url)
      .map(r => {
        const s = r.value;
        return {
          id: `hn-${s.id}`,
          title: s.title,
          description: `${s.score} points · ${s.descendants || 0} comments · by ${s.by}`,
          url: s.url,
          source: 'Hacker News',
          sourceType: 'hackernews',
          category: 'tech',
          publishedAt: new Date(s.time * 1000).toISOString(),
          score: s.score,
          hnLink: `https://news.ycombinator.com/item?id=${s.id}`,
          thumbnail: '',
        };
      });
  } catch (e) {
    console.warn('HN failed', e.message);
    return [];
  }
}

async function fetchNewsAPI() {
  const key = CFG.NEWSAPI_KEY;
  if (!key) return [];
  const all = [];
  for (const q of CFG.NEWSAPI_QUERIES) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q.q)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${key}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
      const data = await res.json();
      if (data.status !== 'ok') continue;
      all.push(...(data.articles || []).map(a => ({
        id: a.url,
        title: a.title,
        description: a.description || a.content || '',
        url: a.url,
        source: a.source?.name || 'NewsAPI',
        sourceType: 'newsapi',
        category: q.category,
        publishedAt: a.publishedAt,
        thumbnail: a.urlToImage || '',
        author: a.author || '',
      })).filter(a => a.title && a.url && !a.title.includes('[Removed]')));
    } catch (e) { /* silent */ }
  }
  return all;
}

// ── Master feed fetch ─────────────────────────────────────────
async function fetchAllFeeds() {
  if (state.loading) return;
  state.loading = true;

  const dot = document.getElementById('feed-status-dot');
  dot.className = 'status-dot loading';
  document.getElementById('feed-status').textContent = 'Syncing...';
  document.getElementById('article-count').textContent = 'Fetching...';

  const tasks = [
    ...CFG.RSS_FEEDS.map(f => fetchRSS(f)),
    ...CFG.REDDIT_FEEDS.map(f => fetchReddit(f)),
    fetchHackerNews(),
    fetchNewsAPI(),
  ];

  const results = await Promise.allSettled(tasks);
  let all = [];
  for (const r of results) if (r.status === 'fulfilled') all.push(...r.value);

  all = dedupeArticles(all);
  all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  state.articles = all;
  state.lastRefresh = new Date();
  state.page = 1;

  applyFilters();
  renderRedditSidebar();
  renderHNSidebar();
  renderTrending();
  renderTicker();

  document.getElementById('article-count').textContent = `${all.length.toLocaleString()} articles`;
  dot.className = 'status-dot live';
  document.getElementById('feed-status').textContent = 'Live';
  document.getElementById('last-refresh').textContent =
    `Refreshed ${state.lastRefresh.toLocaleTimeString()}`;

  state.loading = false;
}

// ── Filters ───────────────────────────────────────────────────
function applyFilters() {
  let arr = [...state.articles];
  if (state.activeCategory !== 'all') arr = arr.filter(a => a.category === state.activeCategory);
  if (state.activeSource !== 'all') arr = arr.filter(a => a.sourceType === state.activeSource);
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    arr = arr.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.source || '').toLowerCase().includes(q)
    );
  }
  if (state.sortBy === 'source') arr.sort((a, b) => (a.source || '').localeCompare(b.source || ''));
  else arr.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  state.filtered = arr;
  state.page = 1;
  renderHero();
  renderGrid();
}

// ── Hero ──────────────────────────────────────────────────────
function renderHero() {
  const el = document.getElementById('hero-section');
  const a = state.filtered[0];
  if (!a) {
    el.innerHTML = '<div class="no-results"><strong>No stories found</strong>Try adjusting your filters.</div>';
    return;
  }
  const hasBg = a.thumbnail?.startsWith('http');
  const color = catColor(a.category);
  el.innerHTML = `
    <div class="hero-card" id="hero-card">
      ${hasBg
        ? `<div class="hero-img-wrap" style="background-image:url('${san(a.thumbnail)}')" role="img"></div>`
        : `<div class="hero-no-img" style="background:linear-gradient(135deg,${color}22,#f0f4f8)">${catEmoji(a.category)}</div>`}
      <div class="hero-content">
        <div class="hero-badges">
          <span class="cat-tag" style="background:${color}">${catLabel(a.category)}</span>
          <span class="src-tag">${san(a.source)}</span>
          ${a.sourceType === 'reddit' && a.score ? `<span class="src-tag">▲ ${a.score.toLocaleString()}</span>` : ''}
        </div>
        <h2 class="hero-title">${san(a.title)}</h2>
        ${a.description ? `<p class="hero-desc">${san(a.description.slice(0, 260))}${a.description.length > 260 ? '…' : ''}</p>` : ''}
        <div class="hero-meta">
          <span class="hero-time">${timeAgo(a.publishedAt)}</span>
          <a class="hero-read-btn" href="${san(a.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Read story →</a>
        </div>
      </div>
    </div>`;
  document.getElementById('hero-card').addEventListener('click', () => openModal(a));
}

// ── Card ──────────────────────────────────────────────────────
function makeCard(a) {
  const hasBg = a.thumbnail?.startsWith('http');
  const color = catColor(a.category);
  const emoji = catEmoji(a.category);
  const isReddit = a.sourceType === 'reddit';
  const isHN = a.sourceType === 'hackernews';
  const score = (isReddit || isHN) && a.score
    ? `<span class="card-score">▲ ${a.score.toLocaleString()}</span>` : '';

  return `
    <div class="news-card">
      <div class="card-img-wrap">
        ${hasBg
          ? `<div class="card-img" style="background-image:url('${san(a.thumbnail)}')" loading="lazy"></div>`
          : `<div class="card-img-emoji" style="background:linear-gradient(135deg,${color}18,#f0f4f8)">${emoji}</div>`}
      </div>
      <div class="card-body">
        <div class="card-top-row">
          <span class="card-cat" style="background:${color}">${catLabel(a.category)}</span>
          <span class="card-time">${timeAgo(a.publishedAt)}</span>
        </div>
        <h3 class="card-title">${san(a.title)}</h3>
        ${a.description ? `<p class="card-desc">${san(a.description.slice(0, 100))}…</p>` : ''}
        <div class="card-footer">
          <span class="card-source">
            <span class="card-src-dot" style="background:${color}"></span>
            ${san(a.source)} ${score}
          </span>
          <a class="card-read-link" href="${san(a.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Read →</a>
        </div>
      </div>
    </div>`;
}

// ── Grid ──────────────────────────────────────────────────────
function renderGrid(append = false) {
  const grid = document.getElementById('news-grid');
  const start = append ? (state.page - 1) * CFG.ARTICLES_PER_PAGE : 0;
  const end = state.page * CFG.ARTICLES_PER_PAGE;
  const slice = state.filtered.slice(start === 0 ? 1 : start, end);

  if (!append) {
    grid.innerHTML = '';
    document.getElementById('sort-count').textContent =
      state.filtered.length > 1 ? `${(state.filtered.length - 1).toLocaleString()} stories` : '';
  }
  if (!slice.length && !append) {
    grid.innerHTML = '<div class="no-results"><strong>No stories found</strong>Try a different filter or search.</div>';
    document.getElementById('load-more-wrap').style.display = 'none';
    return;
  }
  const frag = document.createDocumentFragment();
  slice.forEach(a => {
    const tmp = document.createElement('div');
    tmp.innerHTML = makeCard(a);
    const card = tmp.firstElementChild;
    card.addEventListener('click', () => openModal(a));
    frag.appendChild(card);
  });
  grid.appendChild(frag);
  document.getElementById('load-more-wrap').style.display = end < state.filtered.length ? 'flex' : 'none';
}

// ── Trending ──────────────────────────────────────────────────
function renderTrending() {
  const stop = new Set('the a an in of to and is was for on at by with that this are be as it its from not but or have had has said says new more will would about after been up out no their they we he she his her us our can could may may might than if so do did over into then when where who how all some one two three also just time year day week month'.split(' '));
  const freq = {};
  for (const a of state.articles) {
    for (const w of (a.title || '').toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/)) {
      if (w.length > 4 && !stop.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
  }
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,12);
  document.getElementById('trending-list').innerHTML = top.map(([w, cnt], i) =>
    `<div class="trending-item" onclick="triggerSearch('${w}')">
      <span class="t-rank">${i+1}</span>
      <span class="t-word">${w.charAt(0).toUpperCase()+w.slice(1)}</span>
      <span class="t-count">${cnt}</span>
    </div>`
  ).join('');
}

function triggerSearch(w) {
  document.getElementById('search-input').value = w;
  state.searchQuery = w; applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.triggerSearch = triggerSearch;

// ── Sidebars ──────────────────────────────────────────────────
function renderRedditSidebar() {
  const posts = state.articles.filter(a => a.sourceType === 'reddit')
    .sort((a,b) => (b.score||0)-(a.score||0)).slice(0,8);
  document.getElementById('reddit-sidebar').innerHTML = posts.map(p =>
    `<div class="s-item" onclick="openModal(articleById('${san(p.id)}'))">
      <div class="s-src">${san(p.source)}</div>
      <div class="s-title">${san(p.title.slice(0,85))}${p.title.length>85?'…':''}</div>
      <div class="s-meta">▲ ${(p.score||0).toLocaleString()} · 💬 ${(p.comments||0).toLocaleString()}</div>
    </div>`
  ).join('');
}

function renderHNSidebar() {
  const posts = state.articles.filter(a => a.sourceType === 'hackernews')
    .sort((a,b) => (b.score||0)-(a.score||0)).slice(0,8);
  document.getElementById('hn-sidebar').innerHTML = posts.map(p =>
    `<div class="s-item">
      <div class="s-title"><a href="${san(p.url)}" target="_blank" rel="noopener">${san(p.title.slice(0,85))}${p.title.length>85?'…':''}</a></div>
      <div class="s-meta">▲ ${(p.score||0).toLocaleString()} · <a href="${san(p.hnLink)}" target="_blank">discuss</a></div>
    </div>`
  ).join('');
}

// ── Ticker ────────────────────────────────────────────────────
function renderTicker() {
  const titles = state.articles.slice(0, 30).map(a => a.title).join('  ·  ');
  const el = document.getElementById('ticker-inner');
  el.textContent = titles + '  ·  ' + titles;
}

// ── Lookup ────────────────────────────────────────────────────
function articleById(id) { return state.articles.find(a => a.id === id); }
window.articleById = articleById;

// ── Modal ─────────────────────────────────────────────────────
function openModal(a) {
  if (!a) return;
  const color = catColor(a.category);
  document.getElementById('modal-cat').textContent  = catLabel(a.category);
  document.getElementById('modal-cat').style.background = color;
  document.getElementById('modal-src').textContent  = a.source;
  document.getElementById('modal-title').textContent = a.title;
  document.getElementById('modal-date').textContent  = a.publishedAt ? new Date(a.publishedAt).toLocaleString() : '';
  document.getElementById('modal-author').textContent = a.author ? `· ${a.author}` : '';
  document.getElementById('modal-desc').textContent  = a.description || '';
  document.getElementById('modal-link').href         = a.url;
  // Show image in modal if available
  const imgWrap = document.getElementById('modal-img-wrap');
  const img = document.getElementById('modal-img');
  if (a.thumbnail?.startsWith('http')) {
    img.src = a.thumbnail;
    imgWrap.classList.remove('hidden');
  } else {
    imgWrap.classList.add('hidden');
    img.src = '';
  }
  document.getElementById('article-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
window.openModal = openModal;
function closeModal() {
  document.getElementById('article-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Events ────────────────────────────────────────────────────
function initEvents() {
  document.querySelectorAll('.cn-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.cn-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeCategory = btn.dataset.cat; applyFilters();
  }));
  document.querySelectorAll('.src-pill').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.src-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeSource = btn.dataset.src; applyFilters();
  }));
  document.querySelectorAll('.sort-opt').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.sortBy = btn.dataset.sort; applyFilters();
  }));

  let searchTimer;
  document.getElementById('search-input').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.searchQuery = e.target.value.trim(); applyFilters(); }, 280);
  });

  document.getElementById('load-more-btn').addEventListener('click', () => { state.page++; renderGrid(true); });
  document.getElementById('refresh-btn').addEventListener('click', () => { fetchAllFeeds(); fetchMarketData(); });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Settings dropdown
  const toggle = document.getElementById('api-key-toggle');
  const dropdown = document.getElementById('api-key-dropdown');
  toggle.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('hidden'); });
  document.addEventListener('click', () => dropdown.classList.add('hidden'));
  dropdown.addEventListener('click', e => e.stopPropagation());

  document.getElementById('save-key-btn').addEventListener('click', () => {
    const key = document.getElementById('newsapi-key').value.trim();
    if (key) { localStorage.setItem('newshub_newsapi_key', key); CFG.NEWSAPI_KEY = key; dropdown.classList.add('hidden'); fetchAllFeeds(); }
  });
  document.getElementById('save-finnhub-btn').addEventListener('click', () => {
    const key = document.getElementById('finnhub-key').value.trim();
    if (key) { localStorage.setItem('newshub_finnhub_key', key); CFG.FINNHUB_KEY = key; dropdown.classList.add('hidden'); fetchMarketData(); }
  });
  document.getElementById('dismiss-notice').addEventListener('click', () => dropdown.classList.add('hidden'));

  // Auto-refresh news
  const autoBox = document.getElementById('auto-refresh');
  let autoTimer;
  function setupAuto() {
    clearInterval(autoTimer);
    if (autoBox.checked) autoTimer = setInterval(fetchAllFeeds, CFG.AUTO_REFRESH_MINUTES * 60 * 1000);
  }
  autoBox.addEventListener('change', setupAuto);
  setupAuto();

  // Auto-refresh market every 2 min
  setInterval(fetchMarketData, CFG.MARKET_REFRESH_MINUTES * 60 * 1000);
}

// ── Boot ──────────────────────────────────────────────────────
function boot() {
  updateClock();
  setInterval(updateClock, 30000);

  // Restore saved keys
  const savedNews = localStorage.getItem('newshub_newsapi_key');
  const savedFinn = localStorage.getItem('newshub_finnhub_key');
  if (savedNews) { CFG.NEWSAPI_KEY = savedNews; document.getElementById('newsapi-key').value = savedNews; }
  if (savedFinn) { CFG.FINNHUB_KEY = savedFinn; document.getElementById('finnhub-key').value = savedFinn; }

  initEvents();
  fetchAllFeeds();
  fetchMarketData();
}

document.addEventListener('DOMContentLoaded', boot);

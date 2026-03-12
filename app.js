// ============================================================
//  NewsHub — app.js  (Yahoo-style feed engine + UI)
// ============================================================

const CFG = window.NEWSTERM_CONFIG;

// ── State ────────────────────────────────────────────────────
const state = {
  articles: [],
  filtered: [],
  page: 1,
  activeCategory: 'all',
  activeSource: 'all',
  sortBy: 'date',
  searchQuery: '',
  loading: false,
  lastRefresh: null,
};

// ── CORS Proxy ────────────────────────────────────────────────
const CORS = (url) =>
  `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

// ── Category config ───────────────────────────────────────────
const CAT_CONFIG = {
  finance:  { label: 'Finance',   color: '#007a39', emoji: '📈' },
  tech:     { label: 'Tech / AI', color: '#0078d7', emoji: '💻' },
  military: { label: 'Military',  color: '#c0392b', emoji: '🎖️' },
  world:    { label: 'World',     color: '#6c3483', emoji: '🌍' },
  politics: { label: 'Politics',  color: '#1a5276', emoji: '🏛️' },
  crypto:   { label: 'Crypto',    color: '#d35400', emoji: '₿'  },
  sports:   { label: 'Sports',    color: '#117a65', emoji: '🏆' },
};
const catLabel = (c) => CAT_CONFIG[c]?.label || c;
const catColor = (c) => CAT_CONFIG[c]?.color || '#555';
const catEmoji = (c) => CAT_CONFIG[c]?.emoji || '📰';
const catClass = (c) => `cat-${c in CAT_CONFIG ? c : 'default'}`;

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (isNaN(diff) || diff < 0) return '';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function dedupeArticles(arr) {
  const seen = new Set();
  return arr.filter(a => {
    const key = (a.title || '').toLowerCase().replace(/\W/g, '').slice(0, 55);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function srcTypeLabel(t) {
  return { rss: 'RSS', reddit: 'Reddit', hackernews: 'HN', newsapi: 'NewsAPI' }[t] || t;
}

// ── Clock ─────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('live-clock');
  if (el) el.textContent = new Date().toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ── RSS Fetcher ───────────────────────────────────────────────
async function fetchRSS(feed) {
  try {
    const res = await fetch(CORS(feed.url), { signal: AbortSignal.timeout(9000) });
    const data = await res.json();
    const xml = new DOMParser().parseFromString(data.contents, 'text/xml');
    const items = [...xml.querySelectorAll('item, entry')];
    return items.slice(0, 15).map(item => {
      const get = (tag) => item.querySelector(tag)?.textContent?.trim() || '';
      const getAttr = (tag, attr) => item.querySelector(tag)?.getAttribute(attr) || '';
      const link = get('link') || getAttr('link', 'href');
      const pub = get('pubDate') || get('published') || get('updated');
      const thumb = getAttr('enclosure', 'url') || getAttr('media\\:content', 'url') ||
                    getAttr('media:content', 'url') || getAttr('media:thumbnail', 'url') || '';
      return {
        id: link + pub,
        title: get('title'),
        description: get('description') || get('summary') || get('content'),
        url: link,
        source: feed.label,
        sourceType: 'rss',
        category: feed.category,
        publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
        thumbnail: thumb.startsWith('http') ? thumb : '',
      };
    }).filter(a => a.title && a.url);
  } catch (e) {
    console.warn(`RSS failed: ${feed.label}`, e.message);
    return [];
  }
}

// ── Reddit Fetcher ────────────────────────────────────────────
async function fetchReddit(feed) {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${feed.sub}/hot.json?limit=10`,
      { signal: AbortSignal.timeout(9000) }
    );
    const data = await res.json();
    return (data?.data?.children || []).map(c => {
      const p = c.data;
      return {
        id: `r-${p.id}`,
        title: p.title,
        description: p.selftext?.trim().slice(0, 300) || `Posted in r/${feed.sub} · ${p.ups.toLocaleString()} upvotes`,
        url: p.url.startsWith('/r/') ? `https://reddit.com${p.url}` : p.url,
        source: `r/${feed.sub}`,
        sourceType: 'reddit',
        category: feed.category,
        publishedAt: new Date(p.created_utc * 1000).toISOString(),
        score: p.ups,
        comments: p.num_comments,
        thumbnail: (p.thumbnail || '').startsWith('http') ? p.thumbnail : '',
        redditLink: `https://reddit.com${p.permalink}`,
      };
    }).filter(a => a.title && !a.title.startsWith('['));
  } catch (e) {
    console.warn(`Reddit failed: r/${feed.sub}`, e.message);
    return [];
  }
}

// ── Hacker News Fetcher ───────────────────────────────────────
async function fetchHackerNews() {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json',
      { signal: AbortSignal.timeout(9000) });
    const ids = await res.json();
    const results = await Promise.allSettled(
      ids.slice(0, CFG.HN_STORY_COUNT).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
    );
    return results
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

// ── NewsAPI Fetcher ───────────────────────────────────────────
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

// ── Master fetch ──────────────────────────────────────────────
async function fetchAllFeeds() {
  if (state.loading) return;
  state.loading = true;

  const dot = document.getElementById('feed-status-dot');
  const statusEl = document.getElementById('feed-status');
  dot.className = 'status-dot loading';
  statusEl.textContent = 'Syncing...';
  document.getElementById('article-count').textContent = 'Fetching...';

  const tasks = [
    ...CFG.RSS_FEEDS.map(f => fetchRSS(f)),
    ...CFG.REDDIT_FEEDS.map(f => fetchReddit(f)),
    fetchHackerNews(),
    fetchNewsAPI(),
  ];

  const results = await Promise.allSettled(tasks);
  let all = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

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

  const count = all.length;
  document.getElementById('article-count').textContent = `${count.toLocaleString()} articles`;
  dot.className = 'status-dot live';
  statusEl.textContent = 'Live';
  document.getElementById('last-refresh').textContent =
    `Last refreshed ${state.lastRefresh.toLocaleTimeString()}`;

  state.loading = false;
}

// ── Filters & sort ────────────────────────────────────────────
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
  if (state.sortBy === 'source') {
    arr.sort((a, b) => (a.source || '').localeCompare(b.source || ''));
  } else {
    arr.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }
  state.filtered = arr;
  state.page = 1;
  renderHero();
  renderGrid();
}

// ── Hero card ─────────────────────────────────────────────────
function renderHero() {
  const container = document.getElementById('hero-section');
  const article = state.filtered[0];
  if (!article) {
    container.innerHTML = '<div class="no-results"><strong>No stories found</strong>Try adjusting your filters or refreshing.</div>';
    return;
  }
  const hasBg = article.thumbnail?.startsWith('http');
  const color = catColor(article.category);
  const emoji = catEmoji(article.category);

  container.innerHTML = `
    <div class="hero-card" id="hero-card">
      ${hasBg
        ? `<div class="hero-img-wrap" style="background-image:url('${sanitize(article.thumbnail)}')" role="img"></div>`
        : `<div class="hero-no-img">${emoji}</div>`
      }
      <div class="hero-content">
        <div class="hero-badges">
          <span class="cat-tag" style="background:${color}">${catLabel(article.category)}</span>
          <span class="src-tag">${sanitize(article.source)}</span>
          ${article.sourceType === 'reddit' && article.score
            ? `<span class="src-tag">▲ ${article.score.toLocaleString()}</span>` : ''}
        </div>
        <h2 class="hero-title">${sanitize(article.title)}</h2>
        ${article.description
          ? `<p class="hero-desc">${sanitize(article.description.slice(0, 260))}${article.description.length > 260 ? '…' : ''}</p>`
          : ''}
        <div class="hero-meta">
          <span class="hero-time">${timeAgo(article.publishedAt)}</span>
          <a class="hero-read-btn" href="${sanitize(article.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Read story →</a>
        </div>
      </div>
    </div>`;

  document.getElementById('hero-card').addEventListener('click', () => openModal(article));
}

// ── Card HTML ─────────────────────────────────────────────────
function makeCard(article) {
  const hasBg = article.thumbnail?.startsWith('http');
  const color = catColor(article.category);
  const emoji = catEmoji(article.category);
  const isReddit = article.sourceType === 'reddit';
  const isHN = article.sourceType === 'hackernews';

  const scoreHtml = (isReddit || isHN) && article.score
    ? `<span class="card-score">▲ ${article.score.toLocaleString()}</span>` : '';

  return `
    <div class="news-card" data-url="${sanitize(article.url)}">
      <div class="card-img-wrap">
        ${hasBg
          ? `<div class="card-img" style="background-image:url('${sanitize(article.thumbnail)}')"></div>`
          : `<div class="card-img-emoji">${emoji}</div>`}
      </div>
      <div class="card-body">
        <div class="card-top-row">
          <span class="card-cat ${catClass(article.category)}">${catLabel(article.category)}</span>
          <span class="card-time">${timeAgo(article.publishedAt)}</span>
        </div>
        <h3 class="card-title">${sanitize(article.title)}</h3>
        ${article.description
          ? `<p class="card-desc">${sanitize(article.description.slice(0, 110))}…</p>` : ''}
        <div class="card-footer">
          <span class="card-source">
            <span class="card-source-icon" style="background:${color}">${srcTypeLabel(article.sourceType)[0]}</span>
            ${sanitize(article.source)}
            ${scoreHtml}
          </span>
          <a class="card-read-link" href="${sanitize(article.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Read →</a>
        </div>
      </div>
    </div>`;
}

// ── Render grid ───────────────────────────────────────────────
function renderGrid(append = false) {
  const grid = document.getElementById('news-grid');
  const start = append ? (state.page - 1) * CFG.ARTICLES_PER_PAGE : 0;
  const end = state.page * CFG.ARTICLES_PER_PAGE;
  // skip first article (hero) when not appending
  const slice = state.filtered.slice(start === 0 ? 1 : start, end);

  if (!append) {
    grid.innerHTML = '';
    document.getElementById('sort-count').textContent =
      state.filtered.length > 1 ? `${(state.filtered.length - 1).toLocaleString()} stories` : '';
  }

  if (slice.length === 0 && !append) {
    grid.innerHTML = '<div class="no-results"><strong>No stories found</strong>Try a different filter or search term.</div>';
    document.getElementById('load-more-wrap').style.display = 'none';
    return;
  }

  const frag = document.createDocumentFragment();
  slice.forEach(article => {
    const tmp = document.createElement('div');
    tmp.innerHTML = makeCard(article);
    const card = tmp.firstElementChild;
    card.addEventListener('click', () => openModal(article));
    frag.appendChild(card);
  });
  grid.appendChild(frag);

  const loadWrap = document.getElementById('load-more-wrap');
  loadWrap.style.display = end < state.filtered.length ? 'flex' : 'none';
}

// ── Trending ──────────────────────────────────────────────────
function renderTrending() {
  const stop = new Set(['the','a','an','in','of','to','and','is','was','for','on','at','by','with','that','this','are','be','as','it','its','from','not','but','or','have','had','has','said','says','new','more','will','would','about','after','been','up','out','no','their','they','we','he','she','his','her','us','our','can','could','may','might','than','if','so','do','did','over','after','before','into','than','then','when','where','who','how','all','some','one','two','three','four','five','six','seven','eight','nine','ten','also','just','time','year','years','day','days','week','weeks','month','months']);
  const freq = {};
  for (const a of state.articles) {
    for (const w of (a.title || '').toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)) {
      if (w.length > 4 && !stop.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
  }
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, 12);
  document.getElementById('trending-list').innerHTML = top.map(([word, count], i) =>
    `<div class="trending-item" onclick="triggerSearch('${word}')">
      <span class="t-rank">${i + 1}</span>
      <span class="t-word">${word.charAt(0).toUpperCase() + word.slice(1)}</span>
      <span class="t-count">${count}</span>
    </div>`
  ).join('');
}

function triggerSearch(word) {
  const input = document.getElementById('search-input');
  input.value = word;
  state.searchQuery = word;
  applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.triggerSearch = triggerSearch;

// ── Reddit sidebar ────────────────────────────────────────────
function renderRedditSidebar() {
  const posts = state.articles
    .filter(a => a.sourceType === 'reddit')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8);
  document.getElementById('reddit-sidebar').innerHTML = posts.map(p =>
    `<div class="s-item" onclick="openModal(articleById('${sanitize(p.id)}'))">
      <div class="s-item-source">${sanitize(p.source)}</div>
      <div class="s-item-title">${sanitize(p.title.slice(0, 90))}${p.title.length > 90 ? '…' : ''}</div>
      <div class="s-item-meta">▲ ${(p.score||0).toLocaleString()} · 💬 ${(p.comments||0).toLocaleString()}</div>
    </div>`
  ).join('');
}

// ── HN sidebar ────────────────────────────────────────────────
function renderHNSidebar() {
  const posts = state.articles
    .filter(a => a.sourceType === 'hackernews')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8);
  document.getElementById('hn-sidebar').innerHTML = posts.map(p =>
    `<div class="s-item">
      <div class="s-item-title"><a href="${sanitize(p.url)}" target="_blank" rel="noopener">${sanitize(p.title.slice(0, 85))}${p.title.length > 85 ? '…' : ''}</a></div>
      <div class="s-item-meta">▲ ${(p.score||0).toLocaleString()} · <a href="${sanitize(p.hnLink)}" target="_blank">discuss</a></div>
    </div>`
  ).join('');
}

// ── Ticker ────────────────────────────────────────────────────
function renderTicker() {
  const titles = state.articles.slice(0, 30).map(a => a.title).join('  ·  ');
  const inner = document.getElementById('ticker-inner');
  // Duplicate for seamless loop
  inner.textContent = titles + '  ·  ' + titles;
}

// ── Article lookup ────────────────────────────────────────────
function articleById(id) { return state.articles.find(a => a.id === id); }
window.articleById = articleById;

// ── Modal ─────────────────────────────────────────────────────
function openModal(article) {
  if (!article) return;
  document.getElementById('modal-cat').textContent = catLabel(article.category);
  document.getElementById('modal-cat').style.background = catColor(article.category);
  document.getElementById('modal-src').textContent = article.source;
  document.getElementById('modal-title').textContent = article.title;
  document.getElementById('modal-date').textContent = article.publishedAt
    ? new Date(article.publishedAt).toLocaleString() : '';
  document.getElementById('modal-author').textContent = article.author ? `· ${article.author}` : '';
  document.getElementById('modal-desc').textContent = article.description || '';
  document.getElementById('modal-link').href = article.url;
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
  // Category tabs
  document.querySelectorAll('.cn-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.cn-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeCategory = btn.dataset.cat;
    applyFilters();
  }));

  // Source pills
  document.querySelectorAll('.src-pill').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.src-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeSource = btn.dataset.src;
    applyFilters();
  }));

  // Sort
  document.querySelectorAll('.sort-opt').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.sortBy = btn.dataset.sort;
    applyFilters();
  }));

  // Search
  let searchTimer;
  document.getElementById('search-input').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      applyFilters();
    }, 280);
  });

  // Load more
  document.getElementById('load-more-btn').addEventListener('click', () => {
    state.page++;
    renderGrid(true);
  });

  // Refresh
  document.getElementById('refresh-btn').addEventListener('click', fetchAllFeeds);

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // API key toggle
  const toggle = document.getElementById('api-key-toggle');
  const dropdown = document.getElementById('api-key-dropdown');
  toggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => dropdown?.classList.add('hidden'));
  dropdown?.addEventListener('click', e => e.stopPropagation());

  document.getElementById('save-key-btn').addEventListener('click', () => {
    const key = document.getElementById('newsapi-key').value.trim();
    if (key) {
      localStorage.setItem('newsterm_newsapi_key', key);
      CFG.NEWSAPI_KEY = key;
      dropdown.classList.add('hidden');
      fetchAllFeeds();
    }
  });

  document.getElementById('dismiss-notice')?.addEventListener('click', () => {
    dropdown.classList.add('hidden');
    localStorage.setItem('newsterm_dismissed_notice', '1');
  });

  // Auto-refresh
  const autoBox = document.getElementById('auto-refresh');
  let autoTimer;
  function setupAuto() {
    clearInterval(autoTimer);
    if (autoBox.checked) {
      autoTimer = setInterval(fetchAllFeeds, CFG.AUTO_REFRESH_MINUTES * 60 * 1000);
    }
  }
  autoBox.addEventListener('change', setupAuto);
  setupAuto();
}

// ── Boot ──────────────────────────────────────────────────────
function boot() {
  updateClock();
  setInterval(updateClock, 30000);
  // Pre-fill saved API key
  const savedKey = localStorage.getItem('newsterm_newsapi_key');
  if (savedKey) { CFG.NEWSAPI_KEY = savedKey; document.getElementById('newsapi-key').value = savedKey; }
  initEvents();
  fetchAllFeeds();
}

document.addEventListener('DOMContentLoaded', boot);

// ============================================================
//  NEWSTERM CONFIG — Edit this file to customize your feeds
// ============================================================

window.NEWSTERM_CONFIG = {

  // ── NewsAPI.org ──────────────────────────────────────────
  // Get a free key at https://newsapi.org/register
  // Free tier: 100 requests/day, no commercial use
  NEWSAPI_KEY: localStorage.getItem('newsterm_newsapi_key') || '',

  // ── RSS Feeds ────────────────────────────────────────────
  // Add or remove any RSS feed URL here.
  // Uses AllOrigins as a CORS proxy (free, no key needed).
  RSS_FEEDS: [
    // World / General
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',          label: 'BBC World',       category: 'world'    },
    { url: 'https://feeds.reuters.com/reuters/topNews',             label: 'Reuters Top',     category: 'world'    },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',label: 'NYT World',       category: 'world'    },
    { url: 'https://feeds.skynews.com/feeds/rss/world.xml',        label: 'Sky News World',  category: 'world'    },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml',            label: 'Al Jazeera',      category: 'world'    },

    // Finance
    { url: 'https://feeds.bloomberg.com/markets/news.rss',         label: 'Bloomberg Markets',category: 'finance'  },
    { url: 'https://feeds.reuters.com/reuters/businessNews',       label: 'Reuters Business', category: 'finance'  },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',label: 'CNBC Finance',    category: 'finance'  },
    { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',       label: 'WSJ Markets',     category: 'finance'  },
    { url: 'https://seekingalpha.com/market-news/index.xml',       label: 'Seeking Alpha',   category: 'finance'  },

    // Tech / AI
    { url: 'https://techcrunch.com/feed/',                         label: 'TechCrunch',      category: 'tech'     },
    { url: 'https://feeds.arstechnica.com/arstechnica/index',      label: 'Ars Technica',    category: 'tech'     },
    { url: 'https://www.wired.com/feed/rss',                       label: 'Wired',           category: 'tech'     },
    { url: 'https://www.theverge.com/rss/index.xml',               label: 'The Verge',       category: 'tech'     },
    { url: 'https://venturebeat.com/category/ai/feed/',            label: 'VentureBeat AI',  category: 'tech'     },
    { url: 'https://openai.com/blog/rss/',                         label: 'OpenAI Blog',     category: 'tech'     },

    // Military / Defense
    { url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', label: 'Defense News', category: 'military' },
    { url: 'https://www.military.com/rss-feeds/content',           label: 'Military.com',    category: 'military' },
    { url: 'https://breakingdefense.com/feed/',                    label: 'Breaking Defense', category: 'military' },
    { url: 'https://taskandpurpose.com/feed/',                     label: 'Task & Purpose',  category: 'military' },
    { url: 'https://www.janes.com/feeds/news',                     label: "Jane's Defence",  category: 'military' },

    // Politics
    { url: 'https://rss.politico.com/politics-news.xml',           label: 'Politico',        category: 'politics' },
    { url: 'https://thehill.com/rss/syndicator/19110',             label: 'The Hill',        category: 'politics' },
    { url: 'https://feeds.feedburner.com/thedailybeast/politics',  label: 'Daily Beast Pol', category: 'politics' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', label: 'NYT Politics', category: 'politics' },

    // Crypto
    { url: 'https://cointelegraph.com/rss',                        label: 'CoinTelegraph',   category: 'crypto'   },
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',      label: 'CoinDesk',        category: 'crypto'   },
    { url: 'https://decrypt.co/feed',                              label: 'Decrypt',         category: 'crypto'   },
    { url: 'https://cryptonews.com/news/feed/',                    label: 'CryptoNews',      category: 'crypto'   },

    // Sports
    { url: 'https://www.espn.com/espn/rss/news',                   label: 'ESPN',            category: 'sports'   },
    { url: 'https://feeds.bbci.co.uk/sport/rss.xml',               label: 'BBC Sport',       category: 'sports'   },
    { url: 'https://www.cbssports.com/rss/headlines/',             label: 'CBS Sports',      category: 'sports'   },
  ],

  // ── Reddit Subreddits ─────────────────────────────────────
  // Reddit exposes JSON feeds with no key required.
  REDDIT_FEEDS: [
    { sub: 'worldnews',        category: 'world'    },
    { sub: 'geopolitics',      category: 'world'    },
    { sub: 'finance',          category: 'finance'  },
    { sub: 'investing',        category: 'finance'  },
    { sub: 'stocks',           category: 'finance'  },
    { sub: 'technology',       category: 'tech'     },
    { sub: 'artificial',       category: 'tech'     },
    { sub: 'MachineLearning',  category: 'tech'     },
    { sub: 'military',         category: 'military' },
    { sub: 'CredibleDefense',  category: 'military' },
    { sub: 'geopolitics',      category: 'military' },
    { sub: 'politics',         category: 'politics' },
    { sub: 'neutralnews',      category: 'politics' },
    { sub: 'CryptoCurrency',   category: 'crypto'   },
    { sub: 'bitcoin',          category: 'crypto'   },
    { sub: 'ethereum',         category: 'crypto'   },
    { sub: 'sports',           category: 'sports'   },
    { sub: 'nfl',              category: 'sports'   },
    { sub: 'nba',              category: 'sports'   },
    { sub: 'soccer',           category: 'sports'   },
  ],

  // ── Hacker News ──────────────────────────────────────────
  // Uses the official Firebase API — no key needed.
  HN_STORY_COUNT: 30,  // How many top stories to fetch

  // ── NewsAPI.org queries ──────────────────────────────────
  // These queries will be sent to NewsAPI (only if key is set)
  NEWSAPI_QUERIES: [
    { q: 'stock market finance economy',     category: 'finance'  },
    { q: 'artificial intelligence technology',category: 'tech'    },
    { q: 'military defense war conflict',    category: 'military' },
    { q: 'world news international',         category: 'world'    },
    { q: 'politics government policy',       category: 'politics' },
    { q: 'bitcoin ethereum cryptocurrency',  category: 'crypto'   },
    { q: 'NFL NBA soccer sports',            category: 'sports'   },
  ],

  // ── Display settings ─────────────────────────────────────
  ARTICLES_PER_PAGE: 30,
  AUTO_REFRESH_MINUTES: 5,
  MAX_ARTICLES_CACHE: 500,

  // ── Twitter/X ────────────────────────────────────────────
  // Twitter API v2 requires paid access. Options:
  // 1. Add a Bearer Token below (needs Basic plan $100/mo)
  // 2. Use a self-hosted Nitter instance and add its RSS to RSS_FEEDS above
  TWITTER_BEARER_TOKEN: '',  // Leave empty if not using
  TWITTER_SEARCHES: [
    '#stocks OR #finance OR $SPY',
    '#AI OR #artificialintelligence',
    '#military OR #defense',
    '#worldnews OR #breakingnews',
    '#crypto OR #bitcoin',
  ],
};

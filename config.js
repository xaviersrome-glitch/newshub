// ============================================================
//  NewsHub CONFIG — Edit this file to customize your feeds
// ============================================================

window.NEWSTERM_CONFIG = {

  // ── API Keys ─────────────────────────────────────────────
  // NewsAPI.org: free at https://newsapi.org/register (100 req/day)
  NEWSAPI_KEY: localStorage.getItem('newshub_newsapi_key') || '',

  // Finnhub.io: free stock prices at https://finnhub.io/register
  FINNHUB_KEY: localStorage.getItem('newshub_finnhub_key') || '',

  // ── Stocks to track (uses Finnhub if key set, else Yahoo Finance fallback) ──
  STOCKS: [
    { symbol: 'SPY',  label: 'S&P 500' },
    { symbol: 'QQQ',  label: 'NASDAQ'  },
    { symbol: 'DIA',  label: 'DOW'     },
    { symbol: 'AAPL', label: 'Apple'   },
    { symbol: 'MSFT', label: 'Microsoft'},
    { symbol: 'NVDA', label: 'NVIDIA'  },
    { symbol: 'TSLA', label: 'Tesla'   },
    { symbol: 'AMZN', label: 'Amazon'  },
    { symbol: 'GOOGL',label: 'Google'  },
    { symbol: 'META', label: 'Meta'    },
  ],

  // ── Crypto to track (CoinGecko — completely free, no key needed) ──
  CRYPTO: [
    { id: 'bitcoin',   symbol: 'BTC', label: 'Bitcoin'  },
    { id: 'ethereum',  symbol: 'ETH', label: 'Ethereum' },
    { id: 'solana',    symbol: 'SOL', label: 'Solana'   },
    { id: 'binancecoin', symbol: 'BNB', label: 'BNB'    },
    { id: 'ripple',    symbol: 'XRP', label: 'XRP'      },
    { id: 'cardano',   symbol: 'ADA', label: 'Cardano'  },
    { id: 'dogecoin',  symbol: 'DOGE',label: 'Doge'     },
  ],

  // ── RSS Feeds ─────────────────────────────────────────────
  RSS_FEEDS: [

    // ── World ──
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',               label: 'BBC World',         category: 'world'    },
    { url: 'https://feeds.skynews.com/feeds/rss/world.xml',             label: 'Sky News',          category: 'world'    },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml',                  label: 'Al Jazeera',        category: 'world'    },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',    label: 'NYT World',         category: 'world'    },
    { url: 'https://feeds.reuters.com/reuters/topNews',                  label: 'Reuters Top',       category: 'world'    },
    { url: 'https://feeds.npr.org/1004/rss.xml',                         label: 'NPR World',         category: 'world'    },
    { url: 'https://www.theguardian.com/world/rss',                      label: 'The Guardian World',category: 'world'    },
    { url: 'https://rss.dw.com/rdf/rss-en-world',                        label: 'DW World',          category: 'world'    },
    { url: 'https://feeds.feedburner.com/ndtvnews-world-news',           label: 'NDTV World',        category: 'world'    },

    // ── Finance ──
    { url: 'https://feeds.reuters.com/reuters/businessNews',             label: 'Reuters Business',  category: 'finance'  },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',      label: 'CNBC Finance',      category: 'finance'  },
    { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',             label: 'WSJ Markets',       category: 'finance'  },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml',            label: 'BBC Business',      category: 'finance'  },
    { url: 'https://www.ft.com/rss/home',                                label: 'Financial Times',   category: 'finance'  },
    { url: 'https://www.marketwatch.com/rss/topstories',                 label: 'MarketWatch',       category: 'finance'  },
    { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', label: 'Yahoo Finance', category: 'finance' },
    { url: 'https://www.economist.com/finance-and-economics/rss.xml',    label: 'The Economist',     category: 'finance'  },
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines', label: 'MW Headlines', category: 'finance' },
    { url: 'https://feeds.bbci.co.uk/news/business/market-data/rss.xml',label: 'BBC Markets',       category: 'finance'  },

    // ── Tech / AI ──
    { url: 'https://techcrunch.com/feed/',                               label: 'TechCrunch',        category: 'tech'     },
    { url: 'https://feeds.arstechnica.com/arstechnica/index',            label: 'Ars Technica',      category: 'tech'     },
    { url: 'https://www.wired.com/feed/rss',                             label: 'Wired',             category: 'tech'     },
    { url: 'https://www.theverge.com/rss/index.xml',                     label: 'The Verge',         category: 'tech'     },
    { url: 'https://venturebeat.com/category/ai/feed/',                  label: 'VentureBeat AI',    category: 'tech'     },
    { url: 'https://feeds.feedburner.com/TechCrunchIT',                  label: 'TC Enterprise',     category: 'tech'     },
    { url: 'https://www.zdnet.com/news/rss.xml',                         label: 'ZDNet',             category: 'tech'     },
    { url: 'https://www.engadget.com/rss.xml',                           label: 'Engadget',          category: 'tech'     },
    { url: 'https://www.technologyreview.com/feed/',                     label: 'MIT Tech Review',   category: 'tech'     },
    { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',          label: 'BBC Tech',          category: 'tech'     },
    { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',   label: 'Ars Tech Lab',      category: 'tech'     },

    // ── Military / Defense ──
    { url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', label: 'Defense News', category: 'military' },
    { url: 'https://breakingdefense.com/feed/',                          label: 'Breaking Defense',  category: 'military' },
    { url: 'https://taskandpurpose.com/feed/',                           label: 'Task & Purpose',    category: 'military' },
    { url: 'https://www.military.com/rss-feeds/content',                 label: 'Military.com',      category: 'military' },
    { url: 'https://www.nationaldefensemagazine.org/rss/articles',       label: 'National Defense',  category: 'military' },
    { url: 'https://feeds.feedburner.com/WarIsBoring',                   label: 'War Is Boring',     category: 'military' },
    { url: 'https://www.defensedaily.com/feed/',                         label: 'Defense Daily',     category: 'military' },

    // ── Politics ──
    { url: 'https://rss.politico.com/politics-news.xml',                 label: 'Politico',          category: 'politics' },
    { url: 'https://thehill.com/rss/syndicator/19110',                   label: 'The Hill',          category: 'politics' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', label: 'NYT Politics',      category: 'politics' },
    { url: 'https://feeds.bbci.co.uk/news/politics/rss.xml',            label: 'BBC Politics',      category: 'politics' },
    { url: 'https://www.theguardian.com/politics/rss',                   label: 'Guardian Politics', category: 'politics' },
    { url: 'https://feeds.npr.org/1014/rss.xml',                         label: 'NPR Politics',      category: 'politics' },
    { url: 'https://feeds.reuters.com/Reuters/PoliticsNews',             label: 'Reuters Politics',  category: 'politics' },

    // ── Crypto ──
    { url: 'https://cointelegraph.com/rss',                              label: 'CoinTelegraph',     category: 'crypto'   },
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',            label: 'CoinDesk',          category: 'crypto'   },
    { url: 'https://decrypt.co/feed',                                    label: 'Decrypt',           category: 'crypto'   },
    { url: 'https://cryptonews.com/news/feed/',                          label: 'CryptoNews',        category: 'crypto'   },
    { url: 'https://bitcoinmagazine.com/.rss/full/',                     label: 'Bitcoin Magazine',  category: 'crypto'   },
    { url: 'https://www.theblock.co/rss.xml',                            label: 'The Block',         category: 'crypto'   },
    { url: 'https://feeds.feedburner.com/CryptoCoinsNews',               label: 'CCN',               category: 'crypto'   },

    // ── Sports ──
    { url: 'https://www.espn.com/espn/rss/news',                         label: 'ESPN',              category: 'sports'   },
    { url: 'https://feeds.bbci.co.uk/sport/rss.xml',                     label: 'BBC Sport',         category: 'sports'   },
    { url: 'https://www.cbssports.com/rss/headlines/',                   label: 'CBS Sports',        category: 'sports'   },
    { url: 'https://www.theguardian.com/sport/rss',                      label: 'Guardian Sport',    category: 'sports'   },
    { url: 'https://bleacherreport.com/articles/feed',                   label: 'Bleacher Report',   category: 'sports'   },
    { url: 'https://www.skysports.com/rss/12040',                        label: 'Sky Sports',        category: 'sports'   },
    { url: 'https://feeds.nbcsports.com/nbcsports/rss',                  label: 'NBC Sports',        category: 'sports'   },
  ],

  // ── Reddit ────────────────────────────────────────────────
  REDDIT_FEEDS: [
    { sub: 'worldnews',       category: 'world'    },
    { sub: 'geopolitics',     category: 'world'    },
    { sub: 'UpliftingNews',   category: 'world'    },
    { sub: 'finance',         category: 'finance'  },
    { sub: 'investing',       category: 'finance'  },
    { sub: 'stocks',          category: 'finance'  },
    { sub: 'wallstreetbets',  category: 'finance'  },
    { sub: 'technology',      category: 'tech'     },
    { sub: 'artificial',      category: 'tech'     },
    { sub: 'MachineLearning', category: 'tech'     },
    { sub: 'singularity',     category: 'tech'     },
    { sub: 'military',        category: 'military' },
    { sub: 'CredibleDefense', category: 'military' },
    { sub: 'politics',        category: 'politics' },
    { sub: 'neutralnews',     category: 'politics' },
    { sub: 'CryptoCurrency',  category: 'crypto'   },
    { sub: 'bitcoin',         category: 'crypto'   },
    { sub: 'ethereum',        category: 'crypto'   },
    { sub: 'sports',          category: 'sports'   },
    { sub: 'nfl',             category: 'sports'   },
    { sub: 'nba',             category: 'sports'   },
    { sub: 'soccer',          category: 'sports'   },
  ],

  // ── Hacker News ──────────────────────────────────────────
  HN_STORY_COUNT: 30,

  // ── NewsAPI queries (needs key) ──────────────────────────
  NEWSAPI_QUERIES: [
    { q: 'stock market Wall Street economy',  category: 'finance'  },
    { q: 'artificial intelligence technology',category: 'tech'     },
    { q: 'military defense army NATO war',    category: 'military' },
    { q: 'world news international breaking', category: 'world'    },
    { q: 'politics congress government White House', category: 'politics' },
    { q: 'bitcoin ethereum cryptocurrency',   category: 'crypto'   },
    { q: 'NFL NBA soccer football sports',    category: 'sports'   },
  ],

  // ── Display ──────────────────────────────────────────────
  ARTICLES_PER_PAGE: 30,
  AUTO_REFRESH_MINUTES: 5,
  MARKET_REFRESH_MINUTES: 2,

  // ── Image fallback sources (og:image scraping via proxy) ─
  // If a card has no thumbnail, we attempt to grab the OG image
  SCRAPE_OG_IMAGES: true,
};

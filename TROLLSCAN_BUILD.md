# TROLLSCAN — Complete Build Spec

A lightweight, feature-rich, VPS-deployable Solana memecoin meta-tracker with its own token. This document is the full build playbook: research, architecture, file structure, AI prompts to feed Cursor/Claude Code, deployment, and launch.

---

## 1. Market gap — what exists and what's missing

### The existing scanner landscape

| Tool | What it does | What it misses |
|---|---|---|
| **DexScreener** | General-purpose DEX pair tracking, charts, trending | No meta/family awareness; generic UI; no token of its own |
| **DEXTools** | Token scanner + trading analytics | Same — multi-chain, not memecoin-native; no narrative grouping |
| **RugCheck** | Safety scan: mint authority, freeze authority, LP locks, top-holder concentration | Purely defensive; doesn't help you find the next mover |
| **Bubblemaps** | Wallet-cluster visualization | Slow load, niche feature |
| **GMGN.ai** | Real-time launches, smart money flows, early-buyer behavior | Closed system, paid tiers, no community token, generic UI |
| **Birdeye** | Analytics dashboards, holder distribution, smart money | Multi-purpose; not memecoin-themed; no community angle |
| **Nansen / Solyzer** | Smart money / whale tracking | Expensive, institutional-grade, not meme-native |
| **Photon / BullX / Axiom / Trojan** | Trading bots — fast execution, limit orders, auto-buy | Trading tools, not discovery; no narrative layer |

### The unfilled lane

Every existing tool is **meta-agnostic**. They show you raw data — price, volume, holders, txns — and let you draw your own conclusions. None of them group tokens by *narrative theme* (TROLL family, HANTA outbreak, Goblin/AI, UFO disclosure, charity coins, etc.). None of them have an opinionated take on "what's the current meta and which tokens belong to it."

That's the TROLLSCAN niche: **opinionated meta-grouping**. The tagline isn't "look at all tokens" — it's "show me everything riding the current wave, ranked by family, freshness, and velocity."

Secondary unfilled lane: **none of these tools have a community token**. RugCheck, DEXScreener, etc. monetize via banner ads and paid boost slots. A community-owned scanner with token-gated features is open territory — same play GMGN.ai is moving toward but doing slowly.

### Differentiators we'll ship

1. **Meta detection** — auto-classify tokens into families (TROLL, HANTA, Goblin, AI, UFO, Charity, Brainrot) via regex + keyword + ticker similarity
2. **Family leaderboards** — switch tabs to see only TROLL-family or only AI-family tokens
3. **"Just launched" radar** — tokens under 2h old above $20k mcap, sorted by velocity
4. **Velocity score** — proprietary 0–100 score combining TXN growth, unique trader count, and price acceleration
5. **Whale flag** — tokens with recent buys >5 SOL flagged with a 🐋
6. **Telegram alerts** — premium tier ($TROLLSCAN holders) get push notifications
7. **Cyberpunk troll aesthetic** — same visual language as PROG but reskinned with Trollface ASCII

---

## 2. Architecture decisions

### Tech stack (final)

| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Node.js 20 LTS | Universal, stable, every VPS supports it |
| **Framework** | Next.js 15 (App Router) | Single deployment for frontend + API routes, zero config |
| **Styling** | Tailwind CSS v4 | No config, JIT, terminal aesthetic comes naturally |
| **State** | React Server Components + useSWR for client | Server-first, minimal JS shipped |
| **DB** | better-sqlite3 (file-backed SQLite) | No external DB server, zero ops, 50MB RAM, plenty fast |
| **Cache** | in-memory Map + 30s TTL | No Redis needed at this scale |
| **Real-time** | Server-Sent Events (SSE) | Simpler than WebSocket, works through every proxy |
| **Charts** | Lightweight Charts by TradingView (free) | Same engine dexscreener uses; CDN |
| **Process mgr** | PM2 | Standard Node deployment |
| **Reverse proxy** | Caddy | Auto HTTPS via Let's Encrypt, 5-line config |
| **Solana** | @solana/web3.js (for $TROLLSCAN token gate only) | Standard |

### Why not heavier?

- **No Redis** — at 100 RPS to dexscreener API and ~1000 cached tokens, in-memory Map handles it. If we hit scale, swap later.
- **No Postgres** — SQLite handles tens of millions of rows on a single VPS comfortably.
- **No WebSocket** — SSE is one-way (server → client), which is all we need for a leaderboard. Easier through nginx/caddy.
- **No microservices** — one Next.js app does everything. Deploy = `pnpm build && pm2 restart trollscan`.

### Public APIs we'll consume (all free, no auth)

| API | Endpoint | Use |
|---|---|---|
| DexScreener tokens | `https://api.dexscreener.com/latest/dex/tokens/{addresses}` | Bulk token info (up to 30 addrs at once) |
| DexScreener search | `https://api.dexscreener.com/latest/dex/search?q={query}` | Find tokens by name/ticker |
| DexScreener pairs | `https://api.dexscreener.com/latest/dex/pairs/solana/{pair}` | Single pair details |
| DexScreener boosts | `https://api.dexscreener.com/token-boosts/top/v1` | Top boosted tokens |
| Jupiter Lite Quote | `https://lite-api.jup.ag/swap/v1/quote` | For $TROLLSCAN swap UI |
| Helius RPC | `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY` | Solana RPC (free tier 100k req/day) |

**Rate limits to respect:**
- DexScreener: 300 req/min on the public endpoints. With our 30s poll interval and bulk fetch (30 tokens per call), we use ~6 req/min. Plenty of headroom.
- Pump.fun frontend-api: undocumented but ~60 req/min from a single IP. We'll cache aggressively.

---

## 3. Repository structure

```
trollscan/
├── package.json
├── pnpm-lock.yaml
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                  # SECRETS — never commit
├── .env.example                # template
├── README.md
├── ecosystem.config.cjs        # PM2 config
├── Caddyfile                   # reverse proxy config
├── data/
│   └── trollscan.db            # SQLite database file
├── public/
│   ├── trollface.svg
│   ├── favicon.ico
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + fonts + global CSS
│   │   ├── globals.css         # Tailwind + custom terminal styles
│   │   ├── page.tsx            # Main dashboard
│   │   ├── family/[name]/page.tsx  # /family/troll, /family/hanta, etc.
│   │   ├── token/[mint]/page.tsx   # Per-token detail page
│   │   ├── premium/page.tsx    # Premium tier landing (token-gated)
│   │   └── api/
│   │       ├── tokens/route.ts          # GET top tokens
│   │       ├── families/route.ts        # GET family list
│   │       ├── family/[name]/route.ts   # GET tokens in family
│   │       ├── token/[mint]/route.ts    # GET single token detail
│   │       ├── radar/route.ts           # GET fresh launches (<2h)
│   │       ├── alerts/route.ts          # POST register alert
│   │       └── stream/route.ts          # SSE live feed
│   ├── lib/
│   │   ├── db.ts                # SQLite init + queries
│   │   ├── families.ts          # Meta-detection rules engine
│   │   ├── dexscreener.ts       # API client
│   │   ├── pumpfun.ts           # API client
│   │   ├── velocity.ts          # Velocity score calc
│   │   ├── poller.ts            # Background poller (runs in instrumentation)
│   │   ├── cache.ts             # In-memory cache wrapper
│   │   └── solana.ts            # Token gate check (Helius)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── FamilyTabs.tsx
│   │   ├── TokenTable.tsx
│   │   ├── TokenRow.tsx
│   │   ├── RadarFeed.tsx
│   │   ├── WhaleFlag.tsx
│   │   ├── VelocityBadge.tsx
│   │   ├── Terminal.tsx        # CRT/terminal aesthetic wrapper
│   │   └── PremiumGate.tsx
│   ├── instrumentation.ts       # Boots the background poller
│   └── types.ts                 # Shared TS types
└── scripts/
    ├── seed-families.ts          # Seed initial family rules
    └── test-detection.ts         # Test the family classifier
```

**Line count target:** ~1,800 lines total across all files. Achievable in 6 hours with AI assistance.

---

## 4. Build prompts — copy these into Cursor/Claude Code

Feed these prompts in order. Each one builds on the previous. Use Claude 3.5 Sonnet or GPT-4o in Cursor's composer mode.

### Prompt 1 — Project scaffold

```
Create a new Next.js 15 project with the App Router, TypeScript, and Tailwind v4.
Use pnpm. Add these dependencies:
  - better-sqlite3 (latest)
  - @types/better-sqlite3 (dev)
  - swr (latest)
  - lightweight-charts (latest)
  - @solana/web3.js (latest)
  - clsx (latest)

Set up the folder structure exactly as defined in the build doc:
src/app, src/lib, src/components, scripts/, data/, public/

Add a .env.example with these vars:
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  HELIUS_API_KEY=
  TROLLSCAN_TOKEN_MINT=
  PREMIUM_MIN_BALANCE=10000
  POLL_INTERVAL_MS=30000

Create .gitignore to exclude .env.local, node_modules, .next, data/*.db.

Create README.md with one paragraph project description and dev/build/start commands.
```

### Prompt 2 — Database schema

```
In src/lib/db.ts, set up better-sqlite3 with these tables:

CREATE TABLE tokens (
  mint TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  pair_address TEXT,
  chain TEXT DEFAULT 'solana',
  dex TEXT,
  family TEXT,                    -- 'troll' | 'hanta' | 'goblin' | 'ai' | 'ufo' | 'charity' | 'brainrot' | 'other'
  age_seconds INTEGER,
  mcap REAL,
  liquidity REAL,
  volume_24h REAL,
  txns_24h INTEGER,
  price_change_1h REAL,
  price_change_6h REAL,
  price_change_24h REAL,
  velocity_score REAL DEFAULT 0,
  has_whale_flag INTEGER DEFAULT 0,
  image_url TEXT,
  website TEXT,
  twitter TEXT,
  telegram TEXT,
  first_seen_at INTEGER,
  last_updated_at INTEGER
);

CREATE TABLE family_rules (
  family TEXT NOT NULL,
  rule_type TEXT NOT NULL,        -- 'regex' | 'keyword' | 'mint_list'
  pattern TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  active INTEGER DEFAULT 1,
  PRIMARY KEY (family, pattern)
);

CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_wallet TEXT NOT NULL,
  trigger_type TEXT NOT NULL,     -- 'family_new' | 'mcap_threshold' | 'velocity_threshold'
  trigger_value TEXT NOT NULL,
  telegram_chat_id TEXT,
  created_at INTEGER,
  active INTEGER DEFAULT 1
);

CREATE INDEX idx_tokens_family ON tokens(family);
CREATE INDEX idx_tokens_mcap ON tokens(mcap DESC);
CREATE INDEX idx_tokens_velocity ON tokens(velocity_score DESC);
CREATE INDEX idx_tokens_age ON tokens(age_seconds);

Export functions:
  - getDb() -> singleton DB instance
  - upsertToken(token) -> void
  - getTopTokens(opts: { family?, limit?, sortBy? }) -> Token[]
  - getRadarTokens(maxAgeSeconds = 7200, minMcap = 20000) -> Token[]
  - getTokenByMint(mint) -> Token | null
  - getFamilyRules() -> Rule[]
  - addAlert(alert) -> number
```

### Prompt 3 — Family detection engine

```
In src/lib/families.ts, build the meta-classification engine.

Export an interface FamilyRule with shape:
{ family: string, ruleType: 'regex' | 'keyword' | 'mint_list', pattern: string, weight: number }

Export DEFAULT_RULES — a const array seeded with:

TROLL family:
  - regex: /troll/i  weight 1.0
  - regex: /tepe/i  weight 0.6  (troll pepe)
  - regex: /trollina/i  weight 0.8
  - regex: /totus/i  weight 0.7  (troll of the united states)
  - regex: /rage(guy)?/i  weight 0.5  (rage faces are troll-adjacent)

HANTA family:
  - regex: /hanta/i  weight 1.0
  - keyword: 'hantavirus'  weight 1.0
  - keyword: 'outbreak'  weight 0.4
  - keyword: 'lockdown'  weight 0.5

GOBLIN family:
  - regex: /goblin/i  weight 1.0
  - keyword: 'altman'  weight 0.6
  - keyword: 'openai'  weight 0.4

AI family:
  - regex: /^ai/i  weight 0.8
  - regex: /agent/i  weight 0.6
  - keyword: 'pippin'  weight 0.5
  - keyword: 'fartcoin'  weight 0.5
  - keyword: 'zerebro'  weight 0.5

UFO family:
  - regex: /uap|ufo|alien|disclosure|saucer|roswell|seti/i  weight 1.0

CHARITY family:
  - keyword: 'unicef'  weight 1.0
  - keyword: 'red cross'  weight 1.0
  - keyword: 'st jude'  weight 1.0
  - keyword: 'wish'  weight 0.7
  - keyword: 'pengu'  weight 0.6

BRAINROT family:
  - regex: /tung|sahur|skibidi|wojak|chud|buttcoin/i  weight 0.9

Export classifyToken(token: { ticker: string, name: string, description?: string }) -> { family: string, confidence: number }

Logic:
  - Concatenate ticker + name + description (lowercased)
  - For each family, sum weights of all matching rules
  - Return the family with highest score, or 'other' if no score > 0.5
  - Confidence = max_score / sum_of_all_scores

Export a function loadCustomRules(db) that reads family_rules from SQLite and merges with DEFAULT_RULES.
```

### Prompt 4 — DexScreener API client

```
In src/lib/dexscreener.ts, build a typed API client.

Export interfaces:
  DexScreenerPair (subset of their response):
    chainId, dexId, url, pairAddress, baseToken{address,name,symbol},
    priceUsd, txns{m5,h1,h6,h24}, volume{m5,h1,h6,h24}, priceChange{m5,h1,h6,h24},
    liquidity{usd}, fdv, marketCap, pairCreatedAt, info{imageUrl,websites,socials}

Export functions:

  fetchTokens(mints: string[]) -> Promise<DexScreenerPair[]>
    - Chunks into groups of 30 (their max)
    - Calls https://api.dexscreener.com/latest/dex/tokens/{addresses}
    - Aggregates results
    - Throws on non-200

  searchTokens(query: string) -> Promise<DexScreenerPair[]>
    - https://api.dexscreener.com/latest/dex/search?q={query}

  fetchPair(pairAddress: string) -> Promise<DexScreenerPair | null>
    - https://api.dexscreener.com/latest/dex/pairs/solana/{pair}

  fetchBoosted() -> Promise<DexScreenerPair[]>
    - https://api.dexscreener.com/token-boosts/top/v1

All fetches use AbortController with 10s timeout and User-Agent: 'TROLLSCAN/1.0'.

Include exponential backoff retry (3 attempts: 500ms, 1500ms, 4500ms) on network errors.
```

### Prompt 5 — Velocity score

```
In src/lib/velocity.ts, build the velocity scoring function.

Export computeVelocity(pair: DexScreenerPair) -> number (0–100):

Inputs from pair:
  - age_hours = (now - pair.pairCreatedAt) / 3600 / 1000
  - txns_1h = pair.txns.h1.buys + pair.txns.h1.sells
  - txns_6h = pair.txns.h6.buys + pair.txns.h6.sells
  - vol_1h = pair.volume.h1
  - vol_6h = pair.volume.h6
  - price_change_1h = pair.priceChange.h1
  - mcap = pair.marketCap

Algorithm:
  - txn_velocity = (txns_1h * 6) / max(txns_6h, 1) — ratio of recent to overall (1.0 = stable, >1 = accelerating)
  - vol_velocity = (vol_1h * 6) / max(vol_6h, 1)
  - price_momentum = clamp(price_change_1h / 10, -5, 5)
  - freshness_bonus = age_hours < 24 ? (24 - age_hours) / 24 * 20 : 0

  raw_score = (txn_velocity * 25) + (vol_velocity * 25) + (price_momentum * 5) + freshness_bonus
  return clamp(raw_score, 0, 100)

Also export hasWhaleFlag(pair) -> boolean:
  - Returns true if any single tx in last 1h was > 5 SOL
  - (We approximate: if vol_1h / txns_1h > 1 SOL avg AND txns_1h >= 3, flag)
```

### Prompt 6 — Background poller

```
In src/lib/poller.ts, build a background poller that runs every 30s.

Export startPoller() -> void:

Logic each cycle:
  1. Call fetchBoosted() to get the top trending Solana pairs
  2. Filter to chainId === 'solana' and marketCap >= 20000
  3. For each pair:
     a. Classify family via classifyToken()
     b. Compute velocity via computeVelocity()
     c. Check whale flag via hasWhaleFlag()
     d. upsertToken to SQLite
  4. Emit SSE event 'tokens.updated' with new IDs (handled by stream route)

Also poll every 5 minutes:
  - For each family with >0 tokens in DB, run searchTokens(familyName) to catch fresh launches dexscreener-trending might miss
  - Insert any not already in DB

Use setInterval with cleanup on process.exit. Log errors but never throw.

In src/instrumentation.ts:
  export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { startPoller } = await import('./lib/poller')
      startPoller()
    }
  }
```

### Prompt 7 — API routes

```
Build these Next.js API routes under src/app/api/:

GET /api/tokens?family={name}&sort={mcap|velocity|age}&limit={n}
  - Returns top N tokens, optionally filtered by family
  - Default: top 50 by velocity_score
  - Cache: 15s server-side

GET /api/family/[name]
  - Returns all tokens classified into that family
  - Sorted by velocity_score desc

GET /api/token/[mint]
  - Returns full token detail
  - Include 24h history snapshots if we add later

GET /api/radar
  - Returns tokens with age < 7200 seconds AND mcap >= 20000
  - Sorted by velocity_score desc

GET /api/stream (SSE)
  - Opens an SSE connection
  - On every poller tick, emits "event: tokens.updated\ndata: {...}\n\n"
  - Client uses EventSource() to listen
  - Send a heartbeat every 30s to keep connection alive

POST /api/alerts
  - Body: { wallet, trigger_type, trigger_value, telegram_chat_id }
  - Checks $TROLLSCAN balance via Helius
  - If balance >= PREMIUM_MIN_BALANCE, insert alert
  - Else 403 with { error: 'premium required' }

All routes return JSON. Errors return { error: string } with appropriate status.
```

### Prompt 8 — Frontend dashboard

```
Build the main dashboard at src/app/page.tsx using React Server Components where possible.

Layout:
  Header (logo, $TROLLSCAN price ticker, "Connect Wallet" button)
  Hero strip: 4 cards showing
    - Current top family (largest mcap aggregate)
    - Hottest token (highest velocity)
    - Fresh launches (count in last hour)
    - 24h volume across all tracked tokens
  Family tabs row: TROLL | HANTA | GOBLIN | AI | UFO | CHARITY | BRAINROT | ALL
  Main table:
    Columns: Rank | Token (image + ticker + name) | Family | Age | Mcap | Vol 24h | 1h % | 6h % | 24h % | Velocity | 🐋
    Row hover: highlight in green
    Click row -> navigate to /token/[mint]
  Sidebar (right): "Radar" feed — tokens under 2h old, mcap >$20k, scrolling
  Footer: "Powered by TROLLSCAN. Token: [mint]. Twitter: @trollscan."

Use Tailwind classes for a cyberpunk terminal aesthetic:
  - bg-black, text-green-400 base
  - font-mono throughout
  - border-green-900 on cards
  - Hover effects: scale, glow
  - "SECTION_001 // LIVE_DATA" style section headers

Use SWR with EventSource for live updates:
  - Hook into /api/stream
  - On tokens.updated event, mutate('/api/tokens')

Make it responsive: mobile breakpoint at 768px, table collapses to cards.
```

### Prompt 9 — Family pages and token detail

```
Build src/app/family/[name]/page.tsx:
  - Same layout as main dashboard but filtered to that family
  - Hero shows family-specific stats: total mcap, count, top mover, freshest launch
  - Family-themed accent color (TROLL = green, HANTA = orange-red, GOBLIN = purple, AI = cyan, UFO = silver)

Build src/app/token/[mint]/page.tsx:
  - Top: token logo, ticker, name, current price, mcap, 24h change
  - Lightweight Charts price chart (15m candles over 24h)
  - Stats grid: liquidity, FDV, holders (skip if not in DB), age, velocity score
  - Family badge + "view family" link
  - External links: dexscreener, solscan, twitter, telegram, website
  - "Set alert" button → opens modal (premium-gated)

Use SWR to fetch /api/token/[mint] with 30s refresh.
```

### Prompt 10 — Token gate via Solana

```
In src/lib/solana.ts, build the premium-gate check.

Export getTrollscanBalance(walletAddress: string) -> Promise<number>:
  - Use @solana/web3.js Connection to Helius RPC
  - Call getTokenAccountsByOwner with mint = TROLLSCAN_TOKEN_MINT
  - Sum balances across all token accounts
  - Return in UI units (divide by 10^decimals — assume 6 for pump.fun standard)

Export isPremium(walletAddress: string) -> Promise<boolean>:
  - Returns true if balance >= PREMIUM_MIN_BALANCE

Cache results for 60s in memory (Map<wallet, {balance, expiry}>).

In the frontend, add a "Connect Phantom" button using @solana/wallet-adapter-react if you want fully wired, or keep it simpler: just have user paste their wallet address into the alert modal and check from there.

For v1.0 simplicity, do the paste-address approach. Wallet adapter can come in v1.1.
```

### Prompt 11 — Styling polish

```
In src/app/globals.css, set up the terminal aesthetic:

@import "tailwindcss";

@theme {
  --color-troll-green: #00FF41;
  --color-troll-dim: #00AA2E;
  --color-troll-dark: #003D11;
  --color-troll-bg: #0a0e0a;
  --color-troll-warn: #FFB000;
  --color-troll-bad: #FF3030;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

body {
  background: var(--color-troll-bg);
  color: var(--color-troll-green);
  font-family: var(--font-family-mono);
}

/* CRT scanline effect */
.crt::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 255, 65, 0.03) 3px,
    rgba(0, 255, 65, 0.03) 4px
  );
  z-index: 1000;
}

/* Glow on hover */
.glow-hover:hover {
  text-shadow: 0 0 8px var(--color-troll-green);
}

/* Section headers — PROG-style */
.section-header {
  font-size: 0.75rem;
  color: var(--color-troll-dim);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-troll-dark);
  padding-bottom: 0.5rem;
}

Wrap <body> in <div className="crt"> for the scanline overlay.

Use the Trollface SVG as the logo. Generate or use a public-domain rendering — keep it ASCII-art style.
```

---

## 5. VPS deployment (Ubuntu 22.04 LTS)

Run these as your deploy user (not root, but with sudo):

```bash
# Install Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install Caddy (auto-HTTPS reverse proxy)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Clone your repo
cd /var/www
sudo mkdir trollscan && sudo chown $USER:$USER trollscan
cd trollscan
git clone YOUR_REPO_URL .

# Install deps + build
pnpm install
pnpm build

# Configure environment
cp .env.example .env.local
nano .env.local
# Fill in HELIUS_API_KEY, TROLLSCAN_TOKEN_MINT, etc.

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # follow the printed command to enable autostart

# Configure Caddy (replace YOURDOMAIN.com)
sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
trollscan.YOURDOMAIN.com {
    reverse_proxy localhost:3000
    encode gzip
}
EOF
sudo systemctl reload caddy
```

**ecosystem.config.cjs:**
```js
module.exports = {
  apps: [{
    name: 'trollscan',
    script: 'pnpm',
    args: 'start',
    cwd: '/var/www/trollscan',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Verify it's live:
```bash
pm2 status trollscan
pm2 logs trollscan --lines 50
curl https://trollscan.YOURDOMAIN.com/api/tokens
```

---

## 6. Token launch (after the app is live)

### Pre-launch (do these BEFORE deploying the token)

- [ ] App live at `https://trollscan.YOURDOMAIN.com`
- [ ] Twitter @trollscan_sol (or similar) created, bio + banner set
- [ ] Telegram channel `t.me/trollscan` created with first 5 posts queued
- [ ] One-line story locked: "TROLLSCAN — find the next pumping memecoin before it pumps."
- [ ] Hero screenshot saved for tweet imagery
- [ ] 12 launch tweets drafted in a doc, ordered by time

### Launch sequence (timed to ~02:00 WAT = US Sunday evening)

1. **T-0**: Deploy `$TROLLSCAN` token on pump.fun
   - Name: TROLLSCAN
   - Ticker: TROLLSCAN
   - Description: "The Bloomberg terminal for Solana memecoins. Trollface-themed. Premium features for $TROLLSCAN holders."
   - Image: Trollface chip-icon (PROG-style aesthetic)
   - Initial buy: 0.5–1 SOL to seed the curve

2. **T+0**: Update `.env.local` on VPS with the new mint address, restart PM2.

3. **T+1m**: Pinned tweet: hero screenshot + 1 sentence + chart + CA. Reply with link to live site.

4. **T+5m**: Manually fire 3 "alert" demos from your own wallet — show the SSE feed lighting up. Screenshot. Tweet "first alerts firing live."

5. **T+15m**: Thesis tweet — why dashboard tools failed traders (generic UIs, no narrative awareness) and why TROLLSCAN solves it.

6. **T+30m**: Ship update tweet — "v1.0 live. v1.1 incoming: Telegram bot."

7. **T+60m**: Demo a family page (TROLL family specifically). Screenshot the leaderboard with current TROLL derivatives. Tweet.

8. **T+90m**: Whale-flag demo. Find a token where someone just bought >5 SOL. Screenshot the 🐋 flag. Tweet.

9. **T+120m**: First milestone post — "X tokens scanned, Y families tracked, Z alerts armed."

10. **T+3h**: Drop the Telegram bot v1 — "shipped in 90 min, exactly as promised." (You actually pre-built this; you're just unveiling it.)

11. **T+6h**: Wrap the launch night with a recap thread. Show mcap, holder count, top tweets, top tokens scanned. Set the v1.1 roadmap publicly.

12. **T+24h**: Ship the wallet-adapter integration. Tweet "v1.1 — connect your Phantom directly. No more pasting addresses."

---

## 7. Feature roadmap

### v1.0 — ship in 6 hours (above spec)
- Live leaderboard
- Family classification
- Radar feed
- Velocity score
- Whale flag
- Token detail page
- Premium gate via paste-address

### v1.1 — within 48h of launch
- Telegram bot for alerts
- Wallet adapter integration (Phantom)
- Twitter shareable cards (screenshot leaderboard → tweet)
- Custom family creation (premium feature)

### v1.2 — within 1 week
- Smart-money tracking (top buyer wallets)
- Bubblemap-style holder visualization
- Historical chart for each token's velocity score
- Public API with paid tiers
- Webhook endpoint for custom integrations

### v1.3 — month 2
- Multi-chain (Base, Ethereum memecoins)
- AI-classified meta detection (replace regex rules with embedding similarity)
- Trading integration via Jupiter (buy/sell from the UI)
- Mobile app (React Native or PWA)

---

## 8. Cost breakdown (monthly)

| Item | Cost |
|---|---|
| VPS (Hetzner CX22 — 2 vCPU, 4GB RAM) | €4.59/mo |
| Domain | ~$12/yr |
| Helius RPC (free tier) | $0 |
| DexScreener API | $0 |
| Twitter API basic (if using for shareable cards) | $0–$100/mo (optional) |
| Telegram bot | $0 |
| **Total minimum** | **~€5/mo** |

You can run TROLLSCAN for under €60/year all-in.

---

## 9. Risks and known limitations

- **DexScreener rate limits** — if we exceed 300 req/min, our IP gets temp-banned. Mitigation: aggressive caching, exponential backoff.
- **Family detection false positives** — a token named "controller" matches regex /troll/. Mitigation: tune weights, add exclusion list.
- **Stale data** — 30s polling means our leaderboard lags behind reality by up to 30s. For most use cases, fine. For sniping, not.
- **No on-chain execution** — TROLLSCAN doesn't buy/sell for you. We link to dexscreener and solscan; trading happens elsewhere. Mitigation: add Jupiter swap embed in v1.2.
- **Single point of failure** — one VPS. If it goes down, the dashboard is dead. Mitigation: PM2 auto-restart handles most crashes; for HA, add a secondary instance behind a load balancer in v1.3.
- **Token gate is "honor system"** — anyone can paste anyone's wallet. Mitigation: in v1.1 require wallet signature via wallet-adapter.

---

## 10. Why this ships

You're not building a memecoin. You're building a **product** that has a memecoin attached. The product works on day one whether the token pumps or dumps. If $TROLLSCAN does $400K like PROG, great — you've got marketing budget. If it does $40K, also fine — you still have a working tool that you can use, evolve, and pivot the token narrative around.

That asymmetry — product survives token failure — is what makes this a builder play instead of a degen play.

---

**Last updated:** May 11, 2026
**Author:** TROLLSCAN team
**Reference architecture inspired by:** PROG (prog.market) — used as documentation only, no code lifted


export type FamilyName = string;

export type SortField = "mcap" | "velocity" | "age";

export interface Token {
  mint: string;
  ticker: string;
  name: string;
  pair_address: string | null;
  chain: string;
  dex: string | null;
  family: FamilyName;
  age_seconds: number;
  mcap: number;
  liquidity: number;
  volume_24h: number;
  txns_24h: number;
  price_change_1h: number;
  price_change_6h: number;
  price_change_24h: number;
  velocity_score: number;
  has_whale_flag: number;
  image_url: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  first_seen_at: number;
  last_updated_at: number;
}

export interface FamilyRule {
  family: string;
  rule_type: "regex" | "keyword" | "mint_list";
  pattern: string;
  weight: number;
  active: number;
}

export interface Alert {
  id?: number;
  user_wallet: string;
  trigger_type: "family_new" | "mcap_threshold" | "velocity_threshold";
  trigger_value: string;
  telegram_chat_id: string | null;
  created_at: number;
  active: number;
}

export interface ClassificationResult {
  family: FamilyName;
  confidence: number;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    websites?: { label: string; url: string }[];
    socials?: { type: string; url: string }[];
  };
}

export interface DexScreenerBoostToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon?: string;
  header?: string;
  description?: string;
  links?: { label: string; url: string }[];
}

export interface FamilyStats {
  name: string;
  token_count: number;
  total_mcap: number;
  total_volume: number;
  active_count: number;
  fresh_count: number;
  top_token: string | null;
  top_velocity: number;
  freshest_token: string | null;
  freshest_age: number | null;
  color?: string;
  label?: string;
}

export interface FamilyMeta {
  name: string;
  label: string;
  color: string;
  search_terms: string | null;
  source: string;
  auto_detected: number;
  created_at: number;
  active: number;
}

export const DEFAULT_FAMILY_COLOR = "#6B7280";

import { Connection, PublicKey } from "@solana/web3.js";

const balanceCache = new Map<string, { balance: number; expiresAt: number }>();
const CACHE_TTL = 60_000;

function getConnection(): Connection {
  const apiKey = process.env.HELIUS_API_KEY;
  const rpcUrl = apiKey
    ? `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
    : "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl);
}

export async function getTrollscanBalance(
  walletAddress: string
): Promise<number> {
  const cached = balanceCache.get(walletAddress);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.balance;
  }

  const mintStr = process.env.TROLLSCAN_TOKEN_MINT;
  if (!mintStr) return 999_999;

  try {
    const conn = getConnection();
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(mintStr);

    const accounts = await conn.getTokenAccountsByOwner(wallet, { mint });

    let total = 0;
    for (const { account } of accounts.value) {
      const data = account.data;
      const amount = data.readBigUInt64LE(64);
      total += Number(amount);
    }

    const decimals = 6;
    const balance = total / 10 ** decimals;

    balanceCache.set(walletAddress, {
      balance,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return balance;
  } catch (err) {
    console.error("[solana] Balance check failed:", err);
    return 0;
  }
}

export async function isPremium(walletAddress: string): Promise<boolean> {
  if (!process.env.TROLLSCAN_TOKEN_MINT) return true;
  const minBalance = parseInt(process.env.PREMIUM_MIN_BALANCE ?? "10000", 10);
  const balance = await getTrollscanBalance(walletAddress);
  return balance >= minBalance;
}

interface PriceData {
  floorPrice: number;
  marketCapInUsd: number;
  change24h: number;
}

interface TokenInfo {
  price: PriceData;
  ticker: string;
  decimal: number;
}

export class PriceOracle {
  private static readonly API_ENDPOINT = "https://api-v2-do.kas.fyi/token/krc20";
  private static readonly CACHE_DURATION = 30 * 1000; // 30 seconds
  
  private static priceCache: Map<string, { data: TokenInfo, timestamp: number }> = new Map();

  static async getTokenInfo(ticker: string): Promise<TokenInfo | null> {
    try {
      // Check cache first
      const cached = this.priceCache.get(ticker);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      // Fetch fresh data
      const response = await fetch(`${this.API_ENDPOINT}/${ticker}/info`);
      if (!response.ok) throw new Error('Failed to fetch token info');
      
      const data = await response.json();
      const tokenInfo: TokenInfo = {
        price: data.price,
        ticker: data.ticker,
        decimal: data.decimal
      };

      // Update cache
      this.priceCache.set(ticker, { data: tokenInfo, timestamp: Date.now() });
      return tokenInfo;
    } catch (error) {
      console.error('Failed to fetch token info:', error);
      return null;
    }
  }

  static async getPrice(ticker: string): Promise<number | null> {
    const tokenInfo = await this.getTokenInfo(ticker);
    return tokenInfo?.price.floorPrice || null;
  }

  static calculateUSDValue(amount: string, price: number, decimals: number): number {
    const parsedAmount = parseFloat(amount) / Math.pow(10, decimals);
    return parsedAmount * price;
  }
} 
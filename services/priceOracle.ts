interface PriceData {
  floorPrice: number;  // This is in KAS
  marketCapInUsd: number;
  change24h: number;
}

interface MarketData {
  priceInUsd: number;
  volumeInUsd: number;
}

interface TokenInfo {
  price: PriceData;
  marketsData: Array<{
    name: string;
    marketData: MarketData;
  }>;
  ticker: string;
  decimal: number;
}

export class PriceOracle {
  private static readonly API_ENDPOINT = "https://api-v2-do.kas.fyi/token/krc20";
  private static readonly CACHE_DURATION = 30 * 1000;
  private static priceCache: Map<string, { price: number, timestamp: number }> = new Map();

  static async getPrices(tickers: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    const tickersToFetch: string[] = [];

    // Check cache first
    for (const ticker of tickers) {
      const cached = this.priceCache.get(ticker);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        prices.set(ticker, cached.price);
      } else {
        tickersToFetch.push(ticker);
      }
    }

    if (tickersToFetch.length > 0) {
      const responses = await Promise.all(
        tickersToFetch.map(ticker =>
          fetch(`${this.API_ENDPOINT}/${ticker}/info`).then(res => res.json())
        )
      );

      responses.forEach((data, index) => {
        const ticker = tickersToFetch[index];
        const price = data?.marketsData?.[0]?.marketData?.priceInUsd || 0;
        this.priceCache.set(ticker, { price, timestamp: Date.now() });
        prices.set(ticker, price);
      });
    }

    return prices;
  }

  static async getPrice(ticker: string): Promise<number | null> {
    const prices = await this.getPrices([ticker]);
    return prices.get(ticker) || null;
  }

  static calculateUSDValue(amount: string, price: number, decimals: number): number {
    const parsedAmount = parseFloat(amount) / Math.pow(10, decimals);
    return parsedAmount * price;
  }

  static async getTokenInfo(ticker: string): Promise<TokenInfo | null> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/${ticker}/info`);
      if (!response.ok) throw new Error('Failed to fetch token info');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch token info:', error);
      return null;
    }
  }
} 
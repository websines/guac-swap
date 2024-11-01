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
  private static readonly CACHE_DURATION = 60 * 1000;
  private static priceCache: Map<string, { 
    price: number, 
    timestamp: number,
    marketsData?: any 
  }> = new Map();

  static async getPrices(tickers: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    const tickersToFetch = tickers.filter(ticker => {
      const cached = this.priceCache.get(ticker);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        prices.set(ticker, cached.price);
        return false;
      }
      return true;
    });

    if (tickersToFetch.length > 0) {
      // Batch fetch prices
      const responses = await Promise.all(
        tickersToFetch.map(ticker => this.getTokenInfo(ticker))
      );

      responses.forEach((data, index) => {
        if (data?.marketsData?.[0]?.marketData?.priceInUsd) {
          const price = data.marketsData[0].marketData.priceInUsd;
          prices.set(tickersToFetch[index], price);
        }
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
      // Check cache first
      const cached = this.priceCache.get(ticker);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return {
          price: { floorPrice: cached.price, marketCapInUsd: 0, change24h: 0 },
          marketsData: cached.marketsData || [],
          ticker,
          decimal: 8
        };
      }

      const response = await fetch(`${this.API_ENDPOINT}/${ticker}/info`);
      if (!response.ok) throw new Error('Failed to fetch token info');
      const data = await response.json();

      // Cache the full response
      this.priceCache.set(ticker, {
        price: data?.marketsData?.[0]?.marketData?.priceInUsd || 0,
        marketsData: data.marketsData,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch token info:', error);
      return null;
    }
  }
} 
import { PriceOracle } from "./priceOracle";

interface KRC20Token {
  symbol: string;
  name: string;
  balance?: string;
  logo?: string;
  decimals: number;
  price?: number;
}

export class TokenService {
  private static readonly API_ENDPOINT = "https://api-v2-do.kas.fyi/token/krc20/tokens";
  private static readonly PAGE_SIZE = 50;

  static async getTokensInfo(tickers: string[]): Promise<KRC20Token[]> {
    const tokens = await Promise.all(tickers.map(async (ticker) => {
      const tokenInfo = await PriceOracle.getTokenInfo(ticker);
      return {
        symbol: ticker,
        name: ticker,
        decimals: tokenInfo?.decimal || 8,
        logo: undefined,
        price: tokenInfo?.marketsData?.[0]?.marketData?.priceInUsd || 0
      };
    }));
    return tokens;
  }

  static async getTokens(page: number = 1, excludeTickers: string[] = []): Promise<{
    tokens: KRC20Token[];
    hasMore: boolean;
  }> {
    try {
      const response = await fetch(
        `${this.API_ENDPOINT}?limit=${this.PAGE_SIZE}&offset=${(page - 1) * this.PAGE_SIZE}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch tokens');
      const data = await response.json();
      
      // Filter out wallet tokens and fetch prices for remaining
      const filteredTokens = data.results.filter(
        (token: any) => !excludeTickers.includes(token.ticker)
      );

      const tokens = await Promise.all(filteredTokens.map(async (token: any) => {
        const tokenInfo = await PriceOracle.getTokenInfo(token.ticker);
        return {
          symbol: token.ticker,
          name: token.ticker,
          decimals: token.decimal || 8,
          logo: token.iconUrl || undefined,
          price: tokenInfo?.marketsData?.[0]?.marketData?.priceInUsd || 0
        };
      }));

      return {
        tokens,
        hasMore: data.total > page * this.PAGE_SIZE
      };
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      return { tokens: [], hasMore: false };
    }
  }

  static sortTokensByBalance(tokens: KRC20Token[], walletTokens: KRC20Token[]): KRC20Token[] {
    return [...tokens].sort((a, b) => {
      const aBalance = walletTokens.find(t => t.symbol === a.symbol);
      const bBalance = walletTokens.find(t => t.symbol === b.symbol);
      
      if (aBalance && !bBalance) return -1;
      if (!aBalance && bBalance) return 1;
      
      // If both have balance, sort by USD value
      if (aBalance && bBalance && a.price && b.price) {
        const aValue = parseFloat(aBalance.balance!) * a.price;
        const bValue = parseFloat(bBalance.balance!) * b.price;
        return bValue - aValue; // Higher value first
      }
      
      return 0;
    });
  }
} 
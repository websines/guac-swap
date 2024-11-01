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
  // private static readonly API_ENDPOINT = "https://api.kasplex.org/v1/krc20/tokenlist";
  private static readonly API_ENDPOINT = "https://api-v2-do.kas.fyi/token/krc20/tokens";
  private static tokenList: KRC20Token[] = [];

  static async getAllTokens(): Promise<KRC20Token[]> {
    try {
      if (this.tokenList.length > 0) return this.tokenList;
      
      const response = await fetch(this.API_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch tokens');
      
      const data = await response.json();
      
      // Check for results array
      if (!data || !data.results || !Array.isArray(data.results)) {
        console.error('Invalid data structure:', data);
        return [];
      }
      
      this.tokenList = await Promise.all(data.results.map(async (token: any) => {
        const price = await PriceOracle.getPrice(token.ticker);
        return {
          symbol: token.ticker,
          name: token.ticker,
          decimals: token.decimal || 8,
          logo: token.iconUrl || null,
          price: price || 0
        };
      }));
      
      return this.tokenList;
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      return [];
    }
  }

  static sortTokensByBalance(tokens: KRC20Token[], walletTokens: KRC20Token[]): KRC20Token[] {
    return tokens.sort((a, b) => {
      const aBalance = walletTokens.find(t => t.symbol === a.symbol);
      const bBalance = walletTokens.find(t => t.symbol === b.symbol);
      
      if (aBalance && !bBalance) return -1;
      if (!aBalance && bBalance) return 1;
      return 0;
    });
  }

//   static calculateUSDValue(balance: string, price: number, decimals: number): number {
//     console.log('USD Calculation Input:', {
//       rawBalance: balance,
//       price: price,
//       decimals: decimals
//     });

//     const balanceNumber = parseFloat(balance) / Math.pow(10, decimals);
    
//     console.log('Balance Conversion:', {
//       balanceAsNumber: parseFloat(balance),
//       divisor: Math.pow(10, decimals),
//       convertedBalance: balanceNumber
//     });

//     const usdValue = balanceNumber * price;
    
//     console.log('Final Calculation:', {
//       convertedBalance: balanceNumber,
//       price: price,
//       usdValue: usdValue
//     });
    
//     return usdValue;
//   }
} 
interface SwapOrder {
  orderId: string;
  maker: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  signature: string;
  publicKey: string;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  createdAt: number;
  expiresAt: number;
}

export class SwapService {
  private static orders: SwapOrder[] = [];
  
  static createOrder(orderData: Omit<SwapOrder, 'orderId' | 'status' | 'createdAt' | 'expiresAt'>): SwapOrder {
    const order: SwapOrder = {
      ...orderData,
      orderId: crypto.randomUUID(),
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes expiry
    };
    
    this.orders.push(order);
    return order;
  }

  static getOrders(fromToken: string, toToken: string): SwapOrder[] {
    return this.orders.filter(order => 
      order.status === 'pending' &&
      order.fromToken === fromToken &&
      order.toToken === toToken &&
      order.expiresAt > Date.now()
    );
  }

  static async matchOrder(takerOrder: SwapOrder): Promise<SwapOrder | null> {
    const matchingOrders = this.getOrders(
      takerOrder.toToken,
      takerOrder.fromToken
    );

    // Find best matching order based on price
    const match = matchingOrders[0]; // Simplified matching logic
    if (match) {
      match.status = 'matched';
      takerOrder.status = 'matched';
    }

    return match;
  }
} 
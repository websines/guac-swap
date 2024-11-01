"use client";
import { isKaswareInstalled } from "@/utils/wallet";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface Token {
  symbol: string;
  balance: string;
  name: string;
  decimals: number;
}

interface WalletContextType {
  isConnected: boolean;
  account: string | null;
  tokens: Token[];
  isSwapping: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signSwapTransaction: (swap: SwapTransaction) => Promise<{
    orderId: string;
    maker: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    signature: string;
    publicKey: string;
    status: "pending" | "matched" | "completed" | "cancelled";
    createdAt: number;
    expiresAt: number;
  }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface SwapTransaction {
  fromToken: string;
  toToken: string;
  amount: string;
  toAddress: string;
  expectedAmount: string;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);

  const fetchTokenBalances = async () => {
    try {
      const krc20Balances = await window.kasware.getKRC20Balance();
      const kasBalance = await window.kasware.getBalance();

      const formattedTokens = [
        {
          symbol: "KAS",
          name: "KAS",
          decimals: 8,
          balance: (kasBalance.total / 100000000).toString(), // Convert from sompi to KAS
        },
        ...krc20Balances.map((token: any) => ({
          symbol: token.tick,
          name: token.tick,
          decimals: parseInt(token.dec),
          balance: (
            parseInt(token.balance) / Math.pow(10, parseInt(token.dec))
          ).toString(),
        })),
      ];

      setTokens(formattedTokens);
    } catch (error) {
      console.error("Failed to fetch token balances:", error);
    }
  };

  const connect = async () => {
    try {
      if (!isKaswareInstalled()) {
        window.open(
          "https://chrome.google.com/webstore/detail/kasware-wallet/...",
          "_blank"
        );
        return;
      }

      const accounts = await window.kasware.requestAccounts();
      setAccount(accounts[0]);
      setIsConnected(true);
      await fetchTokenBalances();
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const disconnect = async () => {
    try {
      const origin = window.location.origin;
      await window.kasware.disconnect(origin);
      setAccount(null);
      setIsConnected(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  useEffect(() => {
    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        setAccount(null);
        setIsConnected(false);
      }
    };

    if (isKaswareInstalled()) {
      window.kasware.on("accountsChanged", handleAccountsChanged);

      // Check if already connected
      window.kasware
        .getAccounts()
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        })
        .catch(console.error);
    }

    return () => {
      if (isKaswareInstalled()) {
        window.kasware.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  const signSwapTransaction = async (swap: SwapTransaction) => {
    try {
      setIsSwapping(true);
      const publicKey = await window.kasware.getPublicKey();

      // Create and sign swap intent message
      const swapMessage = JSON.stringify({
        action: "swap",
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        fromAmount: swap.amount,
        toAmount: swap.expectedAmount,
        timestamp: Date.now(),
      });

      const signature = await window.kasware.signMessage(swapMessage);

      // Return the order details directly instead of using SwapService
      return {
        orderId: Date.now().toString(),
        maker: account!,
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        fromAmount: swap.amount,
        toAmount: swap.expectedAmount,
        signature,
        publicKey,
        status: "pending" as const,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000, // 1 hour expiry
      };
    } catch (error) {
      console.error("Swap signing failed:", error);
      throw error;
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        account,
        tokens,
        isSwapping,
        connect,
        disconnect,
        signSwapTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

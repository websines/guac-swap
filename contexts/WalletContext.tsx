"use client";
import { isKaswareInstalled } from "@/utils/wallet";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { SwapService, SwapOrder } from "@/services/swapService";

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
  signSwapTransaction: (swap: SwapTransaction) => Promise<SwapOrder>;
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

  const signSwapTransaction = async (
    swap: SwapTransaction
  ): Promise<SwapOrder> => {
    if (!window.kasware) throw new Error("Kasware wallet not found");

    try {
      const psktData = {
        tick: swap.fromToken,
        amt: parseFloat(swap.amount).toString(),
        op: "transfer",
      };

      const signature = await window.kasware.signKRC20Transaction(
        JSON.stringify(psktData),
        1, // type for transfer
        swap.toAddress
      );
      const publicKey = await window.kasware.getPublicKey();

      return SwapService.createOrder({
        maker: account!,
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        fromAmount: swap.amount,
        toAmount: swap.expectedAmount,
        signature,
        publicKey,
      });
    } catch (error) {
      console.error("Failed to sign swap transaction:", error);
      throw error;
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

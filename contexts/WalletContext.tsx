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
    txid: string;
    signature: string;
    publicKey: string;
    swapMessage: string;
  }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface SwapTransaction {
  fromToken: string;
  toToken: string;
  amount: string;
  toAddress: string;
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
          balance: (kasBalance.total / 100000000).toString(), // Convert from sompi to KAS
        },
        ...krc20Balances.map((token: any) => ({
          symbol: token.tick,
          balance: token.balance,
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

      // Create KRC-20 transfer JSON
      const transferJson = {
        p: "krc-20",
        op: "transfer",
        tick: swap.fromToken,
        amt: swap.amount,
        to: swap.toAddress,
      };

      // Sign the transfer transaction
      const txid = await window.kasware.signKRC20Transaction(
        JSON.stringify(transferJson),
        4,
        swap.toAddress
      );

      // Create and sign swap intent message
      const swapMessage = JSON.stringify({
        action: "swap",
        fromTx: txid,
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        amount: swap.amount,
        timestamp: Date.now(),
      });

      const signature = await window.kasware.signMessage(swapMessage);

      return {
        txid,
        signature,
        publicKey,
        swapMessage,
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

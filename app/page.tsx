"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownUp, Menu, Settings } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletSidebar } from "@/components/wallet/WalletSidebar";
import { useState } from "react";
import { PriceOracle } from "@/services/priceOracle";
import { TokenSelectModal } from "@/components/ticker-modal/TokenSelectModal";
import { PriceDisplay } from "@/components/PriceDisplay";

export default function Home() {
  const {
    isConnected,
    account,
    tokens,
    connect,
    disconnect,
    signSwapTransaction,
    isSwapping,
  } = useWallet();
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromModalOpen, setIsFromModalOpen] = useState(false);
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);

  const handleFromTokenChange = (value: string) => {
    setFromToken(value);
    const token = tokens.find((t) => t.symbol === value);
    setFromAmount(token?.balance || "0");
  };

  const handleToTokenChange = (value: string) => {
    setToToken(value);
    const token = tokens.find((t) => t.symbol === value);
    setToAmount(token?.balance || "0");
  };

  const handleFromAmountChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const value = e.target.value;
      setIsCalculating(true);
      setFromAmount(value);

      if (!fromToken || !toToken || !value || isNaN(parseFloat(value))) {
        setToAmount("");
        setEstimatedOutput(null);
        return;
      }

      // Get prices from PriceOracle
      const [fromTokenInfo, toTokenInfo] = await Promise.all([
        PriceOracle.getTokenInfo(fromToken),
        PriceOracle.getTokenInfo(toToken),
      ]);

      if (
        !fromTokenInfo?.price?.floorPrice ||
        !toTokenInfo?.price?.floorPrice
      ) {
        console.error("Could not fetch token prices");
        return;
      }

      // Calculate USD values
      const fromTokenUsdValue =
        parseFloat(value) * fromTokenInfo.price.floorPrice;
      const estimatedAmount = (
        fromTokenUsdValue / toTokenInfo.price.floorPrice
      ).toFixed(8);

      console.log("Price calculation:", {
        fromToken,
        toToken,
        fromPrice: fromTokenInfo.price.floorPrice,
        toPrice: toTokenInfo.price.floorPrice,
        inputAmount: value,
        usdValue: fromTokenUsdValue,
        estimatedOutput: estimatedAmount,
      });

      setToAmount(estimatedAmount);
      setEstimatedOutput(estimatedAmount);
    } catch (error) {
      console.error("Failed to calculate price:", error);
      setEstimatedOutput(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSwap = async () => {
    if (!isConnected || !fromToken || !toToken || !fromAmount) return;
    if (priceImpact > 0.05) {
      // Show high price impact warning
      const confirm = window.confirm(
        `High price impact of ${(priceImpact * 100).toFixed(
          2
        )}%. Do you want to continue?`
      );
      if (!confirm) return;
    }

    try {
      const swapDetails = {
        fromToken,
        toToken,
        amount: fromAmount,
        toAddress: "kaspa:qr7ht6pzrd2m9s4c0x4ry6e8qkf3zrvwmcpxrlxajy",
      };

      const result = await signSwapTransaction(swapDetails);

      // Send to backend/contract
      // await submitSwapToBackend(result);

      // Reset form
      setFromAmount("");
      setToAmount("");
      setPriceImpact(0);
      // Show success toast
    } catch (error) {
      console.error("Swap failed:", error);
      // Show error toast
    }
  };

  // Add price impact warning
  const getPriceImpactColor = () => {
    if (priceImpact < 0.01) return "text-green-600";
    if (priceImpact < 0.05) return "text-yellow-600";
    return "text-red-600";
  };

  // Add token data for the modal
  const availableTokens = tokens.map((token) => ({
    ...token,
    name: token.name,
    decimals: token.decimals,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      <header className="flex items-center justify-between p-4 border-b border-green-200 bg-white">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-2xl font-bold text-green-700 flex items-center"
          >
            <svg
              className="w-8 h-8 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                fill="#4CAF50"
              />
              <path
                d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                fill="#2E7D32"
              />
            </svg>
            GUAC-SWAP
          </Link>
          <nav className="hidden md:flex space-x-4">
            <Link
              href="/swap"
              className="text-sm font-medium text-green-700 hover:text-green-500"
            >
              Swap
            </Link>
            <Link
              href="/explore"
              className="text-sm font-medium text-green-700 hover:text-green-500"
            >
              Explore
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            className="border-green-500 text-green-700 hover:bg-green-100"
            onClick={isConnected ? disconnect : connect}
          >
            {isConnected
              ? `${account?.slice(0, 6)}...${account?.slice(-4)}`
              : "Connect Wallet"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-green-700 md:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg border-green-200">
          <CardHeader className="border-b border-green-100">
            <CardTitle className="flex justify-between items-center text-green-700">
              <span>Swap</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-green-700 hover:bg-green-100"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label
                    htmlFor="from-amount"
                    className="text-sm font-medium text-green-700"
                  >
                    From
                  </label>
                  <span className="text-sm text-green-600">
                    Balance:{" "}
                    {fromToken
                      ? tokens.find((t) => t.symbol === fromToken)?.balance ||
                        "0"
                      : "0"}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="from-amount"
                    type="number"
                    placeholder="0"
                    value={fromAmount}
                    onChange={handleFromAmountChange}
                    className="flex-grow border-green-300 focus:ring-green-500 focus:border-green-500"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsFromModalOpen(true)}
                    className="w-[120px] border-green-300 focus:ring-green-500 focus:border-green-500"
                  >
                    {fromToken || "Select token"}
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-green-700 hover:bg-green-100"
                  onClick={() => {
                    const tempToken = fromToken;
                    const tempAmount = fromAmount;
                    setFromToken(toToken);
                    setFromAmount(toAmount);
                    setToToken(tempToken);
                    setToAmount(tempAmount);
                  }}
                >
                  <ArrowDownUp className="h-4 w-4" />
                  <span className="sr-only">Swap direction</span>
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label
                    htmlFor="to-amount"
                    className="text-sm font-medium text-green-700"
                  >
                    To
                  </label>
                  <span className="text-sm text-green-600">
                    Balance:{" "}
                    {toToken
                      ? tokens.find((t) => t.symbol === toToken)?.balance || "0"
                      : "0"}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="to-amount"
                    type="number"
                    placeholder="0"
                    value={toAmount}
                    readOnly
                    className="flex-grow border-green-300 focus:ring-green-500 focus:border-green-500"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsToModalOpen(true)}
                    className="w-[120px] border-green-300 focus:ring-green-500 focus:border-green-500"
                  >
                    {toToken || "Select token"}
                  </Button>
                </div>
              </div>
              <PriceDisplay
                fromToken={fromToken}
                toToken={toToken}
                fromAmount={fromAmount}
                toAmount={toAmount}
              />
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSwap}
                disabled={
                  !isConnected ||
                  isSwapping ||
                  !fromToken ||
                  !toToken ||
                  !fromAmount
                }
              >
                {isSwapping ? "Swapping..." : "Swap"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* <footer className="border-t border-green-200 p-4 text-center text-sm text-green-600 bg-white mt-auto">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4">
          <Link href="/about" className="hover:text-green-500">
            About
          </Link>
          <Link href="/help" className="hover:text-green-500">
            Help Center
          </Link>
          <Link href="/developers" className="hover:text-green-500">
            Developers
          </Link>
          <Link href="/governance" className="hover:text-green-500">
            Governance
          </Link>
          <Link href="/terms" className="hover:text-green-500">
            Terms of Service
          </Link>
        </div>
      </footer> */}

      <TokenSelectModal
        isOpen={isFromModalOpen}
        onClose={() => setIsFromModalOpen(false)}
        onSelect={(token) => {
          setFromToken(token.symbol);
          setIsFromModalOpen(false);
        }}
        tokens={availableTokens}
      />

      <TokenSelectModal
        isOpen={isToModalOpen}
        onClose={() => setIsToModalOpen(false)}
        onSelect={(token) => {
          setToToken(token.symbol);
          setIsToModalOpen(false);
        }}
        tokens={availableTokens}
      />

      {isConnected && (
        <WalletSidebar
          address={account!}
          tokens={tokens}
          onDisconnect={disconnect}
        />
      )}
    </div>
  );
}

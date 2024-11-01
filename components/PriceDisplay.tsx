import { useEffect, useState } from "react";
import { PriceOracle } from "@/services/priceOracle";

interface PriceDisplayProps {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
}

export function PriceDisplay({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
}: PriceDisplayProps) {
  const [countdown, setCountdown] = useState(30);
  const [fromPrice, setFromPrice] = useState<number | null>(null);
  const [toPrice, setToPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      if (fromToken && toToken) {
        const [newFromPrice, newToPrice] = await Promise.all([
          PriceOracle.getPrice(fromToken),
          PriceOracle.getPrice(toToken),
        ]);
        setFromPrice(newFromPrice);
        setToPrice(newToPrice);
        setCountdown(30);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [fromToken, toToken]);

  if (!fromPrice || !toPrice || !fromToken || !toToken) return null;

  const rate = toPrice / fromPrice;

  return (
    <div className="mt-4 p-4 rounded-lg bg-green-50 space-y-2">
      <div className="flex justify-between text-sm text-green-700">
        <span>
          1 {fromToken} = {rate.toFixed(6)} {toToken}
        </span>
        <span>Refreshing in {countdown}s</span>
      </div>
      {fromAmount && toAmount && (
        <div className="text-sm text-green-600">
          ≈ ${(parseFloat(fromAmount) * fromPrice).toFixed(2)} → $
          {(parseFloat(toAmount) * toPrice).toFixed(2)}
        </div>
      )}
    </div>
  );
}

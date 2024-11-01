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
  const [prices, setPrices] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const fetchPrices = async () => {
      if (fromToken && toToken) {
        const newPrices = await PriceOracle.getPrices([fromToken, toToken]);
        setPrices(newPrices);
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

  if (!prices.has(fromToken) || !prices.has(toToken)) return null;

  const fromPrice = prices.get(fromToken)!;
  const toPrice = prices.get(toToken)!;
  const rate = fromPrice / toPrice;

  return (
    <div className="mt-4 p-4 rounded-lg bg-green-50 space-y-2">
      <div className="flex justify-between text-sm text-green-700">
        <span>
          1 {fromToken} = {rate.toFixed(8)} {toToken}
        </span>
        <span>Refreshing in {countdown}s</span>
      </div>
      {fromAmount && toAmount && (
        <div className="text-sm text-green-600">
          ≈ ${(parseFloat(fromAmount) * fromPrice).toFixed(4)} → $
          {(parseFloat(toAmount) * toPrice).toFixed(4)}
        </div>
      )}
    </div>
  );
}

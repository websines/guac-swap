"use client";
import { useEffect, useState } from "react";
import { TokenService } from "@/services/tokenService";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { PriceOracle } from "@/services/priceOracle";

type KRC20Token = {
  symbol: string;
  name: string;
  balance?: string;
  logo?: string;
  decimals: number;
  price?: number;
};

type TokenSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: KRC20Token) => void;
  tokens: KRC20Token[];
};

export function TokenSelectModal({
  isOpen,
  onClose,
  onSelect,
  tokens: walletTokens = [],
}: TokenSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allTokens, setAllTokens] = useState<KRC20Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useWallet();

  useEffect(() => {
    const loadTokens = async () => {
      setIsLoading(true);
      const tokens = await TokenService.getAllTokens();
      const sortedTokens = TokenService.sortTokensByBalance(
        tokens,
        walletTokens
      );
      setAllTokens(sortedTokens);
      setIsLoading(false);
    };

    loadTokens();
  }, [walletTokens]);

  const filteredTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderToken = (token: KRC20Token) => {
    const walletToken = walletTokens.find((t) => t.symbol === token.symbol);
    const usdValue =
      walletToken && token.price
        ? PriceOracle.calculateUSDValue(
            walletToken.balance!,
            token.price,
            token.decimals
          )
        : null;

    return (
      <Button
        key={token.symbol}
        variant="ghost"
        className="w-full justify-start font-normal"
        onClick={() => {
          onSelect(token);
          onClose();
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {token.logo && (
              <img
                src={token.logo}
                alt={token.name}
                className="w-6 h-6 mr-2 rounded-full"
              />
            )}
            <div>
              <span className="font-medium">{token.symbol}</span>
              <span className="ml-2 text-gray-500">
                ${token.price?.toFixed(4) || "0.00"}
              </span>
            </div>
          </div>
          {walletToken && (
            <div className="text-sm text-gray-500 text-right">
              <div>Balance: {walletToken.balance}</div>
              {usdValue && <div>${usdValue.toFixed(2)}</div>}
            </div>
          )}
        </div>
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name or symbol"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4"
            />
          </div>
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <span className="text-gray-500">Loading tokens...</span>
              </div>
            ) : filteredTokens.length > 0 ? (
              filteredTokens.map(renderToken)
            ) : (
              <div className="text-center py-4 text-gray-500">
                No tokens found
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
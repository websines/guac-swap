import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  Wallet,
  ExternalLink,
  Copy,
  LogOut,
  X,
} from "lucide-react";

type Token = {
  symbol: string;
  balance: string;
};

type WalletSidebarProps = {
  address: string;
  tokens?: Token[];
  onDisconnect: () => void;
};

export function WalletSidebar({
  address,
  tokens,
  onDisconnect,
}: WalletSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    // You might want to add a toast notification here
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`fixed ${
        isMobile ? "inset-0 z-50" : "right-0 top-16 bottom-0"
      } bg-white border-l border-green-200 shadow-lg transition-all duration-300 ease-in-out`}
      style={{
        width: isMobile ? "100%" : "320px",
        transform: isOpen
          ? "translateX(0)"
          : isMobile
          ? "translateY(100%)"
          : "translateX(100%)",
      }}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className={`${
            isMobile ? "hidden" : "absolute -left-10 top-4"
          } p-2 bg-white border border-green-200 rounded-l-md`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronRight
            className={`h-6 w-6 text-green-600 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <span className="sr-only">
            {isOpen ? "Close" : "Open"} wallet sidebar
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-green-700 flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Wallet
          </h2>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="text-green-700 hover:bg-green-100"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          )}
        </div>
        <div className="bg-green-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-green-600 mb-2">Connected with Wallet</p>
          <p className="text-sm font-medium text-green-700 mb-2 break-all">
            {address}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-green-700 hover:bg-green-100"
              onClick={copyAddress}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-green-700 hover:bg-green-100"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
        <h3 className="text-md font-semibold text-green-700 mb-2">Tokens</h3>
        <ul className="space-y-2 mb-4">
          {tokens && tokens.length > 0 ? (
            tokens.map((token, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-2 bg-green-50 rounded"
              >
                <span className="font-medium text-green-700">
                  {token.symbol}
                </span>
                <span className="text-green-600">{token.balance}</span>
              </li>
            ))
          ) : (
            <li className="text-green-600">No tokens found</li>
          )}
        </ul>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-green-700 hover:bg-green-100"
          onClick={onDisconnect}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface KaswareProvider {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  disconnect: (origin: string) => Promise<void>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  getKRC20Balance: () => Promise<{
    balance: string;
    dec: string;
    locked: string;
    opScoreMod: string;
    tick: string;
  }[]>;
  on: (event: 'accountsChanged' | 'networkChanged', handler: (params: any) => void) => void;
  removeListener: (event: 'accountsChanged' | 'networkChanged', handler: (params: any) => void) => void;
  getPublicKey: () => Promise<string>;
  signKRC20Transaction: (
    jsonString: string,
    type: number,
    toAddress: string
  ) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  signPSKT: (pskt: string) => Promise<string>;
}

declare global {
  interface Window {
    kasware?: KaswareProvider | any;
  }
}

export {}; 
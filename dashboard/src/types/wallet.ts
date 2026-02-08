// Wallet Integration Types

export type WalletProviderType = 'freighter' | 'albedo';

export interface WalletConnection {
  publicKey: string;
  provider: WalletProviderType;
}

export interface WalletState {
  isConnected: boolean;
  connection: WalletConnection | null;
  balance: string;
  error: string | null;
}

export interface WalletProvider {
  name: WalletProviderType;
  isInstalled: () => Promise<boolean>;
  connect: () => Promise<WalletConnection>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  getPublicKey: () => Promise<string>;
}

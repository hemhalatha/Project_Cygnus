/**
 * Stellar Client Wrapper
 *
 * Wraps Stellar SDK with custom client for transaction construction,
 * signing, and broadcasting.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { Transaction, SignedTransaction, TxResult, TxParams } from '../../agents/runtime/types.js';
import { encodeTransaction, decodeTransactionFromXDR } from './xdr/index.js';

/**
 * Stellar client configuration
 */
export interface StellarClientConfig {
  network: 'testnet' | 'mainnet';
  horizonUrl?: string;
  rpcUrl?: string;
}

/**
 * Stellar client wrapper
 */
export class StellarClient {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;
  private network: 'testnet' | 'mainnet';

  constructor(config: StellarClientConfig) {
    this.network = config.network;

    // Set network passphrase
    this.networkPassphrase =
      config.network === 'testnet' ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;

    // Initialize Horizon server
    const horizonUrl =
      config.horizonUrl ||
      (config.network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org');

    this.server = new StellarSdk.Horizon.Server(horizonUrl);
  }

  /**
   * Construct a transaction
   */
  async constructTransaction(sourceAccount: string, params: TxParams): Promise<Transaction> {
    // Load account to get sequence number
    const account = await this.server.loadAccount(sourceAccount);

    // Create transaction builder
    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    });

    // Add operation based on type
    switch (params.type) {
      case 'payment':
        if (!params.destination || !params.amount || !params.asset) {
          throw new Error('Payment requires destination, amount, and asset');
        }
        txBuilder.addOperation(
          StellarSdk.Operation.payment({
            destination: params.destination,
            asset:
              params.asset === 'XLM'
                ? StellarSdk.Asset.native()
                : new StellarSdk.Asset(params.asset, params.destination),
            amount: params.amount.toString(),
          })
        );
        break;

      case 'contract_invoke':
        if (!params.contractId || !params.functionName) {
          throw new Error('Contract invoke requires contractId and functionName');
        }
        // Soroban contract invocation
        const contract = new StellarSdk.Contract(params.contractId);
        txBuilder.addOperation(contract.call(params.functionName, ...(params.args || [])));
        break;

      case 'create_account':
        if (!params.destination || !params.amount) {
          throw new Error('Create account requires destination and amount');
        }
        txBuilder.addOperation(
          StellarSdk.Operation.createAccount({
            destination: params.destination,
            startingBalance: params.amount.toString(),
          })
        );
        break;

      default:
        throw new Error(`Unsupported transaction type: ${params.type}`);
    }

    // Add memo if provided
    if (params.memo) {
      txBuilder.addMemo(StellarSdk.Memo.text(params.memo));
    }

    // Set timeout
    txBuilder.setTimeout(30);

    // Build transaction
    const stellarTx = txBuilder.build();

    // Convert to our internal format
    const xdr = stellarTx.toXDR('base64');
    return decodeTransactionFromXDR(xdr);
  }

  /**
   * Sign a transaction
   */
  async signTransaction(tx: Transaction, secretKey: string): Promise<SignedTransaction> {
    // Convert to Stellar SDK transaction
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);

    // Encode transaction to XDR
    const xdr = encodeTransaction(tx);

    // Load transaction from XDR
    const stellarTx = StellarSdk.TransactionBuilder.fromXDR(xdr, this.networkPassphrase);

    // Sign transaction
    stellarTx.sign(keypair);

    // Get signature
    const envelope = stellarTx.toEnvelope();
    const signatures = envelope.signatures();
    const signature = signatures.length > 0 ? signatures[0].signature().toString('base64') : '';

    // Get hash
    const hash = stellarTx.hash().toString('hex');

    return {
      transaction: tx,
      signature,
      hash,
    };
  }

  /**
   * Broadcast a transaction
   */
  async broadcastTransaction(signedTx: SignedTransaction): Promise<TxResult> {
    try {
      // Encode signed transaction
      const xdr = encodeTransaction(signedTx.transaction);

      // Load and sign transaction
      const stellarTx = StellarSdk.TransactionBuilder.fromXDR(xdr, this.networkPassphrase);

      // Submit to network
      const response = await this.server.submitTransaction(stellarTx as any);

      return {
        success: response.successful,
        hash: response.hash,
        ledger: response.ledger,
      };
    } catch (error: any) {
      return {
        success: false,
        hash: signedTx.hash,
        error: error.message || 'Transaction failed',
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(hash: string): Promise<TxResult> {
    try {
      const response = await this.server.transactions().transaction(hash).call();

      return {
        success: response.successful,
        hash: response.hash,
        ledger: response.ledger,
      };
    } catch (error: any) {
      return {
        success: false,
        hash,
        error: error.message || 'Transaction not found',
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(publicKey: string): Promise<number> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
      return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  /**
   * Get account details
   */
  async getAccount(publicKey: string): Promise<any> {
    try {
      return await this.server.loadAccount(publicKey);
    } catch (error) {
      throw new Error(`Failed to load account: ${error}`);
    }
  }

  /**
   * Fund account (testnet only)
   */
  async fundAccount(publicKey: string): Promise<void> {
    if (this.network !== 'testnet') {
      throw new Error('Account funding only available on testnet');
    }

    try {
      await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    } catch (error) {
      throw new Error(`Failed to fund account: ${error}`);
    }
  }

  /**
   * Invoke Soroban contract
   */
  async invokeContract(
    sourceAccount: string,
    contractId: string,
    functionName: string,
    args: any[]
  ): Promise<any> {
    const params: TxParams = {
      type: 'contract_invoke',
      contractId,
      functionName,
      args,
    };

    const tx = await this.constructTransaction(sourceAccount, params);
    return tx;
  }

  /**
   * Get network info
   */
  getNetworkInfo(): { network: string; passphrase: string } {
    return {
      network: this.network,
      passphrase: this.networkPassphrase,
    };
  }

  /**
   * Send payment (convenience method)
   */
  async sendPayment(
    sourceSecret: string,
    destination: string,
    amount: number,
    asset: string = 'XLM',
    memo?: string
  ): Promise<TxResult> {
    // Get source public key
    const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
    const sourcePublic = sourceKeypair.publicKey();

    // Construct payment transaction
    const tx = await this.constructTransaction(sourcePublic, {
      type: 'payment',
      destination,
      amount,
      asset,
      memo,
    });

    // Sign transaction
    const signedTx = await this.signTransaction(tx, sourceSecret);

    // Broadcast transaction
    return await this.broadcastTransaction(signedTx);
  }
}

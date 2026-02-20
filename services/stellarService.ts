import * as StellarSdk from '@stellar/stellar-sdk';

export interface Asset {
  code: string;
  issuer: string;
  balance: string;
  limit?: string;
}

class StellarService {
  private server: StellarSdk.Horizon.Server;

  constructor() {
    this.server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
  }

  async getAccountBalances(publicKey: string): Promise<Asset[]> {
    const account = await this.server.loadAccount(publicKey);
    return account.balances.map((balance: any) => ({
      code: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
      issuer: balance.asset_type === 'native' ? '' : balance.asset_issuer,
      balance: balance.balance,
      limit: balance.limit
    }));
  }

  async createTrustline(publicKey: string, assetCode: string, assetIssuer: string): Promise<string> {
    const account = await this.server.loadAccount(publicKey);
    const asset = new StellarSdk.Asset(assetCode, assetIssuer);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset }))
      .setTimeout(180)
      .build();

    return transaction.toXDR();
  }

  async removeTrustline(publicKey: string, assetCode: string, assetIssuer: string): Promise<string> {
    const account = await this.server.loadAccount(publicKey);
    const asset = new StellarSdk.Asset(assetCode, assetIssuer);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset, limit: '0' }))
      .setTimeout(180)
      .build();

    return transaction.toXDR();
  }

  async submitTransaction(signedXDR: string): Promise<any> {
    const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXDR, StellarSdk.Networks.TESTNET);
    return await this.server.submitTransaction(transaction as any);
  }
}

export default new StellarService();

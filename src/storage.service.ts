import { Injectable } from '@nestjs/common';

export interface SettlementRecord {
  /** The challenge ID */
  id: string;
  /** On-chain transaction hash (set once verified) */
  txHash: string;
  /** Payer address (bech32) */
  payer: string;
  /** Expected receiver address (bech32) */
  receiver: string;
  /** Expected payment amount in smallest unit */
  amount: string;
  /** Token identifier: "EGLD" for native, or ESDT identifier like "USDC-c76f31" */
  currency: string;
  /** Chain ID — "1" (mainnet), "D" (devnet), "T" (testnet) */
  chainId: string;
  /** Settlement status */
  status: 'pending' | 'completed' | 'failed';
  /** Timestamp when the challenge was created (epoch ms) */
  createdAt: number;
  /** Challenge expiry timestamp (ISO 8601). Null means no expiry. */
  expiresAt: string | null;
  /** Server-defined correlation data (base64url JCS JSON) */
  opaque?: string;
  /** Content digest of the request body (RFC 9530) */
  digest?: string;
  /** Payer identifier (DID format) */
  source?: string;
}

@Injectable()
export class StorageService {
  private db: Map<string, SettlementRecord> = new Map();

  get(id: string): Promise<SettlementRecord | null> {
    return Promise.resolve(this.db.get(id) || null);
  }

  save(record: SettlementRecord): Promise<void> {
    this.db.set(record.id, record);
    return Promise.resolve();
  }

  updateStatus(
    id: string,
    status: SettlementRecord['status'],
    txHash?: string,
  ): Promise<void> {
    const record = this.db.get(id);
    if (record) {
      record.status = status;
      if (txHash) {
        record.txHash = txHash;
      }
      this.db.set(id, record);
    }
    return Promise.resolve();
  }

  /**
   * Removes all records that have expired and are still in pending status.
   * Returns the number of purged records.
   */
  purgeExpired(): Promise<number> {
    const now = new Date();
    let purged = 0;
    for (const [id, record] of this.db.entries()) {
      if (
        record.status === 'pending' &&
        record.expiresAt &&
        new Date(record.expiresAt) < now
      ) {
        this.db.delete(id);
        purged++;
      }
    }
    return Promise.resolve(purged);
  }

  /** Returns total number of records (for diagnostics) */
  count(): Promise<number> {
    return Promise.resolve(this.db.size);
  }
}

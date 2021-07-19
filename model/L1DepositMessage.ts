import { BigNumber } from "ethers";
import { getChainRequiredConfirmations } from "@network/chain";
import { L1MessageParty, L1MessageReceipt } from "./type";

export enum L1DepositMessageStatus {
  Sent = "Sent",
  Reorganized = "Reorganized",
  Done = "Done",
}

export default class L1DepositMessage {
  public id: number;
  public status: L1DepositMessageStatus;
  public from: L1MessageParty;
  public fromReceipt: L1MessageReceipt;
  public to: L1MessageParty;
  public toReceipt: L1MessageReceipt;
  public amount: BigNumber;
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: {
    status: L1DepositMessageStatus;
    from: L1MessageParty;
    fromReceipt: L1MessageReceipt;
    to: L1MessageParty;
    toReceipt: L1MessageReceipt;
    amount: BigNumber;
    id?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.status = data.status;
    this.from = data.from;
    this.fromReceipt = data.fromReceipt;
    this.to = data.to;
    this.toReceipt = data.toReceipt;
    this.amount = data.amount;
    this.id = data.id || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  public finalize() {
    this.status = L1DepositMessageStatus.Done;
  }

  public retry(toReceipt: L1MessageReceipt) {
    this.status = L1DepositMessageStatus.Sent;
    this.toReceipt = toReceipt;
  }

  public reorganize() {
    if (this.status !== L1DepositMessageStatus.Sent) {
      return;
    }
    this.status = L1DepositMessageStatus.Reorganized;
  }

  public tag(opts: { withdraw?: boolean } = {}): string {
    if (opts.withdraw) {
      return `${this.fromReceipt.txHash} (${this.from.chain})`;
    }
    return `${this.toReceipt.txHash} (${this.to.chain})`;
  }

  public hasRequiredConfirmations(toChainBlockNumber: BigNumber) {
    return toChainBlockNumber
      .sub(this.toReceipt.blockNumber)
      .gt(getChainRequiredConfirmations(this.from.chain));
  }

  public hasReorganized(toReceiptBlockHash: string) {
    return toReceiptBlockHash !== this.toReceipt.blockHash;
  }
}

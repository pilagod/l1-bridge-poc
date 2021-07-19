import { BigNumber } from "ethers";
import { getChainRequiredConfirmations } from "@network/chain";
import { L1MessageParty, L1MessageReceipt } from "./type";

export enum L1WithdrawMessageStatus {
  Sent = "Sent",
  Reorganized = "Reorganized",
  Confirmed = "Confirmed",
  Done = "Done",
}

export default class L1WithdrawMessage {
  public id: number;
  public status: L1WithdrawMessageStatus;
  public from: L1MessageParty;
  public fromReceipt: L1MessageReceipt;
  public to: L1MessageParty;
  public toReceipt?: L1MessageReceipt;
  public amount: BigNumber;
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: {
    status: L1WithdrawMessageStatus;
    from: L1MessageParty;
    fromReceipt: L1MessageReceipt;
    to: L1MessageParty;
    amount: BigNumber;
    id?: number;
    toReceipt?: L1MessageReceipt;
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

  public confirm() {
    if (this.status === L1WithdrawMessageStatus.Done) {
      return;
    }
    this.status = L1WithdrawMessageStatus.Confirmed;
  }

  public finalize(toReceipt: L1MessageReceipt) {
    this.status = L1WithdrawMessageStatus.Done;
    this.toReceipt = toReceipt;
  }

  public reorganize() {
    if (this.status !== L1WithdrawMessageStatus.Sent) {
      return;
    }
    this.status = L1WithdrawMessageStatus.Reorganized;
  }

  public tag(): string {
    return `${this.fromReceipt.txHash} (${this.from.chain})`;
  }

  public hasRequiredConfirmations(fromChainBlockNumber: BigNumber): boolean {
    return fromChainBlockNumber
      .sub(this.fromReceipt.blockNumber)
      .gt(getChainRequiredConfirmations(this.from.chain));
  }

  public hasReorganized(fromReceiptBlockHash: string): boolean {
    return fromReceiptBlockHash !== this.fromReceipt.blockHash;
  }
}

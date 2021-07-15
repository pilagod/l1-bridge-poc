import { BigNumber } from "ethers";
import Chain from "@network/chain";

// TODO: split into deposit and withdraw message

export enum L1TransferMessageType {
  Deposit = "Deposit",
  Withdraw = "Withdraw",
}

export enum L1TransferMessageStatus {
  Sent = "Sent",
  Reorganized = "Reorganized",
  Confirmed = "Confirmed",
  Done = "Done",
}

export type L1TransferMessageParty = {
  chain: Chain;
  address: string;
  blockNumber?: BigNumber;
  blockHash?: string;
  txHash?: string;
};

export type L1TransferMessagePartyStatus = {
  blockNumber: BigNumber;
  blockHash: string;
};

export default class L1TransferMessage {
  public id: number;
  public type: L1TransferMessageType;
  public status: L1TransferMessageStatus;
  public from: L1TransferMessageParty;
  public to: L1TransferMessageParty;
  public amount: BigNumber;
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: {
    type: L1TransferMessageType;
    status: L1TransferMessageStatus;
    from: L1TransferMessageParty;
    to: L1TransferMessageParty;
    amount: BigNumber;
    id?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.type = data.type;
    this.status = data.status;
    this.from = data.from;
    this.to = data.to;
    this.amount = data.amount;
    this.id = data.id || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  public isConfirmed(
    from: L1TransferMessagePartyStatus,
    to: L1TransferMessagePartyStatus
  ): boolean {
    switch (this.type) {
      case L1TransferMessageType.Deposit:
        if (!this.to.blockNumber) {
          return false;
        }
        return (
          to.blockHash === this.to.blockHash &&
          to.blockNumber.sub(this.to.blockNumber).gt(6)
        );
      case L1TransferMessageType.Withdraw:
        if (!this.from.blockNumber) {
          return false;
        }
        return (
          from.blockHash === this.from.blockHash &&
          from.blockNumber.sub(this.from.blockNumber).gt(6)
        );
      default:
        return false;
    }
  }

  public markConfirmed() {
    this.transitStatus(L1TransferMessageStatus.Confirmed);
  }

  public markDone() {
    this.transitStatus(L1TransferMessageStatus.Done);
  }

  /* private */

  private transitStatus(status: L1TransferMessageStatus) {
    if (this.status === L1TransferMessageStatus.Done) {
      return;
    }
    this.status = status;
  }
}

import { BigNumber } from "ethers";

export enum L1TransferMessageType {
  Deposit = "Deposit",
  Withdraw = "Withdraw",
}

export enum L1TransferMessageStatus {
  Sent = "Sent",
  Confirmed = "Confirmed",
  Retryable = "Retryable",
  Done = "Done",
}

export type L1TransferMessageParty = {
  chainId: number;
  address: string;
  blockNumber?: BigNumber;
  blockHash?: string;
  txHash?: string;
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
}

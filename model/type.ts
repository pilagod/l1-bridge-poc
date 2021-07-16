import { BigNumber } from "ethers";
import Chain from "@network/chain";

export type L1MessageParty = {
  chain: Chain;
  address: string;
};

export type L1MessageReceipt = {
  blockNumber: BigNumber;
  blockHash: string;
  txHash: string;
};

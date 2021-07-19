import { BigNumber } from "ethers";
import Chain from "@network/chain";

export default class ChainStatus {
  public constructor(
    public chain: Chain,
    public blockNumberSynced: BigNumber
  ) {}

  public sync(blockNumber: BigNumber) {
    this.blockNumberSynced = blockNumber;
  }
}

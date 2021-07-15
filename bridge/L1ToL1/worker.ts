import { BigNumber } from "ethers";
import L1TransferMessage, {
  L1TransferMessageParty,
  L1TransferMessageStatus,
  L1TransferMessageType,
} from "@model/L1TransferMessage";
import Chain from "@network/chain";
import { TKN } from "@network/contract";
import provider from "@network/provider";
import { l1TransferMessageRepository } from "@repository";

export default async function worker() {
  return new BridgeWorker().start();
}

class BridgeWorker {
  public chainCache: { [chain in Chain]?: { blockNumber: BigNumber } } = {};

  public async start() {
    await this.processReorganizedMsgs();
    await this.processSentMsgs();
  }

  private async processReorganizedMsgs() {}

  private async processSentMsgs() {
    const msgs = await l1TransferMessageRepository.findMany({
      status: L1TransferMessageStatus.Sent,
    });
    for (const msg of msgs) {
      await this.processSentMsg(msg);
    }
  }

  private async processSentMsg(msg: L1TransferMessage) {
    if (!this.isConfirmed(msg)) {
      return;
    }
    // TODO: handle reorganized
    switch (msg.type) {
      case L1TransferMessageType.Deposit:
        return this.finalizeDeposit(msg);
      case L1TransferMessageType.Withdraw:
        return this.finalizeWithdraw(msg);
    }
  }

  private async finalizeDeposit(depositMsg: L1TransferMessage) {
    const withdrawMsg = await l1TransferMessageRepository.find({
      type: L1TransferMessageType.Withdraw,
      status: L1TransferMessageStatus.Confirmed,
      fromTxHash: depositMsg.from.txHash,
    });
    if (!withdrawMsg) {
      console.log(
        "No confirmed withdraw found for deposit:",
        depositMsg.from.txHash
      );
      return;
    }
    withdrawMsg.markDone();
    withdrawMsg.to.blockNumber = depositMsg.to.blockNumber;
    withdrawMsg.to.blockHash = depositMsg.to.blockHash;
    withdrawMsg.to.txHash = depositMsg.to.txHash;
    await l1TransferMessageRepository.update(withdrawMsg);

    depositMsg.markDone();
    await l1TransferMessageRepository.update(depositMsg);
  }

  private async finalizeWithdraw(withdrawMsg: L1TransferMessage) {
    // update withdraw message to confirmed
    withdrawMsg.markConfirmed();
    await l1TransferMessageRepository.update(withdrawMsg);

    // deposit to destination
    const depositTx = await TKN[withdrawMsg.to.chain].deposit(
      withdrawMsg.from.chain,
      withdrawMsg.from.address,
      withdrawMsg.to.address,
      withdrawMsg.amount
    );
    const depositReceipt = await depositTx.wait();
    await l1TransferMessageRepository.create(
      new L1TransferMessage({
        type: L1TransferMessageType.Deposit,
        status: L1TransferMessageStatus.Sent,
        from: withdrawMsg.from,
        to: {
          ...withdrawMsg.to,
          blockNumber: BigNumber.from(depositReceipt.blockNumber),
          blockHash: depositReceipt.blockHash,
          txHash: depositReceipt.transactionHash,
        },
        amount: withdrawMsg.amount,
      })
    );
  }

  private async isConfirmed(msg: L1TransferMessage): Promise<boolean> {
    return msg.isConfirmed(
      await this.getChainStatus(msg.from),
      await this.getChainStatus(msg.to)
    );
  }

  private async getChainStatus(party: L1TransferMessageParty): Promise<{
    blockNumber: BigNumber;
    blockHash: string;
  }> {
    if (!party.blockNumber) {
      throw new Error("No block number for message party");
    }
    const chainProvider = provider[party.chain];
    // ensure current worker access same latest block number
    if (!this.chainCache[party.chain]) {
      this.chainCache[party.chain] = {
        blockNumber: BigNumber.from(await chainProvider.getBlockNumber()),
      };
    }
    return {
      blockNumber: this.chainCache[party.chain]!.blockNumber,
      blockHash: (await chainProvider.getBlock(party.blockNumber.toString()))
        .hash,
    };
  }
}

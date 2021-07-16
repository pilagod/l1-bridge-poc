import { BigNumber } from "ethers";
import L1DepositMessage, {
  L1DepositMessageStatus,
} from "@model/L1DepositMessage";
import L1WithdrawMessage, {
  L1WithdrawMessageStatus,
} from "@model/L1WithdrawMessage";
import Chain from "@network/chain";
import { TKN } from "@network/contract";
import provider from "@network/provider";
import {
  l1DepositMessageRepository,
  l1WithdrawMessageRepository,
} from "@repository";

export default async function worker() {
  return new BridgeWorker().start();
}

class BridgeWorker {
  public chainStatus: { [chain in Chain]?: { blockNumber: BigNumber } } = {};

  public async start() {
    await this.handleWithdrawMessages();
    await this.handleDepositMessages();
  }

  /* withdraw */

  private async handleWithdrawMessages() {
    const msgs = await l1WithdrawMessageRepository.findMany({
      status: L1WithdrawMessageStatus.Sent,
    });
    for (const msg of msgs) {
      await this.handleSentWithdrawMessage(msg);
    }
  }

  private async handleSentWithdrawMessage(msg: L1WithdrawMessage) {
    const { blockNumber } = await this.getChainStatus(msg.from.chain);
    if (!msg.hasRequiredConfirmations(blockNumber)) {
      return;
    }
    const { hash } = await this.getChainBlock(
      msg.from.chain,
      msg.fromReceipt.blockNumber
    );
    // reorgnaize withdraw message, let user to retry
    if (msg.hasReorganized(hash)) {
      await this.reorganizeWithdraw(msg);
      return;
    }
    await this.depositWithdraw(msg);
    await this.confirmWithdraw(msg);
  }

  private async reorganizeWithdraw(msg: L1WithdrawMessage) {
    msg.reorganize();
    await l1WithdrawMessageRepository.update(msg);
  }

  private async depositWithdraw(msg: L1WithdrawMessage) {
    const depositTx = await TKN[msg.to.chain].deposit(
      msg.from.chain,
      msg.from.address,
      msg.to.address,
      msg.amount
    );
    const depositReceipt = await depositTx.wait();
    await l1DepositMessageRepository.create(
      new L1DepositMessage({
        status: L1DepositMessageStatus.Sent,
        from: msg.from,
        fromReceipt: msg.fromReceipt,
        to: msg.to,
        toReceipt: {
          blockNumber: BigNumber.from(depositReceipt.blockNumber),
          blockHash: depositReceipt.blockHash,
          txHash: depositReceipt.transactionHash,
        },
        amount: msg.amount,
      })
    );
  }

  private async confirmWithdraw(msg: L1WithdrawMessage) {
    msg.confirm();
    await l1WithdrawMessageRepository.update(msg);
  }

  /* deposit */

  private async handleDepositMessages() {
    await this.handleReorganizedDepositMessages();
    await this.handleSentDepositMessages();
  }

  /* deposit - reogranized */

  private async handleReorganizedDepositMessages() {
    const msgs = await l1DepositMessageRepository.findMany({
      status: L1DepositMessageStatus.Reorganized,
    });
    for (const msg of msgs) {
      await this.depositRetry(msg);
    }
  }

  private async depositRetry(msg: L1DepositMessage) {
    const tx = await TKN[msg.to.chain].deposit(
      msg.from.chain,
      msg.from.address,
      msg.to.address,
      msg.amount
    );
    const receipt = await tx.wait();
    msg.retry({
      blockNumber: BigNumber.from(receipt.blockNumber),
      blockHash: receipt.blockHash,
      txHash: receipt.transactionHash,
    });
    await l1DepositMessageRepository.update(msg);
  }

  /* deposit - sent */

  private async handleSentDepositMessages() {
    const msgs = await l1DepositMessageRepository.findMany({
      status: L1DepositMessageStatus.Sent,
    });
    for (const msg of msgs) {
      await this.handleSentDepositMessage(msg);
    }
  }

  private async handleSentDepositMessage(msg: L1DepositMessage) {
    const { blockNumber } = await this.getChainStatus(msg.to.chain);
    if (!msg.hasRequiredConfirmations(blockNumber)) {
      return;
    }
    const { hash } = await this.getChainBlock(
      msg.from.chain,
      msg.fromReceipt.blockNumber
    );
    // reorganize deposit message, wait for next worker to handle it
    if (msg.hasReorganized(hash)) {
      await this.reorganizeDeposit(msg);
      return;
    }
    await this.finalizeDeposit(msg);
    await this.finalizeWithdraw(msg);
  }

  private async reorganizeDeposit(msg: L1DepositMessage) {
    msg.reorganize();
    await l1DepositMessageRepository.update(msg);
  }

  private async finalizeDeposit(msg: L1DepositMessage) {
    msg.finalize();
    await l1DepositMessageRepository.update(msg);
  }

  private async finalizeWithdraw(msg: L1DepositMessage) {
    const withdrawMsg = await l1WithdrawMessageRepository.find({
      status: L1WithdrawMessageStatus.Confirmed,
      fromTxHash: msg.fromReceipt.txHash,
    });
    if (!withdrawMsg) {
      console.log(
        "No confirmed withdraw found for deposit:",
        msg.fromReceipt.txHash
      );
      return;
    }
    withdrawMsg.finalize(msg.toReceipt);
    await l1WithdrawMessageRepository.update(withdrawMsg);
  }

  private async getChainBlock(chain: Chain, blockNumber: BigNumber) {
    return provider[chain].getBlock(blockNumber.toString());
  }

  private async getChainStatus(chain: Chain): Promise<{
    blockNumber: BigNumber;
  }> {
    // ensure current worker access same latest block number
    if (!this.chainStatus[chain]) {
      this.chainStatus[chain] = {
        blockNumber: BigNumber.from(await provider[chain].getBlockNumber()),
      };
    }
    return this.chainStatus[chain]!;
  }
}

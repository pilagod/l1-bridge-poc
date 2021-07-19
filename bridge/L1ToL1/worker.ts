import { BigNumber } from "ethers";
import logger from "@logger";
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
    logger.info("Worker starts");
    await this.handleWithdrawMessages();
    await this.handleDepositMessages();
    logger.info("Worker finishes");
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
    logger.info(`Handle withdraw ${msg.tag()}`);
    const { blockNumber } = await this.getChainStatus(msg.from.chain);
    if (!msg.hasRequiredConfirmations(blockNumber)) {
      logger.info(
        `Not enough confirmations at block ${blockNumber} for withdraw ${msg.tag()}`
      );
      return;
    }
    const { hash: blockHash } = await this.getChainBlock(
      msg.from.chain,
      msg.fromReceipt.blockNumber
    );
    // reorgnaize withdraw message, let user to retry
    if (msg.hasReorganized(blockHash)) {
      logger.info(
        `Withdraw ${msg.tag()} is reorganized at ${blockNumber}, expected block hash ${
          msg.fromReceipt.blockHash
        }, but got ${blockHash}`
      );
      await this.reorganizeWithdraw(msg);
      logger.info(`Withdraw ${msg.tag()} is reorganized`);
      return;
    }
    logger.info(`Deposit for withdraw ${msg.tag()}`);
    const depositMsg = await this.depositWithdraw(msg);
    logger.info(`Deposit successfully ${depositMsg.tag()}`);
    await this.confirmWithdraw(msg);
    logger.info(`Withdraw ${msg.tag()} is confirmed`);
  }

  private async reorganizeWithdraw(msg: L1WithdrawMessage) {
    msg.reorganize();
    await l1WithdrawMessageRepository.update(msg);
  }

  private async depositWithdraw(
    msg: L1WithdrawMessage
  ): Promise<L1DepositMessage> {
    const depositTx = await TKN[msg.to.chain].deposit(
      msg.from.chain,
      msg.from.address,
      msg.to.address,
      msg.amount
    );
    const depositReceipt = await depositTx.wait();
    const depositMsg = new L1DepositMessage({
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
    });
    await l1DepositMessageRepository.create(depositMsg);
    return depositMsg;
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
    const withdrawTag = msg.tag({ withdraw: true });
    const retryTag = msg.tag();
    logger.info(`Retry deposit ${retryTag} for withdraw ${withdrawTag}`);
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
    logger.info(
      `Deposit retry successfully ${msg.tag()} in replace of ${retryTag} for withdraw ${withdrawTag}`
    );
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
      logger.info(
        `Not enough confirmations at block ${blockNumber} for deposit ${msg.tag()}`
      );
      return;
    }
    const { hash: blockHash } = await this.getChainBlock(
      msg.from.chain,
      msg.fromReceipt.blockNumber
    );
    // reorganize deposit message, wait for next worker to handle it
    if (msg.hasReorganized(blockHash)) {
      logger.info(
        `Deposit ${msg.tag()} is reorganized at ${blockNumber}, expected block hash ${
          msg.toReceipt.blockHash
        }, but got ${blockHash}`
      );
      await this.reorganizeDeposit(msg);
      logger.info(`Deposit ${msg.tag()} is reorganized`);
      return;
    }
    await this.finalizeDeposit(msg);
    logger.info(`Deposit ${msg.tag()} is finalized`);
    await this.finalizeWithdraw(msg);
    logger.info(`Withdraw ${msg.tag({ withdraw: true })} is finalized`);
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
      logger.error(
        `No confirmed withdraw ${msg.tag({
          withdraw: true,
        })} found for deposit ${msg.tag()}`
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

import { BigNumber, ethers } from "ethers";
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
    logger.info("========== Worker starts ==========");
    await this.handleWithdrawMessages();
    await this.handleDepositMessages();
    logger.info("========== Worker finishes ==========");
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
    const withdrawTx = formatWithdrawTx(msg);
    logger.info(`Handle withdraw ${withdrawTx}`);
    const { blockNumber } = await this.getChainStatus(msg.from.chain);
    if (!msg.hasRequiredConfirmations(blockNumber)) {
      logger.info(
        `Not enough confirmations at block ${blockNumber} for withdraw ${withdrawTx}`
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
        `Withdraw ${withdrawTx} is reorganized at ${blockNumber}, expected block hash ${msg.fromReceipt.blockHash}, but got ${blockHash}`
      );
      await this.reorganizeWithdraw(msg);
      logger.info(
        `Withdraw ${withdrawTx} is reorganized, let user retry again`
      );
      return;
    }
    logger.info(`Deposit for withdraw ${withdrawTx}`);
    const depositMsg = await this.depositWithdraw(msg);
    const depositTx = formatDepositTx(depositMsg);
    logger.info(
      `Deposit for withdraw ${withdrawTx} successfully at ${depositTx}`
    );
    logger.info(`Confirm withdraw ${withdrawTx}`);
    await this.confirmWithdraw(msg);
    logger.info(`Withdraw ${withdrawTx} is confirmed`);
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
      msg.amount,
      {
        gasLimit: ethers.utils.parseUnits("1", "mwei"),
      }
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
      const retryDepositTx = formatDepositTx(msg);
      logger.info(`Retry deposit reorganized at ${retryDepositTx}`);
      const depositMsg = await this.depositRetry(msg);
      const depositTx = formatDepositTx(depositMsg);
      logger.info(
        `Retry deposit reorganized at ${retryDepositTx} successfully at ${depositTx})`
      );
    }
  }

  private async depositRetry(msg: L1DepositMessage): Promise<L1DepositMessage> {
    const tx = await TKN[msg.to.chain].deposit(
      msg.from.chain,
      msg.from.address,
      msg.to.address,
      msg.amount,
      {
        gasLimit: ethers.utils.parseUnits("1", "mwei"),
      }
    );
    const receipt = await tx.wait();
    msg.retry({
      blockNumber: BigNumber.from(receipt.blockNumber),
      blockHash: receipt.blockHash,
      txHash: receipt.transactionHash,
    });
    await l1DepositMessageRepository.update(msg);
    return msg;
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
    const depositTx = formatDepositTx(msg);
    logger.info(`Handle deposit ${depositTx}`);
    const { blockNumber } = await this.getChainStatus(msg.to.chain);
    if (!msg.hasRequiredConfirmations(blockNumber)) {
      logger.info(
        `Not enough confirmations at block ${blockNumber} for deposit ${depositTx}`
      );
      return;
    }
    const { hash: blockHash } = await this.getChainBlock(
      msg.to.chain,
      msg.toReceipt.blockNumber
    );
    // reorganize deposit message, wait for next worker to handle it
    if (msg.hasReorganized(blockHash)) {
      logger.info(
        `Deposit ${depositTx} is reorganized at ${blockNumber}, expected block hash ${msg.toReceipt.blockHash}, but got ${blockHash}`
      );
      await this.reorganizeDeposit(msg);
      logger.info(
        `Deposit ${depositTx} is reorganized, auto retry at next stage`
      );
      return;
    }
    logger.info(`Finalize deposit ${depositTx}`);
    await this.finalizeDeposit(msg);
    logger.info(`Deposit ${depositTx} is finalized`);

    const withdrawTx = formatWithdrawTx(msg);
    logger.info(`Finalize withdraw ${withdrawTx}`);
    await this.finalizeWithdraw(msg);
    logger.info(`Withdraw ${withdrawTx} is finalized`);
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
      const e = new Error(
        `No confirmed withdraw ${msg.fromReceipt.txHash} (${msg.from.chain}) found for deposit ${msg.toReceipt.txHash} (${msg.to.chain})`
      );
      logger.error(e);
      throw e;
    }
    withdrawMsg.finalize(msg.toReceipt);
    await l1WithdrawMessageRepository.update(withdrawMsg);
  }

  private async getChainBlock(chain: Chain, blockNumber: BigNumber) {
    return provider[chain].getBlock(blockNumber.toNumber());
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

function formatDepositTx(msg: L1DepositMessage | L1WithdrawMessage): string {
  return `${msg.toReceipt?.txHash} (${msg.to.chain})`;
}

function formatWithdrawTx(msg: L1DepositMessage | L1WithdrawMessage): string {
  return `${msg.fromReceipt.txHash} (${msg.from.chain})`;
}

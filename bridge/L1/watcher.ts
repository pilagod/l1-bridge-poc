import { BigNumber, Event, ethers } from "ethers";
import db from "@db";
import logger from "@logger";
import L1WithdrawMessage, {
  L1WithdrawMessageStatus,
} from "@model/L1WithdrawMessage";
import Chain, { getChain, getChainName } from "@network/chain";
import { TKN } from "@network/contract";
import provider from "@network/provider";
import { l1WithdrawMessageRepository } from "@repository";
import { TestToken } from "@typechain";

export default async function watcher() {
  logger.info("========== Watcher initializing ==========");
  for (const [key, tkn] of Object.entries(TKN)) {
    const chain = getChain(key);
    await syncEvents(chain, tkn);
    logger.info(
      `Listen to Withdrawn event for TKN on chain ${getChainName(
        chain
      )}(${chain})`
    );
    tkn.on("Withdrawn", withdrawHandler);
  }
  logger.info("========== Watcher starts ==========");
}

async function syncEvents(chain: Chain, tkn: TestToken) {
  logger.info(`Sync events for chain ${getChainName(chain)}(${chain})`);
  const chainStatus = await getChainStatus(chain);
  const events = await tkn.queryFilter(
    tkn.filters.Withdrawn(),
    chainStatus.blockNumberSynced.toNumber() + 1
  );
  if (events.length > 0) {
    logger.info(`${events.length} events need to sync`);
  } else {
    logger.info("Events are up to date");
  }
  for (const event of events) {
    logger.info("Sync event: ", event);
    await withdrawHandler(
      event.args[0],
      event.args[1],
      event.args[2],
      event.args[3],
      event.args[4],
      event
    );
  }
  if (!chainStatus.blockNumber.eq(chainStatus.blockNumberSynced)) {
    await updateChainStatus({
      chain,
      blockNumberSynced: chainStatus.blockNumber,
    });
  }
  logger.info(
    `Sync events for chain ${getChainName(chain)}(${chain}) finishes`
  );
}

async function getChainStatus(chain: Chain) {
  const chainBlockNumberSynced: BigNumber | undefined = await new Promise(
    (resolve, reject) => {
      db.get("SELECT * FROM chain_status WHERE id = ?", chain, (err, row) => {
        err
          ? reject(err)
          : resolve(row ? BigNumber.from(row.block_number_synced) : undefined);
      });
    }
  );
  const chainBlockNumber = BigNumber.from(
    await provider[chain].getBlockNumber()
  );
  const chainStatus: {
    chain: Chain;
    blockNumber: BigNumber;
    blockNumberSynced: BigNumber;
  } = {
    chain,
    blockNumber: chainBlockNumber,
    blockNumberSynced: chainBlockNumberSynced || chainBlockNumber,
  };
  if (!chainBlockNumberSynced) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO chain_status (id, block_number_synced) VALUES (?, ?)`,
        [chainStatus.chain, chainStatus.blockNumberSynced],
        (err) => (err ? reject(err) : resolve(null))
      );
    });
  }
  return chainStatus;
}

async function updateChainStatus(data: {
  chain: Chain;
  blockNumberSynced: BigNumber;
}) {
  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE chain_status SET block_number_synced = ? WHERE id = ?`,
      [data.blockNumberSynced, data.chain],
      (err) => (err ? reject(err) : resolve(null))
    );
  });
}

async function withdrawHandler(
  fromChainId: BigNumber,
  from: string,
  toChainId: BigNumber,
  to: string,
  amount: BigNumber,
  event: Event
) {
  logger.info("Withdraw request received:", {
    fromChainId,
    from,
    toChainId,
    to,
    amount: ethers.utils.formatEther(amount),
    event,
  });
  try {
    await l1WithdrawMessageRepository.create(
      new L1WithdrawMessage({
        status: L1WithdrawMessageStatus.Sent,
        from: {
          chain: fromChainId.toNumber(),
          address: from,
        },
        fromReceipt: {
          blockNumber: BigNumber.from(event.blockNumber),
          blockHash: event.blockHash,
          txHash: event.transactionHash,
        },
        to: {
          chain: toChainId.toNumber(),
          address: to,
        },
        amount,
      })
    );
  } catch (e) {
    logger.error(e);
    throw e;
  }
  logger.info("Withdraw request accepted");
}

import { BigNumber, Event, ethers } from "ethers";
import logger from "@logger";
import ChainStatus from "@model/ChainStatus";
import L1WithdrawMessage, {
  L1WithdrawMessageStatus,
} from "@model/L1WithdrawMessage";
import Chain, { getChain, getChainName } from "@network/chain";
import { TKN } from "@network/contract";
import provider from "@network/provider";
import signer from "@network/signer";
import {
  chainStatusRepository,
  l1WithdrawMessageRepository,
} from "@repository";
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
    tkn.filters.Withdrawn(null, signer[chain].address),
    chainStatus.blockNumberSynced.toNumber() + 1
  );
  if (events.length > 0) {
    logger.info(`${events.length} events need to sync`);
  } else {
    logger.info("Events are up to date");
  }
  for (const event of events) {
    await withdrawHandler(
      event.args[0],
      event.args[1],
      event.args[2],
      event.args[3],
      event.args[4],
      event
    );
  }
  logger.info(
    `Sync events for chain ${getChainName(chain)}(${chain}) finishes`
  );
}

async function getChainStatus(chain: Chain): Promise<ChainStatus> {
  const chainBlockNumber = BigNumber.from(
    await provider[chain].getBlockNumber()
  );
  let chainStatus = await chainStatusRepository.find(chain);
  if (!chainStatus) {
    chainStatus = new ChainStatus(chain, chainBlockNumber);
    await chainStatusRepository.create(chainStatus);
  }
  return chainStatus;
}

async function withdrawHandler(
  fromChainId: BigNumber,
  from: string,
  toChainId: BigNumber,
  to: string,
  amount: BigNumber,
  event: Event
) {
  const fromChain = getChain(fromChainId.toString());
  if (signer[fromChain].address !== from) {
    return;
  }
  logger.info("Withdraw request received:", {
    fromChainId,
    from,
    toChainId,
    to,
    amount: ethers.utils.formatEther(amount),
    event,
  });
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
  await chainStatusRepository.update(
    new ChainStatus(getChain(fromChain), BigNumber.from(event.blockNumber))
  );
  logger.info("Withdraw request accepted");
}

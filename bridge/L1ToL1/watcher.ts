import { BigNumber, Event } from "ethers";
import L1TransferMessage, {
  L1TransferMessageStatus,
  L1TransferMessageType,
} from "@model/L1TransferMessage";
import { TKN } from "@network/contract";
import { l1TransferMessageRepository } from "@repository";

export default async function watcher() {
  // TODO: sync old events
  for (const tkn of Object.values(TKN)) {
    tkn.on("Deposit", depositHandler);
    tkn.on("Withdraw", withdrawHandler);
  }
}

async function depositHandler(
  fromChainId: BigNumber,
  from: string,
  toChainId: BigNumber,
  to: string,
  amount: BigNumber,
  event: Event
) {
  await l1TransferMessageRepository.create(
    new L1TransferMessage({
      type: L1TransferMessageType.Deposit,
      status: L1TransferMessageStatus.Sent,
      from: {
        chainId: fromChainId.toNumber(),
        address: from,
        blockNumber: BigNumber.from(event.blockNumber),
        blockHash: event.blockHash,
        txHash: event.transactionHash,
      },
      to: {
        chainId: toChainId.toNumber(),
        address: to,
      },
      amount,
    })
  );
}

async function withdrawHandler(
  fromChainId: BigNumber,
  from: string,
  toChainId: BigNumber,
  to: string,
  amount: BigNumber,
  event: Event
) {
  await l1TransferMessageRepository.create(
    new L1TransferMessage({
      type: L1TransferMessageType.Withdraw,
      status: L1TransferMessageStatus.Sent,
      from: {
        chainId: fromChainId.toNumber(),
        address: from,
        blockNumber: BigNumber.from(event.blockNumber),
        blockHash: event.blockHash,
        txHash: event.transactionHash,
      },
      to: {
        chainId: toChainId.toNumber(),
        address: to,
      },
      amount,
    })
  );
}

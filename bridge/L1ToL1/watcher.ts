import { BigNumber, Event } from "ethers";
import L1WithdrawMessage, {
  L1WithdrawMessageStatus,
} from "@model/L1WithdrawMessage";
import { TKN } from "@network/contract";
import { l1WithdrawMessageRepository } from "@repository";

export default async function watcher() {
  // TODO: sync old events
  for (const tkn of Object.values(TKN)) {
    tkn.on("Withdrawn", withdrawHandler);
  }
}

async function withdrawHandler(
  fromChainId: BigNumber,
  from: string,
  toChainId: BigNumber,
  to: string,
  amount: BigNumber,
  event: Event
) {
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
}

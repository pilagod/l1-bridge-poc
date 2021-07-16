import L1WithdrawMessage, {
  L1WithdrawMessageStatus,
} from "@model/L1WithdrawMessage";
import {
  L1TransferMessageType,
  find,
  findMany,
  create,
  update,
  fillMessage,
} from "./util";

export type L1WithdrawMessageQuery = {
  status?: L1WithdrawMessageStatus;
  fromTxHash?: string;
};

export default class L1WithdrawMessageRepository {
  public async find(
    query: L1WithdrawMessageQuery
  ): Promise<L1WithdrawMessage | undefined> {
    const row = await find({
      type: L1TransferMessageType.Withdraw,
      status: query.status,
    });
    return row ? fillMessage(L1WithdrawMessage, row) : undefined;
  }

  public async findMany(
    query: L1WithdrawMessageQuery
  ): Promise<L1WithdrawMessage[]> {
    const rows = await findMany({
      type: L1TransferMessageType.Withdraw,
      status: query.status,
    });
    return rows.map((row) => fillMessage(L1WithdrawMessage, row));
  }

  public async create(msg: L1WithdrawMessage) {
    await create(msg);
  }

  public async update(msg: L1WithdrawMessage) {
    await update(msg);
  }
}

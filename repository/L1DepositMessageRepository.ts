import L1DepositMessage, {
  L1DepositMessageStatus,
} from "@model/L1DepositMessage";
import {
  L1TransferMessageType,
  fillMessage,
  find,
  findMany,
  create,
  update,
} from "./util";

export type L1DepositMessageQuery = {
  status?: L1DepositMessageStatus;
};

export default class L1DepositMessageRepository {
  public async find(
    query: L1DepositMessageQuery
  ): Promise<L1DepositMessage | undefined> {
    const row = await find({
      type: L1TransferMessageType.Deposit,
      status: query.status,
    });
    return row ? fillMessage(L1DepositMessage, row) : undefined;
  }

  public async findMany(
    query: L1DepositMessageQuery
  ): Promise<L1DepositMessage[]> {
    const rows = await findMany({
      type: L1TransferMessageType.Deposit,
      status: query.status,
    });
    return rows.map((row) => fillMessage(L1DepositMessage, row));
  }

  public async create(msg: L1DepositMessage) {
    await create(msg);
  }

  public async update(msg: L1DepositMessage) {
    await update(msg);
  }
}

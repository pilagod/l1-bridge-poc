import L1WithdrawMessage, {
  L1WithdrawMessageStatus,
} from "@model/L1WithdrawMessage";
import L1TransferMessageRepository, {
  L1TransferMessageType,
} from "./L1TransferMessageRepository";

export type L1WithdrawMessageQuery = {
  status?: L1WithdrawMessageStatus;
  fromTxHash?: string;
};

export default class L1WithdrawMessageRepository {
  private l1TransferMessageRepository = new L1TransferMessageRepository();

  public async find(
    query: L1WithdrawMessageQuery
  ): Promise<L1WithdrawMessage | undefined> {
    const row = await this.l1TransferMessageRepository.find({
      type: L1TransferMessageType.Withdraw,
      status: query.status,
    });
    return row
      ? this.l1TransferMessageRepository.fillMessage(L1WithdrawMessage, row)
      : undefined;
  }

  public async findMany(
    query: L1WithdrawMessageQuery
  ): Promise<L1WithdrawMessage[]> {
    const rows = await this.l1TransferMessageRepository.findMany({
      type: L1TransferMessageType.Withdraw,
      status: query.status,
    });
    return rows.map((row) =>
      this.l1TransferMessageRepository.fillMessage(L1WithdrawMessage, row)
    );
  }

  public async create(msg: L1WithdrawMessage) {
    await this.l1TransferMessageRepository.create(msg);
  }

  public async update(msg: L1WithdrawMessage) {
    await this.l1TransferMessageRepository.update(msg);
  }
}

import L1DepositMessage, {
  L1DepositMessageStatus,
} from "@model/L1DepositMessage";
import L1TransferMessageRepository, {
  L1TransferMessageType,
} from "./L1TransferMessageRepository";

export type L1DepositMessageQuery = {
  status?: L1DepositMessageStatus;
};

export default class L1DepositMessageRepository {
  private l1TrasferMessageRepository = new L1TransferMessageRepository();

  public async find(
    query: L1DepositMessageQuery
  ): Promise<L1DepositMessage | undefined> {
    const row = await this.l1TrasferMessageRepository.find({
      type: L1TransferMessageType.Deposit,
      status: query.status,
    });
    return row
      ? this.l1TrasferMessageRepository.fillMessage(L1DepositMessage, row)
      : undefined;
  }

  public async findMany(
    query: L1DepositMessageQuery
  ): Promise<L1DepositMessage[]> {
    const rows = await this.l1TrasferMessageRepository.findMany({
      type: L1TransferMessageType.Deposit,
      status: query.status,
    });
    return rows.map((row) =>
      this.l1TrasferMessageRepository.fillMessage(L1DepositMessage, row)
    );
  }

  public async create(msg: L1DepositMessage) {
    await this.l1TrasferMessageRepository.create(msg);
  }

  public async update(msg: L1DepositMessage) {
    await this.l1TrasferMessageRepository.update(msg);
  }
}

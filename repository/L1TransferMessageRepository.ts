import { BigNumber } from "ethers";
import db from "@db";
import L1TransferMessage, {
  L1TransferMessageStatus,
  L1TransferMessageType,
} from "@model/L1TransferMessage";
import { getChain } from "@network/chain";

export type L1TransferMessageQuery = {
  type?: L1TransferMessageType;
  status?: L1TransferMessageStatus;
  fromTxHash?: string;
};

export default class L1TransferMessageRepository {
  private fields = [
    "type",
    "status",
    "from_chain_id",
    "from_address",
    "from_block_number",
    "from_block_hash",
    "from_tx_hash",
    "to_chain_id",
    "to_address",
    "to_block_number",
    "to_block_hash",
    "to_tx_hash",
    "amount",
    "created_at",
    "updated_at",
  ];

  public find(
    query: L1TransferMessageQuery
  ): Promise<L1TransferMessage | undefined> {
    return new Promise((resolve, reject) => {
      const { where, params } = this.toSqlQuery(query);
      const msgs: L1TransferMessage[] = [];
      db.each(
        `SELECT * FROM l1_transfer_message${
          where ? ` WHERE ${where}` : ""
        } LIMIT 1`,
        params,
        (_, row) => msgs.push(this.toL1TrasferMessage(row)),
        (err) => (err ? reject(err) : resolve(msgs[0]))
      );
    });
  }

  public findMany(query: L1TransferMessageQuery): Promise<L1TransferMessage[]> {
    return new Promise((resolve, reject) => {
      const { where, params } = this.toSqlQuery(query);
      const msgs: L1TransferMessage[] = [];
      db.each(
        `SELECT * FROM l1_transfer_message${where ? ` WHERE ${where}` : ""}`,
        params,
        (_, row) => msgs.push(this.toL1TrasferMessage(row)),
        (err) => (err ? reject(err) : resolve(msgs))
      );
    });
  }

  public create(msg: L1TransferMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      const sqlFields = this.fields.join(", ");
      const sqlFieldParams = Array(this.fields.length).fill("?").join(", ");
      db.run(
        `INSERT INTO l1_transfer_message (${sqlFields}) VALUES (${sqlFieldParams})`,
        this.toSqlValues(msg),
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  public update(msg: L1TransferMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      const sqlFields = this.fields.join(" = ?, ") + " = ?";
      db.run(
        `UPDATE l1_message SET ${sqlFields} WHERE id = ?`,
        [...this.toSqlValues(msg), msg.id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  /* private */

  private toSqlQuery(query: L1TransferMessageQuery): {
    where: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.type) {
      conditions.push("type = ?");
      params.push(query.type);
    }
    if (query.status) {
      conditions.push("status = ?");
      params.push(query.status);
    }
    if (query.fromTxHash) {
      conditions.push("from_tx_hash = ?");
      params.push(query.fromTxHash);
    }
    return {
      where: conditions.join(" AND "),
      params,
    };
  }

  private toSqlValues(msg: L1TransferMessage): any[] {
    return [
      msg.type,
      msg.status,
      msg.from.chain,
      msg.from.address,
      msg.from.blockNumber
        ? msg.from.blockNumber.toString()
        : msg.from.blockNumber,
      msg.from.blockHash,
      msg.from.txHash,
      msg.to.chain,
      msg.to.address,
      msg.to.blockNumber ? msg.to.blockNumber.toString() : msg.to.blockNumber,
      msg.to.blockHash,
      msg.to.txHash,
      msg.amount.toString(),
      msg.createdAt,
      msg.updatedAt,
    ];
  }

  private toL1TrasferMessage(row: any): L1TransferMessage {
    return new L1TransferMessage({
      id: row.id,
      type: row.type as L1TransferMessageType,
      status: row.status as L1TransferMessageStatus,
      from: {
        chain: getChain(row.from_chain_id),
        address: row.from_address,
        blockNumber: row.from_block_number
          ? BigNumber.from(row.from_block_number)
          : row.from_block_number,
        blockHash: row.from_block_hash,
        txHash: row.from_tx_hash,
      },
      to: {
        chain: getChain(row.to_chain_id),
        address: row.to_address,
        blockNumber: row.to_block_number
          ? BigNumber.from(row.to_block_number)
          : row.to_block_number,
        blockHash: row.to_block_hash,
        txHash: row.to_tx_hash,
      },
      amount: BigNumber.from(row.amount),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

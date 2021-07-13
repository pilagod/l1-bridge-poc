import db from "@db";
import L1TransferMessage from "@model/L1TransferMessage";

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

  private toSqlValues(msg: L1TransferMessage): any[] {
    return [
      msg.type,
      msg.status,
      msg.from.chainId,
      msg.from.address,
      msg.from.blockNumber
        ? msg.from.blockNumber.toString()
        : msg.from.blockNumber,
      msg.from.blockHash,
      msg.from.txHash,
      msg.to.chainId,
      msg.to.address,
      msg.to.blockNumber ? msg.to.blockNumber.toString() : msg.to.blockNumber,
      msg.to.blockHash,
      msg.to.txHash,
      msg.amount.toString(),
      msg.createdAt,
      msg.updatedAt,
    ];
  }
}

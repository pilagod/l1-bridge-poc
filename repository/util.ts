import { BigNumber } from "ethers";
import db from "@db";
import L1DepositMessage from "@model/L1DepositMessage";
import L1WithdrawMessage from "@model/L1WithdrawMessage";
import { getChain } from "@network/chain";

export type L1TransferMessage = L1DepositMessage | L1WithdrawMessage;

export enum L1TransferMessageType {
  Deposit = "Deposit",
  Withdraw = "Withdraw",
}

export type L1TransferMessageQuery = {
  type?: string;
  status?: string;
  fromTxHash?: string;
};

export async function find(
  query: L1TransferMessageQuery
): Promise<any | undefined> {
  return new Promise((resolve, reject) => {
    const { where, params } = toSqlQuery(query);
    const rows: any[] = [];
    db.each(
      `SELECT * FROM l1_transfer_message${
        where ? ` WHERE ${where}` : ""
      } LIMIT 1`,
      params,
      (_, row) => rows.push(row),
      (err) => (err ? reject(err) : resolve(rows[0]))
    );
  });
}

export async function findMany(query: L1TransferMessageQuery): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const { where, params } = toSqlQuery(query);
    const rows: any[] = [];
    db.each(
      `SELECT * FROM l1_transfer_message${where ? ` WHERE ${where}` : ""}`,
      params,
      (_, row) => rows.push(row),
      (err) => (err ? reject(err) : resolve(rows))
    );
  });
}

export async function create(msg: L1TransferMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    const { fields, values } = toSqlFieldsAndValues(msg);
    const sqlFields = fields.join(", ");
    const sqlFieldParams = Array(fields.length).fill("?").join(", ");
    db.run(
      `INSERT INTO l1_transfer_message (${sqlFields}) VALUES (${sqlFieldParams})`,
      values,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export async function update(msg: L1TransferMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    const { fields, values } = toSqlFieldsAndValues(msg);
    const sqlFields = fields.join(" = ?, ") + " = ?";
    db.run(
      `UPDATE l1_message SET ${sqlFields} WHERE id = ?`,
      [...values, msg.id],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export function toSqlQuery(query: L1TransferMessageQuery): {
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

export function toSqlFieldsAndValues(
  msg: L1DepositMessage | L1WithdrawMessage
): {
  fields: string[];
  values: any[];
} {
  return {
    fields: [
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
    ],
    values: [
      msg instanceof L1DepositMessage
        ? L1TransferMessageType.Deposit
        : L1TransferMessageType.Withdraw,
      msg.status,
      msg.from.chain,
      msg.from.address,
      msg.fromReceipt.blockNumber.toString(),
      msg.fromReceipt.blockHash,
      msg.fromReceipt.txHash,
      msg.to.chain,
      msg.to.address,
      ...(msg.toReceipt
        ? [
            msg.toReceipt.blockNumber.toString(),
            msg.toReceipt.blockHash,
            msg.toReceipt.txHash,
          ]
        : Array(3).fill(undefined)),
      msg.amount.toString(),
      msg.createdAt,
      msg.updatedAt,
    ],
  };
}

export function fillMessage<T extends L1DepositMessage | L1WithdrawMessage>(
  MsgCtor: new (data: any) => T,
  row: any
): T {
  const data = {
    id: row.id,
    status: row.status,
    from: {
      chain: getChain(row.from_chain_id),
      address: row.from_address,
    },
    fromReceipt: {
      blockNumber: BigNumber.from(row.from_block_number),
      blockHash: row.from_block_hash,
      txHash: row.from_tx_hash,
    },
    to: {
      chain: getChain(row.to_chain_id),
      address: row.to_address,
    },
    ...(row.to_block_number
      ? {
          toReceipt: {
            blockNumber: BigNumber.from(row.to_block_number),
            blockHash: row.to_block_hash,
            txHash: row.to_tx_hash,
          },
        }
      : {}),
    amount: BigNumber.from(row.amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  return new MsgCtor(data);
}

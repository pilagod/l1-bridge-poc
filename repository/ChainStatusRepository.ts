import { BigNumber } from "ethers";
import db from "@db";
import ChainStatus from "@model/ChainStatus";
import Chain from "@network/chain";

export default class ChainStatusRepository {
  public async find(chain: Chain): Promise<ChainStatus | undefined> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM chain_status WHERE id = ?", chain, (err, row) => {
        err
          ? reject(err)
          : resolve(
              row
                ? new ChainStatus(
                    chain,
                    BigNumber.from(row.block_number_synced)
                  )
                : undefined
            );
      });
    });
  }

  public async create(chainStatus: ChainStatus) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO chain_status (id, block_number_synced) VALUES (?, ?)`,
        [chainStatus.chain, chainStatus.blockNumberSynced],
        (err) => (err ? reject(err) : resolve(null))
      );
    });
  }

  public async update(chainStatus: ChainStatus) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE chain_status SET block_number_synced = ? WHERE id = ?`,
        [chainStatus.blockNumberSynced, chainStatus.chain],
        (err) => (err ? reject(err) : resolve(null))
      );
    });
  }
}

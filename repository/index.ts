import ChainStatusRepository from "./ChainStatusRepository";
import L1DepositMessageRepository from "./L1DepositMessageRepository";
import L1WithdrawMessageRepository from "./L1WithdrawMessageRepository";

export const chainStatusRepository = new ChainStatusRepository();
export const l1DepositMessageRepository = new L1DepositMessageRepository();
export const l1WithdrawMessageRepository = new L1WithdrawMessageRepository();

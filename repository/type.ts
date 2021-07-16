import L1DepositMessage from "@model/L1DepositMessage";
import L1WithdrawMessage from "@model/L1WithdrawMessage";

export type L1TransferMessage = L1DepositMessage | L1WithdrawMessage;

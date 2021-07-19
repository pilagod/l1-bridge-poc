import { ethers } from "ethers";
import { TKN } from "@network/contract";
import signer from "@network/signer";
import { parseCrossChainArgs } from "./util";

async function main() {
  const { from, to } = parseCrossChainArgs();
  const tx = await TKN[from].withdraw(
    to,
    signer[to].address,
    ethers.utils.parseEther("10")
  );
  const receipt = await tx.wait();
  console.log("success:", receipt);
}

main().then(() => process.exit(0));

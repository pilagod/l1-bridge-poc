import { ethers } from "ethers";
import { TKN } from "@network/contract";
import signer from "@network/signer";
import { parseChainArgs } from "./util";

async function main() {
  const chain = parseChainArgs();
  const tx = await TKN[chain].mint(
    signer[chain].address,
    ethers.utils.parseEther("100")
  );
  const receipt = await tx.wait();
  console.log("success:", receipt);
}

main().then(() => process.exit(0));

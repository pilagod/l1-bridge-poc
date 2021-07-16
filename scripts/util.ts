import yargs from "yargs";
import Chain, { getChain } from "@network/chain";

export function parseChainArgs(): Chain {
  const { chain, chainId } = yargs
    .option("chain", {
      alias: "c",
      description: "Chain name",
      type: "string",
    })
    .option("chainId", {
      alias: "i",
      description: "Chain id",
      type: "number",
    })
    .help()
    .alias("help", "h")
    .check(({ chain, chainId }) => {
      if (!chain && !chainId) {
        throw new Error("At least one of chain or chain id is required");
      }
      return true;
    }).argv as {
    chain?: string;
    chainId?: number;
  };
  if (chainId) {
    return chainId as Chain;
  }
  return getChain(chain!);
}

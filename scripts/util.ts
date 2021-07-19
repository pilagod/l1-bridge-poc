import yargs from "yargs";
import Chain, { getChain } from "@network/chain";

export function parseChainArgs(): Chain {
  const { chain } = yargs
    .option("chain", {
      alias: "c",
      description: "Chain name or id",
      type: "string",
      demandOption: true,
    })
    .help()
    .alias("help", "h").argv as {
    chain: string;
  };
  return getChain(chain);
}

export function parseCrossChainArgs(): {
  from: Chain;
  to: Chain;
} {
  const { from, to } = yargs
    .option("from", {
      alias: "f",
      description: "From chain name or id",
      type: "string",
      demandOption: true,
    })
    .option("to", {
      alias: "t",
      description: "To chain name or id",
      type: "string",
      demandOption: true,
    })
    .help()
    .alias("help", "h").argv as {
    from: string;
    to: string;
  };
  return {
    from: getChain(from),
    to: getChain(to),
  };
}

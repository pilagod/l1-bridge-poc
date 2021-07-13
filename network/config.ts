import Chain, { getChains, getChainName } from "./chain";

const network: {
  [chain in Chain]: {
    chainId: number;
    url: string;
  };
} = {} as any;

for (const chain of getChains()) {
  network[chain] = {
    chainId: chain,
    url: process.env[`${getChainName(chain).toUpperCase()}_RPC_URL`] || "",
  };
}

export default network;

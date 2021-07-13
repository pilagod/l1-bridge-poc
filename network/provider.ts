import { ethers } from "ethers";
import Chain, { getChains } from "./chain";
import config from "./config";

const provider: {
  [chain in Chain]: ethers.providers.JsonRpcProvider;
} = {} as any;

for (const chain of getChains()) {
  provider[chain] = new ethers.providers.JsonRpcProvider(config[chain].url);
}

export default provider;

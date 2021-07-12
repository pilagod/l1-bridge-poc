import { ethers } from "ethers";
import config from "@network/config";

export const kovanProvider = new ethers.providers.JsonRpcProvider(
  config.kovan.url
);

export const rinkebyProvider = new ethers.providers.JsonRpcProvider(
  config.rinkeby.url
);

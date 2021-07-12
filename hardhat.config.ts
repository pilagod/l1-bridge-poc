import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";

import "hardhat-deploy";
import "tsconfig-paths/register";

import config from "@network/config";
import { kovanSigner, rinkebySigner } from "@network/signer";

export default {
  networks: {
    kovan: {
      url: config.kovan.url,
      accounts: [kovanSigner.privateKey],
    },
    rinkeby: {
      url: config.rinkeby.url,
      accounts: [rinkebySigner.privateKey],
    },
  },
  solidity: {
    version: "0.8.5",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";

import "dotenv/config";
import "hardhat-deploy";
import "tsconfig-paths/register";

import Chain from "@network/chain"
import config from "@network/config";
import signer from "@network/signer";

export default {
  networks: {
    kovan: {
      url: config[Chain.Kovan].url,
      accounts: [signer[Chain.Kovan].privateKey],
    },
    rinkeby: {
      url: config[Chain.Rinkeby].url,
      accounts: [signer[Chain.Rinkeby].privateKey],
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

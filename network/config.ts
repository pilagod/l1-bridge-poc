require("dotenv").config();

const network = {
  kovan: {
    chainId: 42,
    url: process.env.KOVAN_TESTNET_RPC || "",
  },
  rinkeby: {
    chainId: 4,
    url: process.env.RINKEBY_TESTNET_RPC || "",
  },
};

export default network;

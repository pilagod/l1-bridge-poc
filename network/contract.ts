import { ethers } from "ethers";
import {
  abi as KovanTKNABI,
  address as KovanTKNAddress,
} from "@deployments/kovan/TestToken.json";
import {
  abi as RinkebyTKNABI,
  address as RinkebyTKNAddress,
} from "@deployments/rinkeby/TestToken.json";
import { TestToken } from "@typechain";
import Chain from "./chain";
import signer from "./signer";

export const TKN: {
  [chain in Chain]: TestToken;
} = {
  [Chain.Kovan]: new ethers.Contract(
    KovanTKNAddress,
    KovanTKNABI,
    signer[Chain.Kovan]
  ) as TestToken,
  [Chain.Rinkeby]: new ethers.Contract(
    RinkebyTKNAddress,
    RinkebyTKNABI,
    signer[Chain.Rinkeby]
  ) as TestToken,
};

import { ethers } from "ethers";
import {
  abi as KovanTKNABI,
  address as KovanTKNAddress,
} from "@deployments/kovan/TestToken.json";
import {
  abi as RinkebyTKNABI,
  address as RinkebyTKNAddress,
} from "@deployments/rinkeby/TestToken.json";
import { kovanSigner, rinkebySigner } from "@network/signer";
import { TestToken } from "@typechain";

export const KovanTKN = new ethers.Contract(
  KovanTKNAddress,
  KovanTKNABI,
  kovanSigner
) as TestToken;

export const RinkebyTKN = new ethers.Contract(
  RinkebyTKNAddress,
  RinkebyTKNABI,
  rinkebySigner
) as TestToken;

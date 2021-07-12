import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy } = deployments;

  const [deployer] = await hre.ethers.getSigners();

  await deploy("TestToken", {
    from: deployer.address,
  });
};
export default func;
func.tags = ["TestToken"];

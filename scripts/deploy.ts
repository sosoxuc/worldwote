import { ethers } from "hardhat";

const hre = require("hardhat");

const WORLD_ID_ADDRESS = "0x38f6e15d86574b2d12ddc119b411C7027bcE349c";
const APP_ID = "app_staging_8e51b49daa766cfd178b3c6495f0d61a"
const ACTION_ID = "ioseb-x"

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

async function verifyContract(contractAddress, args) {
  await sleep(120)
  try{
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args
    });
    console.log("Source Verified");

  }
  catch (err) {
    console.log("error verify", err.message);
  }

}


async function main() {
  const [deployer] = await ethers.getSigners();

  const Wote = await ethers.getContractFactory("Wote");
  const vote = await Wote.deploy(WORLD_ID_ADDRESS, APP_ID, ACTION_ID);
  console.log(`Deployer address: ${deployer.address}`)
  console.log(`Wote address: ${vote.address}`)
  await verifyContract(vote.address, [WORLD_ID_ADDRESS, APP_ID, ACTION_ID]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
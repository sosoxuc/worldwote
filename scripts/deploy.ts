import * as fs from 'fs'
import { ethers } from "hardhat";
import { mimcSpongecontract } from 'circomlibjs'

const hre = require("hardhat");

const SEED = "mimcsponge";
const TREE_LEVELS = 20;

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
  const MiMCSponge = new ethers.ContractFactory(mimcSpongecontract.abi, mimcSpongecontract.createCode(SEED, 220), deployer)
  const mimcsponge = await MiMCSponge.deploy()
  console.log(`MiMC sponge hasher address: ${mimcsponge.address}`)

  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  console.log(`Verifier address: ${verifier.address}`)
  await verifyContract(verifier.address, []);

  const ZKTreeVote = await ethers.getContractFactory("ZKTreeVote");
  const zktreevote = await ZKTreeVote.deploy(TREE_LEVELS, mimcsponge.address, verifier.address, 4);
  console.log(`ZKTreeVote address: ${zktreevote.address}`)
  await verifyContract(zktreevote.address, [TREE_LEVELS, mimcsponge.address, verifier.address, 4]);


  fs.writeFileSync("static/contracts.json", JSON.stringify({
    mimc: mimcsponge.address,
    verifier: verifier.address,
    zktreevote: zktreevote.address
  }))
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
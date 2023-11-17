import {
    loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network  } from "hardhat";
import { expect } from "chai";

const WORLD_ID_ADDRESS = "0x38f6e15d86574b2d12ddc119b411C7027bcE349c";
const APP_ID = "test"
const ACTION_ID = "test"

describe("Wote", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployOneYearLockFixture() {

        // Contracts are deployed using the first signer/account by default
        const [owner, second, third] = await ethers.getSigners();


        const Wote = await ethers.getContractFactory("Wote");
        const vote = await Wote.deploy(WORLD_ID_ADDRESS, APP_ID, ACTION_ID);

        return {owner, second, third, vote};
    }

    describe("Deployment", function () {
        it("Should set the right arguments", async function () {
            const {owner, vote} = await loadFixture(deployOneYearLockFixture)

            expect(await vote.owner()).to.be.equal(owner.address)
            expect(await vote.worldId()).to.be.equal(WORLD_ID_ADDRESS)
        });
    });

    describe("Register Candidate", function () {
        it("Should get error while connecting without the deployer address", async function () {
            const {owner, second, vote} = await loadFixture(deployOneYearLockFixture)

            await expect(vote.connect(second).registerCandidate({
                candidateAddress: owner.address,
                description: "test1",
                imageURL: "test2",
                name: "test3"
            })).to.be.revertedWithCustomError(vote, "OwnableUnauthorizedAccount")
        });

        it("Should register correctly", async function () {
            const {owner, second, vote} = await loadFixture(deployOneYearLockFixture)

            const candidate = {
                candidateAddress: owner.address,
                description: "test1",
                imageURL: "test2",
                name: "test3"
            }

            await vote.registerCandidate(candidate)

            const candidates = await vote.getCandidates();

            expect(candidates.length).to.be.equal(1)
            expect(candidates[0].candidateAddress).to.be.equal(candidate.candidateAddress)
            expect(candidates[0].name).to.be.equal(candidate.name)
            expect(candidates[0].description).to.be.equal(candidate.description)
            expect(candidates[0].imageURL).to.be.equal(candidate.imageURL)
        });
    });

});


// SPDX-License-Identifier: UNLICENSED

import { IWorldID } from "./interfaces/IWorldID.sol";
import { ByteHasher } from './libs/ByteHasher.sol';
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity 0.8.21;

struct Candidate {
    address candidateAddress;
    string name;
    string description;
    string imageURL;
}

contract Wote is Ownable {
    using ByteHasher for bytes;

    /// @notice Thrown when attempting to reuse a nullifier
    error InvalidNullifier();

    /// @dev The address of the World ID Router contract that will be used for verifying proofs
    IWorldID public immutable worldId;

    /// @dev The keccak256 hash of the externalNullifier (unique identifier of the action performed), combination of appId and action
    uint256 internal immutable externalNullifierHash;

    /// @dev The World ID group ID (1 for Orb-verified)
    uint256 internal immutable groupId = 1;

    /// @dev Whether a nullifier hash has been used already. Used to guarantee an action is only performed once by a single person
    mapping(uint256 => bool) internal nullifierHashes;

    /// @dev candidates array
    Candidate[] public candidates;

    /// @dev count of the votes of the candidates
    mapping(uint256 => uint256) public votes;

    /// @param _worldId The WorldID instance that will verify the proofs
    /// @param _appId The World ID app ID
    /// @param _action The World ID action ID
    constructor(
        IWorldID _worldId,
        string memory _appId,
        string memory _action
    ) Ownable(msg.sender)
    {
        worldId = _worldId;
        externalNullifierHash = abi
        .encodePacked(abi.encodePacked(_appId).hashToField(), _action)
        .hashToField();
    }

    function hashToField(bytes memory value) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(value))) >> 8;
    }

    /// @param signal An arbitrary input from the user that cannot be tampered with. In this case, it is the user's wallet address.
    /// @param root The root (returned by the IDKit widget).
    /// @param nullifierHash The nullifier hash for this proof, preventing double signaling (returned by the IDKit widget).
    /// @param proof The zero-knowledge proof that demonstrates the claimer is registered with World ID (returned by the IDKit widget).
    function verifyAndExecute(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof,
        uint256 option
    ) public {
        // First, we make sure this person hasn't done this before
        if (nullifierHashes[nullifierHash]) revert InvalidNullifier();

        // We now verify the provided proof is valid and the user is verified by World ID
        worldId.verifyProof(
            root,
            abi.encodePacked(signal).hashToField(),
            nullifierHash,
            externalNullifierHash,
            proof
        );

        // We now record the user has done this, so they can't do it again (sybil-resistance)
        nullifierHashes[nullifierHash] = true;

        // actual vote logic

        require(option < candidates.length, "Wote: Invalid option");
        // increasing option's vote count
        votes[option] += 1;
    }

    /// @param candidate info about candidate, see Candidate structure
    function registerCandidate(Candidate memory candidate) public onlyOwner {
        candidates.push(candidate);
    }

    /// @dev gets all candidates
    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }
}

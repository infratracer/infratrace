// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InfraTrace Decision Anchor
 * @notice Stores SHA-256 decision hashes on-chain for tamper-proof audit trails.
 *         Each project has a sequence of decisions, each anchored with its hash.
 */
contract InfraTrace {
    struct Anchor {
        bytes32 decisionHash;
        uint256 timestamp;
        address submittedBy;
    }

    // projectId => sequence => Anchor
    mapping(bytes32 => mapping(uint256 => Anchor)) public anchors;

    // projectId => latest sequence number
    mapping(bytes32 => uint256) public latestSequence;

    event DecisionAnchored(
        bytes32 indexed projectId,
        uint256 indexed sequence,
        bytes32 decisionHash,
        address submittedBy,
        uint256 timestamp
    );

    /**
     * @notice Anchor a decision hash for a project.
     * @param projectId  UUID of the project (left-padded to bytes32)
     * @param sequence   Decision sequence number within the project
     * @param decisionHash  SHA-256 hash of the decision record
     */
    function anchorDecision(
        bytes32 projectId,
        uint256 sequence,
        bytes32 decisionHash
    ) external {
        require(decisionHash != bytes32(0), "Empty hash");
        require(anchors[projectId][sequence].timestamp == 0, "Already anchored");

        anchors[projectId][sequence] = Anchor({
            decisionHash: decisionHash,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        if (sequence > latestSequence[projectId]) {
            latestSequence[projectId] = sequence;
        }

        emit DecisionAnchored(
            projectId,
            sequence,
            decisionHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Verify a decision hash matches what was anchored on-chain.
     * @return True if the hash matches the stored anchor.
     */
    function verifyDecision(
        bytes32 projectId,
        uint256 sequence,
        bytes32 expectedHash
    ) external view returns (bool) {
        Anchor memory a = anchors[projectId][sequence];
        if (a.timestamp == 0) return false;
        return a.decisionHash == expectedHash;
    }

    /**
     * @notice Get the full anchor data for a decision.
     */
    function getAnchor(
        bytes32 projectId,
        uint256 sequence
    ) external view returns (bytes32, uint256, address) {
        Anchor memory a = anchors[projectId][sequence];
        return (a.decisionHash, a.timestamp, a.submittedBy);
    }
}

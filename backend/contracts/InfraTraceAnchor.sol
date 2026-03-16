// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InfraTraceAnchor
/// @notice Immutable on-chain anchoring of infrastructure decision hashes.
///         Deployed on Polygon Amoy testnet (chain ID 80002).
/// @dev    Each project (identified by a bytes32 UUID) maintains a strictly
///         sequential chain of decision hashes. Only the contract owner may
///         submit anchors, ensuring a single trusted backend relayer.
contract InfraTraceAnchor {

    // ---------------------------------------------------------------
    //  Types
    // ---------------------------------------------------------------

    struct Anchor {
        bytes32 decisionHash;
        uint256 timestamp;
        address submittedBy;
    }

    // ---------------------------------------------------------------
    //  State
    // ---------------------------------------------------------------

    address public owner;

    /// @notice projectId => sequence => Anchor
    mapping(bytes32 => mapping(uint256 => Anchor)) public anchors;

    /// @notice Tracks the latest sequence number written for each project.
    ///         A value of 0 means no anchors exist yet (sequence starts at 1).
    mapping(bytes32 => uint256) public latestSequence;

    // ---------------------------------------------------------------
    //  Events
    // ---------------------------------------------------------------

    event DecisionAnchored(
        bytes32 indexed projectId,
        uint256 indexed sequence,
        bytes32 decisionHash,
        address submittedBy,
        uint256 timestamp
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ---------------------------------------------------------------
    //  Errors (custom errors are cheaper than require strings)
    // ---------------------------------------------------------------

    error NotOwner();
    error InvalidHash();
    error SequenceMismatch(uint256 expected, uint256 provided);
    error AnchorNotFound();

    // ---------------------------------------------------------------
    //  Modifiers
    // ---------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ---------------------------------------------------------------
    //  Constructor
    // ---------------------------------------------------------------

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ---------------------------------------------------------------
    //  Write functions
    // ---------------------------------------------------------------

    /// @notice Anchor a decision hash on-chain for a given project.
    /// @param projectId  bytes32 representation of the project UUID.
    /// @param sequence   Must equal latestSequence[projectId] + 1 (sequential).
    /// @param decisionHash  SHA-256 (or keccak) hash of the decision record.
    function anchorDecision(
        bytes32 projectId,
        uint256 sequence,
        bytes32 decisionHash
    ) external onlyOwner {
        if (decisionHash == bytes32(0)) revert InvalidHash();

        uint256 expected = latestSequence[projectId] + 1;
        if (sequence != expected) revert SequenceMismatch(expected, sequence);

        anchors[projectId][sequence] = Anchor({
            decisionHash: decisionHash,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        latestSequence[projectId] = sequence;

        emit DecisionAnchored(
            projectId,
            sequence,
            decisionHash,
            msg.sender,
            block.timestamp
        );
    }

    // ---------------------------------------------------------------
    //  Read functions
    // ---------------------------------------------------------------

    /// @notice Verify that a stored anchor matches the expected hash.
    /// @return True if the anchor exists and its hash equals `expectedHash`.
    function verifyDecision(
        bytes32 projectId,
        uint256 sequence,
        bytes32 expectedHash
    ) external view returns (bool) {
        return anchors[projectId][sequence].decisionHash == expectedHash;
    }

    /// @notice Retrieve the full anchor record for a project + sequence.
    /// @return decisionHash  The stored hash.
    /// @return timestamp     Block timestamp when the anchor was written.
    /// @return submittedBy   Address that submitted the anchor.
    function getAnchor(
        bytes32 projectId,
        uint256 sequence
    ) external view returns (bytes32, uint256, address) {
        Anchor storage a = anchors[projectId][sequence];
        return (a.decisionHash, a.timestamp, a.submittedBy);
    }

    // ---------------------------------------------------------------
    //  Admin
    // ---------------------------------------------------------------

    /// @notice Transfer ownership to a new address. Set to address(0) to renounce.
    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

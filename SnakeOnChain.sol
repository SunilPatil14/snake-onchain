// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SnakeOnChain {
    struct Player {
        uint256 highScore;
        uint256 lastPlayed;
    }

    // Constants
    uint256 public constant MAX_SCORE = 1_000_000;
    uint256 public constant COOLDOWN_TIME = 1 hours;
    uint256 public constant FIXED_FEE = 0.0001 ether; // Fixed fee per submission

    // Owner and storage
    address public owner;
    mapping(address => Player) public players;
    address[] private playerList;
    uint256 public totalFeesCollected;

    // Events
    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);
    event FeeCollected(address indexed player, uint256 amount);
    event FeesWithdrawn(uint256 amount);

    constructor() {
        owner = msg.sender; // Automatically sets deployer as owner
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier validScore(uint256 _score) {
        require(_score <= MAX_SCORE, "Score exceeds maximum");
        require(
            players[msg.sender].lastPlayed == 0 ||
            block.timestamp > players[msg.sender].lastPlayed + COOLDOWN_TIME,
            "Cooldown active"
        );
        _;
    }

    // Submit score with fixed fee
    function submitScore(uint256 _score) external payable validScore {
    require(msg.value >= FIXED_FEE, "Insufficient fee");

    Player storage player = players[msg.sender];
    if (_score > player.highScore) {
        player.highScore = _score;
    }
    player.lastPlayed = block.timestamp;

    // ✅ Add new player if not in list
    if (!_contains(playerList, msg.sender)) {
        playerList.push(msg.sender);
    }

    totalFeesCollected += msg.value;
    emit ScoreSubmitted(msg.sender, _score, block.timestamp);
    emit FeeCollected(msg.sender, msg.value);
}


    // Owner can withdraw all collected fees
    function withdrawFees() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "No fees to withdraw");

        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");

        totalFeesCollected = 0;
        emit FeesWithdrawn(amount);
    }

    // Helper function to check contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Check if address exists in playerList
    function _contains(address[] storage arr, address _addr) internal view returns (bool) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _addr) return true;
        }
        return false;
    }

    // Get caller's score
    function getMyScore() external view returns (uint256, uint256) {
        Player memory player = players[msg.sender];
        return (player.highScore, player.lastPlayed);
    }

    // Get top 5 players
    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        // [Keep your existing getLeaderboard implementation]
        uint256 n = playerList.length;
        if (n == 0) return (new address[](0), new uint256[](0));

        address[] memory sortedAddresses = new address[](n);
        uint256[] memory sortedScores = new uint256[](n);

        for (uint256 i = 0; i < n; i++) {
            address playerAddr = playerList[i];
            sortedAddresses[i] = playerAddr;
            sortedScores[i] = players[playerAddr].highScore;
        }

        // Bubble sort
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (sortedScores[j] < sortedScores[j + 1]) {
                    (sortedScores[j], sortedScores[j + 1]) = (sortedScores[j + 1], sortedScores[j]);
                    (sortedAddresses[j], sortedAddresses[j + 1]) = (sortedAddresses[j + 1], sortedAddresses[j]);
                }
            }
        }

        uint256 returnSize = n < 5 ? n : 5;
        address[] memory topAddresses = new address[](returnSize);
        uint256[] memory topScores = new uint256[](returnSize);
        for (uint256 i = 0; i < returnSize; i++) {
            topAddresses[i] = sortedAddresses[i];
            topScores[i] = sortedScores[i];
        }

        return (topAddresses, topScores);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FlexibleForwarder {
    // Contract owner
    address public immutable owner;

    // Rounding factor (10^13 = 5 decimal places of ETH)
    uint256 private constant ROUNDING_FACTOR = 10 ** 13;

    // Gas cost multiplier (500% of actual cost)
    uint256 private constant GAS_MULTIPLIER = 500;

    // Minimum reimbursement amount
    uint256 public minReimbursement = 10 ** 16; // 0.01 ETH or equivalent

    // Store last reimbursement amount
    uint256 public lastReimbursement;

    // Event to log reimbursements
    event GasReimbursed(
        address indexed recipient,
        uint256 amount,
        uint256 exactGasCost
    );
    event PaymentForwarded(
        address indexed sender,
        address indexed receiver,
        uint256 amount
    );

    constructor() {
        owner = msg.sender;
    }

    // Modifier to restrict functions to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Function to accept payments that will be stored in the contract
    receive() external payable onlyOwner {}

    // Fund the contract to enable gas reimbursements (owner only)
    function fundContract() external payable onlyOwner {}

    // Set minimum reimbursement (owner only)
    function setMinReimbursement(uint256 newMinimum) external onlyOwner {
        minReimbursement = newMinimum;
    }

    // Forward payment and reimburse gas with increased amount
    function forwardPayment(
        address payable sender,
        address payable receiver
    ) external payable {
        // Record starting gas
        uint256 startGas = gasleft();

        // Ensure the sender is the msg.sender
        require(
            msg.sender == sender,
            "Sender must match the transaction sender"
        );
        require(receiver != address(0), "Receiver cannot be zero address");
        require(sender != receiver, "Sender and receiver must be different");

        // Forward the exact amount that was sent
        receiver.transfer(msg.value);

        // Emit payment forwarded event
        emit PaymentForwarded(sender, receiver, msg.value);

        // Calculate gas used so far plus a larger buffer for remaining operations
        uint256 gasUsed = startGas - gasleft() + 50000; // Increased buffer

        // Calculate gas cost with multiplier (500% of actual cost)
        uint256 exactGasCost = gasUsed * tx.gasprice;
        uint256 increasedGasCost = (exactGasCost * GAS_MULTIPLIER) / 100;

        // Round to 5 decimal places
        uint256 roundedGasCost = (increasedGasCost / ROUNDING_FACTOR) *
            ROUNDING_FACTOR;

        // Ensure we meet the minimum reimbursement
        if (roundedGasCost < minReimbursement) {
            roundedGasCost = minReimbursement;
        }

        // Store the reimbursement amount for reference
        lastReimbursement = roundedGasCost;

        // Check if contract has enough balance for reimbursement
        require(
            address(this).balance >= roundedGasCost,
            "Insufficient balance for gas reimbursement"
        );

        // Reimburse with rounded amount
        payable(sender).transfer(roundedGasCost);

        // Emit event with reimbursement details
        emit GasReimbursed(sender, roundedGasCost, exactGasCost);
    }

    // Check the contract's balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Get the last reimbursement amount
    function getLastReimbursement() external view returns (uint256) {
        return lastReimbursement;
    }

    // Emergency withdrawal if needed (owner only)
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MultiSigWallet {
    error OwnersRequired();
    error InvalidRequiredConfirmations();
    error ZeroAddressOwner();
    error DuplicateOwner(address owner);
    error NotOwner(address caller);
    error TransactionDoesNotExist(uint256 txId);
    error TransactionAlreadyExecuted(uint256 txId);
    error TransactionAlreadyConfirmed(uint256 txId, address owner);
    error TransactionNotConfirmed(uint256 txId, address owner);
    error InsufficientConfirmations(uint256 current, uint256 required);
    error InvalidTarget();
    error TransactionExecutionFailed();

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }

    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txId,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txId);
    event RevokeConfirmation(address indexed owner, uint256 indexed txId);
    event ExecuteTransaction(address indexed owner, uint256 indexed txId);

    address[] private s_owners;
    mapping(address => bool) public isOwner;
    mapping(uint256 => mapping(address => bool)) private s_confirmations;
    Transaction[] private s_transactions;

    uint256 public immutable required;

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) {
            revert NotOwner(msg.sender);
        }
        _;
    }

    modifier txExists(uint256 txId) {
        if (txId >= s_transactions.length) {
            revert TransactionDoesNotExist(txId);
        }
        _;
    }

    modifier notExecuted(uint256 txId) {
        if (s_transactions[txId].executed) {
            revert TransactionAlreadyExecuted(txId);
        }
        _;
    }

    modifier notConfirmed(uint256 txId) {
        if (s_confirmations[txId][msg.sender]) {
            revert TransactionAlreadyConfirmed(txId, msg.sender);
        }
        _;
    }

    constructor(address[] memory owners_, uint256 required_) payable {
        uint256 ownersLength = owners_.length;

        if (ownersLength == 0) {
            revert OwnersRequired();
        }

        if (required_ == 0 || required_ > ownersLength) {
            revert InvalidRequiredConfirmations();
        }

        for (uint256 i = 0; i < ownersLength; i++) {
            address owner = owners_[i];

            if (owner == address(0)) {
                revert ZeroAddressOwner();
            }

            if (isOwner[owner]) {
                revert DuplicateOwner(owner);
            }

            isOwner[owner] = true;
            s_owners.push(owner);
        }

        required = required_;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (uint256 txId) {
        if (to == address(0)) {
            revert InvalidTarget();
        }

        txId = s_transactions.length;
        s_transactions.push(
            Transaction({
                to: to,
                value: value,
                data: data,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, txId, to, value, data);
    }

    function confirmTransaction(
        uint256 txId
    ) external onlyOwner txExists(txId) notExecuted(txId) notConfirmed(txId) {
        s_confirmations[txId][msg.sender] = true;
        s_transactions[txId].numConfirmations += 1;

        emit ConfirmTransaction(msg.sender, txId);
    }

    function executeTransaction(
        uint256 txId
    ) external onlyOwner txExists(txId) notExecuted(txId) {
        Transaction storage transaction = s_transactions[txId];

        if (transaction.numConfirmations < required) {
            revert InsufficientConfirmations(
                transaction.numConfirmations,
                required
            );
        }

        transaction.executed = true;

        (bool success, bytes memory returnData) = transaction.to.call{
            value: transaction.value
        }(transaction.data);

        if (!success) {
            _revertWithData(returnData);
        }

        emit ExecuteTransaction(msg.sender, txId);
    }

    function revokeConfirmation(
        uint256 txId
    ) external onlyOwner txExists(txId) notExecuted(txId) {
        if (!s_confirmations[txId][msg.sender]) {
            revert TransactionNotConfirmed(txId, msg.sender);
        }

        s_confirmations[txId][msg.sender] = false;
        s_transactions[txId].numConfirmations -= 1;

        emit RevokeConfirmation(msg.sender, txId);
    }

    function getOwners() external view returns (address[] memory) {
        return s_owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return s_transactions.length;
    }

    function getTransaction(
        uint256 txId
    )
        external
        view
        txExists(txId)
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations
        )
    {
        Transaction storage transaction = s_transactions[txId];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    function isConfirmed(
        uint256 txId,
        address owner
    ) external view txExists(txId) returns (bool) {
        return s_confirmations[txId][owner];
    }

    function _revertWithData(bytes memory returnData) private pure {
        if (returnData.length == 0) {
            revert TransactionExecutionFailed();
        }

        assembly ("memory-safe") {
            revert(add(returnData, 32), mload(returnData))
        }
    }
}

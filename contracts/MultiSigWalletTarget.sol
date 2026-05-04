// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MultiSigWalletTarget {
    uint256 public value;
    uint256 public callCount;

    event ValueUpdated(uint256 newValue, uint256 callCount, uint256 msgValue);

    function setValue(uint256 newValue) external payable {
        value = newValue;
        callCount += 1;

        emit ValueUpdated(newValue, callCount, msg.value);
    }
}

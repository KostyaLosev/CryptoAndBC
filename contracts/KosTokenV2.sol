// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./KosTokenV1.sol";

contract KosTokenV2 is KosTokenV1 {
    function version() public pure returns (string memory) {
        return "V2";
    }
}

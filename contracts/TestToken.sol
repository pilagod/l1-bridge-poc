// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    /* solhint-disable no-empty-blocks */
    constructor() ERC20("TestToken", "TKN") {}

    function mint(address _to, uint256 _amount) public returns (bool) {
        _mint(_to, _amount);
        return true;
    }
}

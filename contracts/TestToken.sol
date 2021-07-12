// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TestToken is ERC20 {
    using SafeMath for uint256;

    event Deposit(
        uint256 indexed fromChainId,
        address indexed from,
        uint256 toChainId,
        address indexed to,
        uint256 amount
    );
    event Withdraw(
        uint256 fromChainId,
        address indexed from,
        uint256 indexed toChainId,
        address indexed to,
        uint256 amount
    );

    /* solhint-disable no-empty-blocks */
    constructor() ERC20("TestToken", "TKN") {}

    function deposit(
        uint256 _fromChainId,
        address _from,
        address _to,
        uint256 _amount
    ) public returns (bool) {
        _mint(_to, _amount);
        emit Deposit(_fromChainId, _from, getChainID(), _to, _amount);
        return true;
    }

    function withdraw(
        uint256 _toChainId,
        address _to,
        uint256 _amount
    ) public returns (bool) {
        _burn(msg.sender, _amount);
        emit Withdraw(getChainID(), msg.sender, _toChainId, _to, _amount);
        return true;
    }

    function mint(address _to, uint256 _amount) public returns (bool) {
        _mint(_to, _amount);
        return true;
    }

    function getChainID() private view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.14;

contract Meta {
  address public owner;

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  receive() external payable {}

  function ROOT4146650865() external payable { //0x00000000 (only for initialization)
    require(owner==address(0));
    owner = tx.origin; //owner of Factory
  }

  function kill() external payable onlyOwner { //Must evoke before update
    selfdestruct(payable(address(owner)));
  } //from ↓ additional logic can be implemented.
}
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.14;

contract Factory {
  address private owner;
  address public ROOT4146650865; //"00000000" in codeConst (to get addrTmp)

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  constructor(address _owner) {
    owner = _owner;
  }

  function deploy(bytes32 salt, bytes memory codeNew, bytes memory data) external payable onlyOwner returns(address addrConst, address addrTmp) {

    //deploy N version of Meta initially at addrTmp (normal deployment)
    assembly {
      addrTmp := create(0, add(0x20, codeNew), mload(codeNew))
      if iszero(extcodesize(addrTmp)) {
        revert(0, 0)
      }
    }

    ROOT4146650865 = addrTmp;

    /**
      * Raw bytecode that in practice:
      *   1. Deploys transient contract at "addrConst" (determined by salt, codeConst & factory address).
      *   2. Swaps code at "addrConst" with code at "addrTmp"
     */
    bytes memory codeConst = hex"5860208158601c335a63000000008752fa158151803b80938091923cf3";

    assembly {
      addrConst := create2(callvalue(), add(0x20, codeConst), mload(codeConst), salt)
      if iszero(extcodesize(addrConst)) {
        revert(0, 0)
      }
    }

    //call ROOT4146650865() (aka 0x00000000) to initialize Meta.sol
    if(data.length>0){
      (bool success, ) = addrConst.call(data);
      require(success, 'Err: init();');
    }
  }

  function changeOwner(address newOwner) external payable onlyOwner {
    owner = newOwner;
  }
}
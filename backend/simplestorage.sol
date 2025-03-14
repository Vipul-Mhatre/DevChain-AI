// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleStorage
 * @dev This contract demonstrates a basic storage pattern in Solidity.
 * It allows setting and retrieving a single uint256 value.
 */
contract SimpleStorage {
    // State variable to store the uint256 value.  Initialized to 0.
    uint256 public storedData;

    /**
     * @dev Sets the `storedData` to a new value.
     * @param _x The new value to store.
     */
    function set(uint256 _x) public {
        storedData = _x;
    }

    /**
     * @dev Retrieves the current value of `storedData`.
     * @return The current value of `storedData`.
     */
    function get() public view returns (uint256) {
        return storedData;
    }
}
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721.sol";

    /**
     * @dev Welcome, this is the KCollection.
     *
     * Note Everyone can mint a new ERC721 token in this collection since this collection require no minter role 
     * (The requirement of the mid-term test is Free mint, as I understand here is everyone are free to mint, no restriction)
     * But if the tokenId already exists, you need to mint another tokenId
     *
     */
contract KCollection is ERC721 {
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    function mint(address _to, uint256 tokenId) public {
        _safeMint(_to, tokenId);
    }

    // the base Uniform Resource Identifier (URI) for `tokenId` token
    function _baseURI() internal pure override returns (string memory) {
        return "https://www.google.com/search?q=";
    }

}

//SPDX-License-Identifier: Unlicense
pragma solidity >=0.7.0;

import "./ERC20.sol";
import "./Pausable.sol";
import "./AccessControl.sol";
import "./maths/SafeMath.sol";

contract KToken is ERC20, AccessControl, Pausable {
    using SafeMath for uint256;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER");
    uint256 maxBalance = uint256(1000000000).mul(1e18);
    uint256 marketcapMinted = 0;

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
        _setupRole(BURNER_ROLE, _msgSender());
        _setRoleAdmin(BURNER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    modifier onlyMinter(address account) {
        require(
            hasRole(MINTER_ROLE, account),
            "KToken: caller is not the minter"
        );
        _;
    }
    
    modifier onlyBurner(address account) {
        require(
            hasRole(BURNER_ROLE, account),
            "KToken: caller is not the burner"
        );
        _;
    }

    modifier onlyAdmin(address account) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, account),
            "KToken: caller is not the admin"
        );
        _;
    }

    function mint(address _to, uint256 _amount) public onlyMinter(msg.sender) {
        require(marketcapMinted.add(_amount) < maxBalance, "KToken: cannot mint exceed max amount");
        _mint(_to, _amount);
        marketcapMinted.add(_amount);
    }

    function burn(uint256 amount) public onlyBurner(msg.sender) {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public onlyBurner(msg.sender) {
        uint256 decreasedAllowance = allowance(account, _msgSender()).sub(amount, "ERC20: burn amount exceeds allowance");

        _approve(account, _msgSender(), decreasedAllowance);
        _burn(account, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        require(!paused(), "KToken: token transfer while paused");
    }

    function pauseTransaction() public onlyAdmin(msg.sender) {
        _pause();
    }

    function unpauseTransaction() public onlyAdmin(msg.sender) {
        _unpause();
    }

}

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/finance/VestingWallet.sol";


contract VestingToken is ERC20, AccessControl {
    using SafeMath for uint256;
    bytes32 public constant BURNER_ROLE = keccak256("BURNER");
    address public constant BURN_ADDRESS = address(uint160(uint(keccak256(abi.encodePacked('KIEN')))));
    address public constant ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
    uint256 totalLiquidity = uint256(1_000_000).mul(1e18);
    uint256 BASE_RATE = 100;

    struct VestingType {
        uint256 cliffDuration;
        uint256 vestingDuration;
        uint256 amount;
        uint256 totalTransfer;
    }

    struct UserInfo  {
        uint256 grantedAmount;
        uint256 cliffStartDate;
        uint256 cliffEndDate;
    }

    VestingType public angelInvestor;
    VestingType public privateSale;
    VestingType public publicSale;

    mapping (address => VestingWallet) VestingWalletInfo;
    mapping (address => uint256) userGrantedAmount;
    
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
        _setRoleAdmin(BURNER_ROLE, DEFAULT_ADMIN_ROLE);
        _mint(_msgSender(), totalLiquidity);
        angelInvestor = VestingType(1 weeks, 4 weeks, 40, 0);
        privateSale = VestingType(3 days, 1 days, 30, 0);
        publicSale = VestingType(0, 0, 30, 0);
    }

    modifier onlyBurner(address account) {
        require(
            hasRole(BURNER_ROLE, account),
            "VestingToken: caller is not the burner"
        );
        _;
    }

    modifier onlyAdmin(address account) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, account),
            "VestingToken: caller is not the admin"
        );
        _;
    }

    function burn(uint256 _amount) public onlyBurner(_msgSender()) {
        transferFrom(_msgSender(), BURN_ADDRESS, _amount);
    }

    function changeInvestorsSchedules(uint256 _cliffDuration, uint256 _vestingDuration) public onlyAdmin(_msgSender()) {
        angelInvestor.cliffDuration = _cliffDuration;
        angelInvestor.vestingDuration = _vestingDuration;
    }
    function changePrivateSaleSchedules(uint256 _cliffDuration, uint256 _vestingDuration) public onlyAdmin(_msgSender()) {
        privateSale.cliffDuration = _cliffDuration;
        privateSale.vestingDuration = _vestingDuration;
    }
    function changePublicSaleSchedules(uint256 _cliffDuration, uint256 _vestingDuration) public onlyAdmin(_msgSender()) {
        publicSale.cliffDuration = _cliffDuration;
        publicSale.vestingDuration = _vestingDuration;
    }

    function grantTokenToInvestor(address _to, uint256 _amount) public onlyAdmin(_msgSender()){
        require(_amount.add(angelInvestor.totalTransfer) < totalLiquidity.mul(angelInvestor.amount).div(BASE_RATE), "VestingToken: Exceed allowed amount");
        require(address(VestingWalletInfo[_to]) == ZERO_ADDRESS, "VestingToken: Token has already granted to this address");
        require(_to != ZERO_ADDRESS, "VestingToken: Can't send to zero address");
        uint256 vestingStartDate = block.timestamp.add(angelInvestor.cliffDuration);
        VestingWallet vestingWalletInfo = new VestingWallet(_to, uint64(vestingStartDate), uint64(angelInvestor.vestingDuration));
        VestingWalletInfo[_to] = vestingWalletInfo;
        userGrantedAmount[_to] = userGrantedAmount[_to].add(_amount);
        angelInvestor.totalTransfer = angelInvestor.totalTransfer.add(_amount);
        transfer(address(vestingWalletInfo), _amount);      
    }

    function grantTokenToPrivateSale(address _to, uint256 _amount) public onlyAdmin(_msgSender()){
        require(_amount.add(privateSale.totalTransfer) < totalLiquidity.mul(privateSale.amount).div(BASE_RATE), "VestingToken: Exceed allowed amount");
        require(address(VestingWalletInfo[_to]) == ZERO_ADDRESS, "VestingToken: Token has already granted to this address");
        require(_to != ZERO_ADDRESS, "VestingToken: Can't send to zero address");
        uint256 vestingStartDate = block.timestamp.add(privateSale.cliffDuration);
        VestingWallet vestingWalletInfo = new VestingWallet(_to, uint64(vestingStartDate), uint64(privateSale.vestingDuration));
        VestingWalletInfo[_to] = vestingWalletInfo;
        userGrantedAmount[_to] = userGrantedAmount[_to].add(_amount);
        privateSale.totalTransfer = privateSale.totalTransfer.add(_amount);
        transfer(address(vestingWalletInfo), _amount);    
    }

    function grantTokenToPublicSale(address _to, uint256 _amount) public onlyAdmin(_msgSender()){
        require(_amount.add(publicSale.totalTransfer) < totalLiquidity.mul(publicSale.amount).div(BASE_RATE), "VestingToken: Exceed allowed amount");
        require(address(VestingWalletInfo[_to]) == ZERO_ADDRESS, "VestingToken: Token has already granted to this address");
        require(_to != ZERO_ADDRESS, "VestingToken: Can't send to zero address");
        uint256 vestingStartDate = block.timestamp.add(publicSale.cliffDuration);
        VestingWallet vestingWalletInfo = new VestingWallet(_to, uint64(vestingStartDate), uint64(publicSale.vestingDuration));
        VestingWalletInfo[_to] = vestingWalletInfo;
        userGrantedAmount[_to] = userGrantedAmount[_to].add(_amount);
        publicSale.totalTransfer = publicSale.totalTransfer;
        transfer(address(vestingWalletInfo), _amount);   
    }

    function getGrantedAmount(address _user) public view returns(uint256){
        return userGrantedAmount[_user];
    }

    function getLockedAmount(address _user) public view returns(uint256){
        return userGrantedAmount[_user].sub(VestingWalletInfo[_user].vestedAmount(address(this), uint64(block.timestamp)));
    }

    function getUnlockedAmount(address _user) public view returns(uint256){
        return VestingWalletInfo[_user].vestedAmount(address(this), uint64(block.timestamp));
    }

    function pendingUnlockedTokenToClaim(address _user) public view returns(uint256){
        return VestingWalletInfo[_user].vestedAmount(address(this), uint64(block.timestamp)).sub(VestingWalletInfo[_user].released(address(this)));
    }

    function claimAndTransferUnlockedToken(address _to, uint256 _amount) public {
        claimUnlockedToken();
        transferFrom(_msgSender(), _to, _amount);
    }

    function claimUnlockedToken() public {
        VestingWalletInfo[_msgSender()].release(address(this));
    }
}

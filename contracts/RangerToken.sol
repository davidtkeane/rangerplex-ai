// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RangerToken
 * @dev ERC20-like token for the RangerBlock ecosystem
 * @author Rangers Lead The Way! 🎖️
 *
 * Features:
 * - Minting (owner only)
 * - Burning (token holders)
 * - Pausable transfers (owner only)
 * - Transfer allowances
 * - Event logging for all operations
 */
contract RangerToken {

    // ========================================================================
    // STATE VARIABLES
    // ========================================================================

    string public constant name = "Ranger Token";
    string public constant symbol = "RANGER";
    uint8 public constant decimals = 18;

    uint256 private _totalSupply;
    address public owner;
    bool public paused;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // ========================================================================
    // EVENTS
    // ========================================================================

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    // ========================================================================
    // MODIFIERS
    // ========================================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Token transfers are paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Token transfers are not paused");
        _;
    }

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor(uint256 initialSupply) {
        owner = msg.sender;
        paused = false;
        _mint(msg.sender, initialSupply * 10**decimals);
    }

    // ========================================================================
    // ERC20 STANDARD FUNCTIONS
    // ========================================================================

    /**
     * @dev Returns the total token supply
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Returns the balance of an account
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Transfer tokens to a specified address
     */
    function transfer(address to, uint256 amount) public whenNotPaused returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(_balances[msg.sender] >= amount, "Insufficient balance");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /**
     * @dev Returns the remaining allowance for a spender
     */
    function allowance(address tokenOwner, address spender) public view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }

    /**
     * @dev Approve a spender to spend tokens on your behalf
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "Cannot approve zero address");

        _allowances[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another using allowance
     */
    function transferFrom(address from, address to, uint256 amount)
        public
        whenNotPaused
        returns (bool)
    {
        require(to != address(0), "Cannot transfer to zero address");
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");

        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;

        emit Transfer(from, to, amount);
        return true;
    }

    // ========================================================================
    // EXTENDED FUNCTIONS
    // ========================================================================

    /**
     * @dev Mint new tokens (owner only)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from your own balance
     */
    function burn(uint256 amount) public {
        require(_balances[msg.sender] >= amount, "Insufficient balance to burn");

        _balances[msg.sender] -= amount;
        _totalSupply -= amount;

        emit Burn(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }

    /**
     * @dev Pause all token transfers (owner only)
     */
    function pause() public onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpause token transfers (owner only)
     */
    function unpause() public onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Transfer ownership to a new address (owner only)
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Cannot transfer to zero address");

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /**
     * @dev Renounce ownership (owner only) - WARNING: Irreversible!
     */
    function renounceOwnership() public onlyOwner {
        address previousOwner = owner;
        owner = address(0);

        emit OwnershipTransferred(previousOwner, address(0));
    }

    // ========================================================================
    // INTERNAL FUNCTIONS
    // ========================================================================

    /**
     * @dev Internal mint function
     */
    function _mint(address to, uint256 amount) internal {
        _totalSupply += amount;
        _balances[to] += amount;

        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    // ========================================================================
    // VIEW FUNCTIONS (Utilities)
    // ========================================================================

    /**
     * @dev Check if an address is the owner
     */
    function isOwner(address account) public view returns (bool) {
        return account == owner;
    }

    /**
     * @dev Check if transfers are paused
     */
    function isPaused() public view returns (bool) {
        return paused;
    }
}

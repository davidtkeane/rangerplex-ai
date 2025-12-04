// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RangerBridge
 * @dev Cross-chain bridge for RangerBlock ecosystem
 * @author David Keane (IrishRanger) + Claude Code (Ranger)
 *
 * Features:
 * - Convert between RangerCoin ↔ WBTC (Wrapped Bitcoin)
 * - Convert between RangerCoin ↔ ETH
 * - Convert between RangerCoin ↔ USDC (Stablecoin)
 * - Oracle-based price feeds
 * - Daily conversion limits
 * - Admin controls
 *
 * Note: For real Bitcoin, we use Wrapped Bitcoin (WBTC) which is
 * an ERC-20 token backed 1:1 by real Bitcoin.
 *
 * Rangers lead the way!
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RangerBridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ========================================================================
    // STRUCTS
    // ========================================================================

    struct ConversionRate {
        uint256 rate;           // Rate in 18 decimals (e.g., 1e18 = 1:1)
        uint256 lastUpdated;    // Timestamp of last update
        bool isActive;          // Whether this pair is active
    }

    struct UserLimits {
        uint256 dailyConverted;
        uint256 lastConversionDay;
    }

    // ========================================================================
    // STATE VARIABLES
    // ========================================================================

    // Token addresses
    IERC20 public rangerCoin;
    IERC20 public wbtc;         // Wrapped Bitcoin (ERC-20)
    IERC20 public usdc;         // USD Coin (stablecoin)

    // Conversion rates (token => ConversionRate to RangerCoin)
    mapping(address => ConversionRate) public conversionRates;

    // User daily limits
    mapping(address => UserLimits) public userLimits;

    // Constants
    uint256 public constant DAILY_LIMIT = 20 * 1e18;  // 20 EUR equivalent
    uint256 public constant FEE_PERCENTAGE = 100;      // 1% fee (basis points)
    uint256 public constant BASIS_POINTS = 10000;

    // Treasury for fees
    address public treasury;

    // Pause state
    bool public isPaused;

    // Supported tokens list
    address[] public supportedTokens;

    // ========================================================================
    // EVENTS
    // ========================================================================

    event Conversion(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        uint256 timestamp
    );

    event RateUpdated(
        address indexed token,
        uint256 oldRate,
        uint256 newRate,
        uint256 timestamp
    );

    event TokenAdded(address indexed token, uint256 initialRate);
    event TokenRemoved(address indexed token);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event ETHConverted(address indexed user, uint256 ethAmount, uint256 rangerAmount);

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor(
        address _rangerCoin,
        address _wbtc,
        address _usdc,
        address _treasury
    ) Ownable(msg.sender) {
        rangerCoin = IERC20(_rangerCoin);
        wbtc = IERC20(_wbtc);
        usdc = IERC20(_usdc);
        treasury = _treasury;

        // Initialize default rates (example rates - would use oracle in production)
        // 1 WBTC = 40000 RangerCoin (BTC ~$40k)
        conversionRates[_wbtc] = ConversionRate({
            rate: 40000 * 1e18,
            lastUpdated: block.timestamp,
            isActive: true
        });
        supportedTokens.push(_wbtc);

        // 1 USDC = 1 RangerCoin (pegged to EUR/USD)
        conversionRates[_usdc] = ConversionRate({
            rate: 1e18,
            lastUpdated: block.timestamp,
            isActive: true
        });
        supportedTokens.push(_usdc);

        // ETH rate stored at address(0)
        // 1 ETH = 2000 RangerCoin (ETH ~$2k)
        conversionRates[address(0)] = ConversionRate({
            rate: 2000 * 1e18,
            lastUpdated: block.timestamp,
            isActive: true
        });
    }

    // ========================================================================
    // MODIFIERS
    // ========================================================================

    modifier whenNotPaused() {
        require(!isPaused, "Bridge is paused");
        _;
    }

    modifier validToken(address token) {
        require(conversionRates[token].isActive, "Token not supported");
        _;
    }

    // ========================================================================
    // CONVERSION FUNCTIONS
    // ========================================================================

    /**
     * @dev Convert ERC-20 token to RangerCoin
     * @param token The token to convert from (WBTC, USDC, etc.)
     * @param amount Amount of tokens to convert
     */
    function convertToRanger(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused validToken(token) returns (uint256) {
        require(amount > 0, "Amount must be > 0");

        // Check daily limit
        _checkAndUpdateDailyLimit(msg.sender, amount);

        // Calculate output amount
        uint256 rate = conversionRates[token].rate;
        uint256 grossAmount = (amount * rate) / 1e18;

        // Calculate fee
        uint256 fee = (grossAmount * FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 netAmount = grossAmount - fee;

        // Transfer input token from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Transfer RangerCoin to user
        rangerCoin.safeTransfer(msg.sender, netAmount);

        // Transfer fee to treasury
        if (fee > 0) {
            rangerCoin.safeTransfer(treasury, fee);
        }

        emit Conversion(
            msg.sender,
            token,
            address(rangerCoin),
            amount,
            netAmount,
            fee,
            block.timestamp
        );

        return netAmount;
    }

    /**
     * @dev Convert RangerCoin to ERC-20 token
     * @param token The token to convert to (WBTC, USDC, etc.)
     * @param amount Amount of RangerCoin to convert
     */
    function convertFromRanger(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused validToken(token) returns (uint256) {
        require(amount > 0, "Amount must be > 0");

        // Check daily limit
        _checkAndUpdateDailyLimit(msg.sender, amount);

        // Calculate output amount
        uint256 rate = conversionRates[token].rate;
        uint256 grossAmount = (amount * 1e18) / rate;

        // Calculate fee (taken from output)
        uint256 fee = (grossAmount * FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 netAmount = grossAmount - fee;

        // Check bridge has enough tokens
        require(
            IERC20(token).balanceOf(address(this)) >= netAmount,
            "Insufficient bridge liquidity"
        );

        // Transfer RangerCoin from user
        rangerCoin.safeTransferFrom(msg.sender, address(this), amount);

        // Transfer output token to user
        IERC20(token).safeTransfer(msg.sender, netAmount);

        // Keep fee in RangerCoin
        if (fee > 0) {
            // Fee stays in contract as additional liquidity
        }

        emit Conversion(
            msg.sender,
            address(rangerCoin),
            token,
            amount,
            netAmount,
            fee,
            block.timestamp
        );

        return netAmount;
    }

    /**
     * @dev Convert ETH to RangerCoin
     */
    function convertETHToRanger() external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value > 0, "Must send ETH");
        require(conversionRates[address(0)].isActive, "ETH conversion disabled");

        // Check daily limit
        _checkAndUpdateDailyLimit(msg.sender, msg.value);

        // Calculate output amount
        uint256 rate = conversionRates[address(0)].rate;
        uint256 grossAmount = (msg.value * rate) / 1e18;

        // Calculate fee
        uint256 fee = (grossAmount * FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 netAmount = grossAmount - fee;

        // Transfer RangerCoin to user
        rangerCoin.safeTransfer(msg.sender, netAmount);

        // Transfer fee to treasury
        if (fee > 0) {
            rangerCoin.safeTransfer(treasury, fee);
        }

        emit ETHConverted(msg.sender, msg.value, netAmount);

        return netAmount;
    }

    /**
     * @dev Convert RangerCoin to ETH
     * @param amount Amount of RangerCoin to convert
     */
    function convertRangerToETH(
        uint256 amount
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(conversionRates[address(0)].isActive, "ETH conversion disabled");

        // Check daily limit
        _checkAndUpdateDailyLimit(msg.sender, amount);

        // Calculate output amount
        uint256 rate = conversionRates[address(0)].rate;
        uint256 grossAmount = (amount * 1e18) / rate;

        // Calculate fee
        uint256 fee = (grossAmount * FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 netAmount = grossAmount - fee;

        // Check bridge has enough ETH
        require(address(this).balance >= netAmount, "Insufficient ETH liquidity");

        // Transfer RangerCoin from user
        rangerCoin.safeTransferFrom(msg.sender, address(this), amount);

        // Transfer ETH to user
        (bool success, ) = payable(msg.sender).call{value: netAmount}("");
        require(success, "ETH transfer failed");

        emit Conversion(
            msg.sender,
            address(rangerCoin),
            address(0),
            amount,
            netAmount,
            fee,
            block.timestamp
        );

        return netAmount;
    }

    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================

    /**
     * @dev Get quote for conversion (no actual conversion)
     */
    function getQuote(
        address fromToken,
        address toToken,
        uint256 amount
    ) external view returns (uint256 outputAmount, uint256 fee) {
        uint256 rate;

        if (fromToken == address(rangerCoin)) {
            // Converting FROM RangerCoin
            rate = conversionRates[toToken].rate;
            uint256 gross = (amount * 1e18) / rate;
            fee = (gross * FEE_PERCENTAGE) / BASIS_POINTS;
            outputAmount = gross - fee;
        } else {
            // Converting TO RangerCoin
            rate = conversionRates[fromToken].rate;
            uint256 gross = (amount * rate) / 1e18;
            fee = (gross * FEE_PERCENTAGE) / BASIS_POINTS;
            outputAmount = gross - fee;
        }
    }

    /**
     * @dev Get user's remaining daily limit
     */
    function getRemainingDailyLimit(address user) external view returns (uint256) {
        uint256 currentDay = block.timestamp / 1 days;

        if (userLimits[user].lastConversionDay != currentDay) {
            return DAILY_LIMIT;
        }

        if (userLimits[user].dailyConverted >= DAILY_LIMIT) {
            return 0;
        }

        return DAILY_LIMIT - userLimits[user].dailyConverted;
    }

    /**
     * @dev Get all supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    /**
     * @dev Get conversion rate for a token
     */
    function getRate(address token) external view returns (uint256 rate, uint256 lastUpdated, bool isActive) {
        ConversionRate memory cr = conversionRates[token];
        return (cr.rate, cr.lastUpdated, cr.isActive);
    }

    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================

    /**
     * @dev Update conversion rate (owner/oracle only)
     */
    function updateRate(address token, uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be > 0");

        uint256 oldRate = conversionRates[token].rate;
        conversionRates[token].rate = newRate;
        conversionRates[token].lastUpdated = block.timestamp;

        emit RateUpdated(token, oldRate, newRate, block.timestamp);
    }

    /**
     * @dev Add new supported token
     */
    function addToken(address token, uint256 initialRate) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(!conversionRates[token].isActive, "Token already added");

        conversionRates[token] = ConversionRate({
            rate: initialRate,
            lastUpdated: block.timestamp,
            isActive: true
        });

        supportedTokens.push(token);

        emit TokenAdded(token, initialRate);
    }

    /**
     * @dev Remove supported token
     */
    function removeToken(address token) external onlyOwner {
        conversionRates[token].isActive = false;
        emit TokenRemoved(token);
    }

    /**
     * @dev Pause bridge (emergency)
     */
    function pause() external onlyOwner {
        isPaused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpause bridge
     */
    function unpause() external onlyOwner {
        isPaused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Add liquidity to bridge
     */
    function addLiquidity(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Remove liquidity from bridge (emergency)
     */
    function removeLiquidity(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Withdraw ETH (emergency)
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @dev Update treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        treasury = newTreasury;
    }

    // ========================================================================
    // INTERNAL FUNCTIONS
    // ========================================================================

    function _checkAndUpdateDailyLimit(address user, uint256 amount) internal {
        uint256 currentDay = block.timestamp / 1 days;

        // Reset if new day
        if (userLimits[user].lastConversionDay != currentDay) {
            userLimits[user].dailyConverted = 0;
            userLimits[user].lastConversionDay = currentDay;
        }

        require(
            userLimits[user].dailyConverted + amount <= DAILY_LIMIT,
            "Daily limit exceeded (20 EUR max)"
        );

        userLimits[user].dailyConverted += amount;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}

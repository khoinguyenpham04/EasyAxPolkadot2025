// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19; // Use a version compatible with solang for Polkadot

/**
 * @title IAsset Interface (Placeholder)
 * @dev Represents the basic functions needed to interact with a Polkadot Asset Hub asset.
 * The actual implementation/address depends on the solang setup for pallet-assets.
 * Balances and amounts typically use uint128 on Asset Hub.
 */
interface IAsset {
    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     */
    function transfer(
        address recipient,
        uint128 amount
    ) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     * Requires prior approval from `sender` to the contract (msg.sender).
     */
    function transferFrom(
        address sender,
        address recipient,
        uint128 amount
    ) external returns (bool);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint128);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     * NOTE: This function is called by the *user* on the *token contract*, not the DEX.
     */
    // function approve(address spender, uint128 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner`.
     */
    // function allowance(address owner, address spender) external view returns (uint128);
}

/**
 * @title SimpleDexMVP
 * @dev A minimal DEX contract for swapping native WND for another token (LSP) at a fixed rate.
 * Designed for Polkadot Asset Hub using Solidity (via solang).
 * Assumes WND is the native chain token and LSP is a pallet-assets token.
 */
contract SimpleDexMVP {
    address public owner;
    IAsset public immutable otherToken; // Interface to the LSP asset (pallet-assets)
    uint256 public exchangeRate; // How many 'otherToken' units per 1 WND unit (scaled by RATE_PRECISION)

    // Precision factor for the exchange rate (e.g., 10**18 for ether-like decimals)
    // If rate is 5.5, store 5500000000000000000 if precision is 10**18
    uint256 public constant RATE_PRECISION = 10 ** 18;

    event Swapped(
        address indexed user,
        uint128 wndAmountIn, // WND received via msg.value
        uint128 otherTokenAmountOut // LSP sent
    );
    // Add a new event for the reverse swap
    event SwappedOtherForWND(
        address indexed user,
        uint128 otherTokenAmountIn, // LSP received via transferFrom
        uint128 wndAmountOut // WND sent
    );
    event RateUpdated(uint256 newRate);
    event TokensWithdrawn(address indexed tokenAddressOrNative, uint128 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "SimpleDexMVP: Caller is not the owner");
        _;
    }

    /**
     * @dev Constructor initializes the DEX.
     * @param _otherTokenAddress The address representing the LSP asset contract/precompile.
     * @param _initialRate The initial exchange rate (scaled by RATE_PRECISION). E.g., for 1 WND = 10 LSP, pass 10 * (10**18).
     */
    constructor(address _otherTokenAddress, uint256 _initialRate) {
        owner = msg.sender;
        otherToken = IAsset(_otherTokenAddress); // This is the LSP precompile address
        exchangeRate = _initialRate; // Assume rate is already scaled
    }

    /**
     * @dev Swaps WND sent with the transaction for the other token (LSP).
     * The amount of WND is determined by msg.value.
     */
    function swapWNDForOther() external payable {
        // Made payable, removed _wndAmount
        uint128 wndAmountIn = uint128(msg.value); // Use msg.value for WND amount
        require(wndAmountIn > 0, "SimpleDexMVP: Cannot swap zero WND");

        // Calculate the amount of otherToken (LSP) to send out
        // amountOut = amountIn * rate / precision
        uint128 otherAmountOut = uint128(
            (uint256(wndAmountIn) * exchangeRate) / RATE_PRECISION
        );
        require(
            otherAmountOut > 0,
            "SimpleDexMVP: Output amount would be zero"
        );

        // Check if the contract has enough otherToken (LSP) liquidity
        uint128 contractOtherBalance = otherToken.balanceOf(address(this));
        require(
            contractOtherBalance >= otherAmountOut,
            "SimpleDexMVP: Insufficient LSP liquidity"
        );

        // 1. WND is already transferred to the contract via msg.value.
        // No need for transferFrom for WND.

        // 2. Push otherToken (LSP) to the user
        bool successOther = otherToken.transfer(msg.sender, otherAmountOut);
        require(
            successOther,
            "SimpleDexMVP: LSP token transfer failed. Contract may be locked?"
        );

        emit Swapped(msg.sender, wndAmountIn, otherAmountOut);
    }

    /**
     * @dev Swaps a specific amount of the other token (LSP) for native WND.
     * The user must have previously approved this contract to spend their LSP.
     * @param _otherAmountIn The amount of LSP tokens to swap.
     */
    function swapOtherForWND(uint128 _otherAmountIn) external {
        // Not payable
        require(_otherAmountIn > 0, "SimpleDexMVP: Cannot swap zero LSP");

        // Calculate the amount of WND to send out
        // amountOut = amountIn * precision / rate
        // Ensure exchangeRate is not zero to prevent division by zero
        require(
            exchangeRate > 0,
            "SimpleDexMVP: Exchange rate not set or zero"
        );
        uint128 wndAmountOut = uint128(
            (uint256(_otherAmountIn) * RATE_PRECISION) / exchangeRate
        );
        require(
            wndAmountOut > 0,
            "SimpleDexMVP: Output WND amount would be zero"
        );

        // Check if the contract has enough WND liquidity
        uint256 contractWNDBalance = address(this).balance;
        require(
            contractWNDBalance >= wndAmountOut,
            "SimpleDexMVP: Insufficient WND liquidity"
        );

        // 1. Pull LSP from the user (requires prior user approval)
        // The user must have called otherToken.approve(address(this), _otherAmountIn)
        bool successLSP = otherToken.transferFrom(
            msg.sender,
            address(this),
            _otherAmountIn
        );
        require(
            successLSP,
            "SimpleDexMVP: LSP transferFrom failed. Check allowance."
        );

        // 2. Push WND (native token) to the user
        (bool sent, ) = msg.sender.call{value: wndAmountOut}("");
        require(sent, "SimpleDexMVP: Native WND transfer failed");

        emit SwappedOtherForWND(msg.sender, _otherAmountIn, wndAmountOut);
    }

    // --- Owner Functions ---

    /**
     * @dev Updates the fixed exchange rate.
     * @param _newRate The new exchange rate (scaled by RATE_PRECISION).
     */
    function setExchangeRate(uint256 _newRate) external onlyOwner {
        exchangeRate = _newRate;
        emit RateUpdated(_newRate);
    }

    /**
     * @dev Allows the owner to withdraw accumulated WND or excess otherToken (LSP).
     * Use address(0) or a specific convention for _tokenAddress to withdraw native WND.
     * @param _tokenAddress The address of the asset contract (LSP) or address(0) for native WND.
     * @param _amount The amount of tokens/native currency to withdraw.
     */
    function withdrawTokens(
        address _tokenAddress,
        uint128 _amount
    ) external onlyOwner {
        require(_amount > 0, "SimpleDexMVP: Cannot withdraw zero amount");

        if (_tokenAddress == address(otherToken)) {
            // Withdraw LSP (pallet-assets token)
            IAsset token = IAsset(_tokenAddress);
            uint128 contractBalance = token.balanceOf(address(this));
            require(
                contractBalance >= _amount,
                "SimpleDexMVP: Insufficient LSP balance for withdrawal"
            );
            bool success = token.transfer(owner, _amount);
            require(success, "SimpleDexMVP: LSP withdrawal transfer failed");
            emit TokensWithdrawn(_tokenAddress, _amount);
        } else if (_tokenAddress == address(0)) {
            // Convention: address(0) for native WND
            // Withdraw WND (native token)
            uint256 contractNativeBalance = address(this).balance;
            require(
                contractNativeBalance >= _amount,
                "SimpleDexMVP: Insufficient WND balance for withdrawal"
            );
            // Use standard transfer for native currency
            (bool sent, ) = owner.call{value: _amount}("");
            require(sent, "SimpleDexMVP: Native WND withdrawal failed");
            emit TokensWithdrawn(address(0), _amount); // Use address(0) in event
        } else {
            revert("SimpleDexMVP: Invalid token address for withdrawal");
        }
    }

    // --- View Functions ---

    /**
     * @dev Gets the current balance of the LSP token held by this contract.
     * To get the native WND balance, check address(this).balance directly.
     */
    function getContractLSPBalance() external view returns (uint128) {
        return otherToken.balanceOf(address(this));
    }

    // --- Fallback ---
    // Optional: Allow the contract to receive the native currency (e.g., WND)
    // This is implicitly handled by payable functions now.
    // receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleDexMVP (Revised for Asset Hub Pallet Interaction)
 * @notice Interacts with pallet-assets using low-level calls.
 * Requires correct pallet address, function selector, and SCALE encoding.
 */
contract SimpleDexMVP {
    address public owner;

    // Standard derived address for pallet-assets (from "modl" + "py/asset")
    // VERIFY this if possible for your specific chain, but it's highly likely correct.
    address constant PALLET_ASSETS_ADDRESS =
        0x6d6f646c70792f61737365740000000000000000000000000000000000000000;

    // Function selector index for pallet-assets::transfer
    // !!! EXAMPLE ONLY - MUST BE FOUND FOR YOUR TARGET CHAIN'S RUNTIME VERSION !!!
    // Common indices are often low numbers like 0x05, 0x08, etc. Check runtime metadata.
    bytes1 constant TRANSFER_SELECTOR = 0x08; // <<< Placeholder Example! Find the real one!

    uint32 public immutable otherTokenAssetId; // The Asset ID for the specific token (e.g., LSP)
    uint256 public exchangeRate;
    uint256 public constant RATE_PRECISION = 10 ** 18;

    event Swapped(
        address indexed user,
        uint32 indexed assetIdOut,
        uint128 wndAmountIn,
        uint128 otherTokenAmountOut
    );
    event SwappedOtherForWND(
        address indexed user,
        uint32 indexed assetIdIn,
        uint128 otherTokenAmountIn,
        uint128 wndAmountOut
    );
    event RateUpdated(uint256 newRate);
    event TokensWithdrawn(
        address indexed tokenAddressOrNative,
        uint32 indexed assetId,
        uint128 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Owner only");
        _;
    }

    constructor(uint32 _otherTokenAssetId, uint256 _initialRate) {
        owner = msg.sender;
        otherTokenAssetId = _otherTokenAssetId;
        exchangeRate = _initialRate;
    }

    /**
     * @dev Swaps WND sent with the transaction for the other token (LSP).
     * Requires correct SCALE encoding for the pallet-assets transfer call.
     */
    function swapWNDForOther() external payable {
        uint128 wndAmountIn = uint128(msg.value);
        require(wndAmountIn > 0, "No WND sent");

        uint128 otherAmountOut = uint128(
            (uint256(wndAmountIn) * exchangeRate) / RATE_PRECISION
        );
        require(otherAmountOut > 0, "Output is zero");

        // --- Balance Check ---
        // Reading pallet-assets balance via staticcall from Solidity is very complex.
        // Reverting for now to indicate it's not implemented.
        revert("On-chain pallet balance check not implemented");

        // --- Pallet Transfer Call ---
        address recipient = msg.sender; // EVM address
        uint128 amount = otherAmountOut;

        // Construct the SCALE encoded call data for:
        // pallet_assets::transfer(asset_id: Compact<u32>, target: MultiAddress, amount: Compact<u128>)

        // !!! CRITICAL: The following abi.encodePacked is WRONG for SCALE encoding !!!
        // !!! You MUST replace this with actual SCALE encoding logic !!!
        // This likely requires a library or complex manual byte construction.
        // Example structure (PSEUDOCODE - DO NOT USE):
        // bytes memory scale_encoded_asset_id = scaleEncodeCompactU32(otherTokenAssetId);
        // bytes memory scale_encoded_target = scaleEncodeMultiAddressId(recipient); // Assuming target is AccountId32
        // bytes memory scale_encoded_amount = scaleEncodeCompactU128(amount);
        // bytes memory data = bytes.concat(
        //     TRANSFER_SELECTOR,
        //     scale_encoded_asset_id,
        //     scale_encoded_target,
        //     scale_encoded_amount
        // );
        bytes memory data; // Placeholder - MUST BE REPLACED WITH ACTUAL SCALE ENCODING
        revert("SCALE encoding for pallet-assets::transfer not implemented"); // Remove after implementing SCALE encoding

        // Dispatch the call to the pallet-assets module address
        (bool success, bytes memory returnData) = PALLET_ASSETS_ADDRESS.call(
            data
        );

        // Note: `success` only means the low-level call dispatch didn't trap.
        // It DOES NOT guarantee the Substrate extrinsic succeeded.
        // Proper checking requires inspecting `returnData` for Substrate errors or monitoring events off-chain.
        require(success, "Low-level call dispatch failed");
        // TODO: Optionally decode `returnData` to check for Substrate DispatchError

        emit Swapped(
            msg.sender,
            otherTokenAssetId,
            wndAmountIn,
            otherAmountOut
        );
    }

    // --- swapOtherForWND ---
    // function swapOtherForWND(uint128 _otherAmountIn) external { ... } // Requires transfer_approved, similar SCALE issues

    // --- Owner Functions ---
    function setExchangeRate(uint256 _newRate) external onlyOwner {
        exchangeRate = _newRate;
        emit RateUpdated(_newRate);
    }

    /**
     * @dev Allows owner to withdraw WND or LSP. LSP withdrawal requires pallet-assets call.
     */
    function withdrawTokens(
        address _tokenAddressOrNativeFlag,
        uint128 _amount
    ) external onlyOwner {
        require(_amount > 0, "Withdraw zero");

        if (_tokenAddressOrNativeFlag != address(0)) {
            // Withdraw LSP (pallet asset)
            // --- Balance Check ---
            revert("On-chain pallet balance check not implemented");

            // --- Pallet Transfer Call ---
            address recipient = owner; // Withdraw to owner
            uint128 amount = _amount;

            // Construct SCALE encoded call data for pallet_assets::transfer
            // !!! Same SCALE encoding challenge as in swapWNDForOther !!!
            bytes memory data; // Placeholder - MUST BE REPLACED WITH ACTUAL SCALE ENCODING
            revert(
                "SCALE encoding for pallet-assets::transfer not implemented"
            ); // Remove after implementing SCALE encoding

            (bool success, bytes memory returnData) = PALLET_ASSETS_ADDRESS
                .call(data);
            require(success, "Low-level call dispatch failed");
            // TODO: Optionally decode `returnData`

            emit TokensWithdrawn(address(1), otherTokenAssetId, _amount);
        } else {
            // Withdraw WND (native)
            uint256 contractNativeBalance = address(this).balance;
            require(contractNativeBalance >= _amount, "Low WND balance");
            (bool sent, ) = owner.call{value: _amount}("");
            require(sent, "WND withdraw fail");
            emit TokensWithdrawn(address(0), 0, _amount);
        }
    }

    // --- View Functions ---
    function getContractLSPBalance() external view returns (uint128) {
        revert(
            "Reading pallet storage via staticcall requires chain-specific key construction and SCALE decoding - not implemented."
        );
        return 0;
    }

    // --- Fallback ---
    receive() external payable {}
}

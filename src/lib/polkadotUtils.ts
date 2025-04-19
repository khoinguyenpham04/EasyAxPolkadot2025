import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { WND_ASSET_ID } from '@/config/polkadot';
import { formatBalance } from '@polkadot/util';

// TODO: Determine correct decimals for WND and WEST on Westend Asset Hub
const WND_DECIMALS = 12; // Placeholder - Verify this!
const WEST_DECIMALS = 12; // Placeholder - Verify this!

/**
 * Fetches the WND balance for a given address.
 */
export async function getWndBalance(api: ApiPromise, address: string): Promise<string> {
    if (!api || !address) return '0';
    try {
        // Adjust the query based on the actual structure for assets
        const accountData: any = await api.query.assets.account(WND_ASSET_ID, address);
        if (accountData.isNone) {
            return '0';
        }
        const balance = accountData.unwrap().balance;
        // Format balance requires decimals, ensure WND_DECIMALS is correct
        return formatBalance(balance, { withSi: false, forceUnit: '-', decimals: WND_DECIMALS });

    } catch (error) {
        console.error("Error fetching WND balance:", error);
        return 'Error';
    }
}

/**
 * Fetches the native WEST balance for a given address.
 */
export async function getWestBalance(api: ApiPromise, address: string): Promise<string> {
    if (!api || !address) return '0';
    try {
        const { data: balanceData } = await api.query.system.account(address);
        // Format balance requires decimals, ensure WEST_DECIMALS is correct
        return formatBalance(balanceData.free, { withSi: false, forceUnit: '-', decimals: WEST_DECIMALS });
    } catch (error) {
        console.error("Error fetching WEST balance:", error);
        return 'Error';
    }
}


/**
 * Creates and sends a WND transfer transaction.
 */
export async function sendWndTransaction(
    api: ApiPromise,
    senderPair: KeyringPair,
    recipientAddress: string,
    amount: string, // Amount as a string (e.g., "10.5")
    onStatusChange: (status: string) => void
): Promise<void> {
    if (!api || !senderPair || !recipientAddress || !amount) {
        throw new Error("Missing required parameters for transaction.");
    }

    try {
        onStatusChange("Constructing transaction...");

        // Convert amount string to base units (Plancks)
        // This requires knowing the correct decimals for WND
        const amountInPlancks = BigInt(parseFloat(amount) * Math.pow(10, WND_DECIMALS));

        const extrinsic = api.tx.assets.transferKeepAlive(
            WND_ASSET_ID,
            recipientAddress,
            amountInPlancks
        );

        onStatusChange("Signing and sending...");

        const unsub = await extrinsic.signAndSend(senderPair, ({ status, events, dispatchError }) => {
            if (status.isInBlock) {
                onStatusChange(`Transaction included in block ${status.asInBlock}`);
            } else if (status.isFinalized) {
                onStatusChange(`Transaction finalized at block ${status.asFinalized}`);

                // Check for success or failure events
                events.forEach(({ event: { data, method, section } }) => {
                    console.log(`	' ${section}.${method}':: ${data}`);
                    if (section === 'system' && method === 'ExtrinsicSuccess') {
                        onStatusChange(`✅ Transaction successful! Finalized at block ${status.asFinalized}`);
                    } else if (section === 'system' && method === 'ExtrinsicFailed') {
                        let errorMessage = `Transaction failed at block ${status.asFinalized}.`;
                        if (dispatchError) {
                            if (dispatchError.isModule) {
                                const decoded = api.registry.findMetaError(dispatchError.asModule);
                                const { docs, name, section } = decoded;
                                errorMessage += ` Error: ${section}.${name}: ${docs.join(' ')}`;
                            } else {
                                errorMessage += ` Error: ${dispatchError.toString()}`;
                            }
                        }
                        onStatusChange(`❌ ${errorMessage}`);
                    }
                });

                unsub(); // Unsubscribe once finalized
            } else {
                onStatusChange(`Current status: ${status.type}`);
            }
        });

    } catch (error: any) {
        console.error("Error sending transaction:", error);
        onStatusChange(`Error: ${error.message || error.toString()}`);
        throw error; // Re-throw the error for handling in the UI component
    }
}

// TODO: Add functions for subscribing to balance changes if needed
// export async function subscribeToWndBalance(...) {}
// export async function subscribeToWestBalance(...) {}

// TODO: Add address validation function
export function isValidAddress(address: string): boolean {
    // Basic check, can be improved with @polkadot/util-crypto checkAddress
    return !!address && address.length > 40;
}

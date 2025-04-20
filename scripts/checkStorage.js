import { ethers } from 'ethers'; // Import ethers
import FlexibleForwarderAbi from '../../../../abis/FlexibleForwarder.json'; // Adjust path as needed

const { readFileSync } = require('fs');
const { join } = require('path');

const createProvider = (providerConfig) => {
    return new ethers.JsonRpcProvider(providerConfig.rpc, {
        chainId: providerConfig.chainId,
        name: providerConfig.name,
    });
};

const createWallet = (mnemonic, provider) => {
    return ethers.Wallet.fromPhrase(mnemonic).connect(provider);
};

const loadContractAbi = (contractName, directory = __dirname) => {
    const contractPath = join(directory, `${contractName}.json`);
    const contractJson = JSON.parse(readFileSync(contractPath, 'utf8'));
    return contractJson.abi || contractJson; // Depending on JSON structure
};

const createContract = (contractAddress, abi, wallet) => {
    return new ethers.Contract(contractAddress, abi, wallet);
};

const interactWithStorageContract = async (
    contractName,
    contractAddress,
    mnemonic,
    providerConfig,
    senderAddress, // Renamed from numberToSet
    receiverAddress, // Added receiver address parameter
    amountToSend // Added amount parameter
) => {
    try {
        console.log(`Attempting to forward payment from ${senderAddress} to ${receiverAddress}`);

        // Create provider and wallet
        const provider = createProvider(providerConfig);
        const wallet = createWallet(mnemonic, provider);

        // Ensure the wallet address matches the intended sender address
        if (wallet.address.toLowerCase() !== senderAddress.toLowerCase()) {
            console.warn(`Warning: Wallet address (${wallet.address}) does not match the provided sender address (${senderAddress}). Using wallet address.`);
            // Optionally, throw an error or use wallet.address instead
            // senderAddress = wallet.address; 
        }

        // Load the contract ABI and create the contract instance
        const abi = loadContractAbi(contractName);
        const contract = createContract(contractAddress, abi, wallet);

        // Send a transaction to forward the payment
        // The forwardPayment function in the contract takes sender and receiver addresses
        // The amount is sent via the transaction's value property
        console.log(`Sending ${ethers.formatEther(amountToSend)} ETH to ${receiverAddress} via contract ${contractAddress}`);
        const tx = await contract.forwardPayment(senderAddress, receiverAddress, {
            value: amountToSend
        });

        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait(); // Wait for the transaction to be mined
        console.log(`Payment successfully forwarded from ${senderAddress} to ${receiverAddress}`);

        // Removed calls to setNumber and storedNumber as they are not relevant here

    } catch (error) {
        console.error('Error interacting with contract:', error.message);
    }
};

const providerConfig = {
    name: 'asset-hub-smart-contracts',
    rpc: 'https://westend-asset-hub-eth-rpc.polkadot.io',
    chainId: 420420421,
};

const mnemonic = 'episode cup approve mean umbrella power tunnel coyote lens point tobacco staff';
const contractName = 'swap'; // Assuming this is the correct contract name for FlexibleForwarder
const contractAddress = '0x655F5aD2ef22754988cc8862576a8655a48dC4f5'; // Ensure this is the deployed FlexibleForwarder address

// --- Get Addresses and Amount from Command Line Arguments ---
const args = process.argv.slice(2); // Skip node path and script path

if (args.length < 3) {
    console.error('Usage: node checkStorage.js <senderAddress> <receiverAddress> <amountInEth>');
    process.exit(1);
}

const senderAddress = args[0];
const receiverAddress = args[1];
const amountInEth = args[2];

// Validate addresses (basic check)
if (!ethers.isAddress(senderAddress) || !ethers.isAddress(receiverAddress)) {
    console.error('Invalid sender or receiver address provided.');
    process.exit(1);
}

let amountToSend;
try {
    amountToSend = ethers.parseEther(amountInEth);
} catch (error) {
    console.error(`Invalid amount provided: ${amountInEth}. Please provide amount in ETH (e.g., 0.01).`);
    process.exit(1);
}

console.log(`Using Sender: ${senderAddress}`);
console.log(`Using Receiver: ${receiverAddress}`);
console.log(`Using Amount: ${amountInEth} ETH (${amountToSend.toString()} wei)`);
// --- End Argument Parsing ---

interactWithStorageContract(
    contractName,
    contractAddress,
    mnemonic,
    providerConfig,
    senderAddress, // Pass sender address from args
    receiverAddress, // Pass receiver address from args
    amountToSend // Pass amount from args
);

// Define the FlexibleForwarder contract address (replace with your actual deployed address)
const FORWARDER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS || "0x655F5aD2ef22754988cc8862576a8655a48dC4f5"; // <-- REPLACE THIS or use env var

// --- Add forwardPayment function ---
const forwardPayment = async (senderAddress, recipientAddress, amountString) => {
    console.log(`Initiating forwardPayment: ${amountString} ETH from ${senderAddress} to ${recipientAddress}`);

    if (!window.ethereum) {
        alert("MetaMask (or another Ethereum wallet provider) is not installed. Please install it.");
        console.error("Ethereum provider not found.");
        return;
    }

    try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Use ethers with the browser provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const connectedAddress = await signer.getAddress();

        // Verify the connected address matches the intended sender
        if (connectedAddress.toLowerCase() !== senderAddress.toLowerCase()) {
            alert(`Connected wallet address (${connectedAddress}) does not match the required sender address (${senderAddress}). Please connect the correct wallet.`);
            console.error(`Address mismatch: Connected=${connectedAddress}, Required=${senderAddress}`);
            return;
        }

        // Create contract instance
        const forwarderContract = new ethers.Contract(FORWARDER_CONTRACT_ADDRESS, FlexibleForwarderAbi.abi, signer);

        // Convert amount to wei
        const amountWei = ethers.parseEther(amountString);

        console.log(`Calling forwardPayment on contract ${FORWARDER_CONTRACT_ADDRESS} with value ${amountWei.toString()} wei`);

        // Send the transaction - DO NOT await as requested
        forwarderContract.forwardPayment(senderAddress, recipientAddress, {
            value: amountWei
        }).then(tx => {
            console.log(`Transaction sent: ${tx.hash}`);
            // Optionally, you could show a temporary notification here
            // alert(`Transaction submitted: ${tx.hash}. Check your wallet for status.`);
            // Note: Without await, we don't wait for confirmation.
            // The UI will return to main immediately.
        }).catch(error => {
            console.error("Error sending forwardPayment transaction:", error);
            alert(`Error sending transaction: ${error.message || error}`);
            // Handle error state if needed, but don't block UI return
        });

        // Return to main view immediately after initiating the transaction
        setActiveView("main");

    } catch (error) {
        console.error("Error setting up forwardPayment transaction:", error);
        alert(`Failed to initiate transaction: ${error.message || error}`);
        // Ensure view returns to main even if setup fails
        setActiveView("main");
    }
};
// --- End forwardPayment function ---

// Function to render the send view
const renderSendView = () => {

    return (
        <div className="pt-4 space-y-3">
            <button
                onClick={() => {
                    // Modified handleSend logic
                    const handleSend = (recipientAddress, amountToSend) => {
                        console.log(`Preparing to forward ${amountToSend} ETH to ${recipientAddress}`);

                        // --- Save to Local Storage ---
                        const senderEvmAddress = localStorage.getItem("userEvmAddress");
                        if (senderEvmAddress) {
                            localStorage.setItem("senderAddress", senderEvmAddress);
                            console.log(`Saved senderAddress: ${senderEvmAddress}`);
                        } else {
                            console.warn("Sender EVM address (userEvmAddress) not found in local storage.");
                            alert("Error: Could not find sender's EVM address in local storage.");
                            return; // Stop the process if sender address is missing
                        }
                        localStorage.setItem("recipientAddress", recipientAddress);
                        localStorage.setItem("amountToSend", amountToSend);
                        console.log(`Saved recipientAddress: ${recipientAddress}`);
                        console.log(`Saved amountToSend: ${amountToSend}`);
                        // --- End Save to Local Storage ---

                        // --- Call forwardPayment (without await) ---
                        forwardPayment(senderEvmAddress, recipientAddress, amountToSend);
                        // Note: setActiveView("main") is now called inside forwardPayment
                        // after the transaction is initiated (or if an error occurs during setup).
                        // --- End Call forwardPayment ---

                    };

                    if (address && amount) {
                        // Basic validation
                        if (parseFloat(amount) <= 0) {
                            alert("Please enter a valid amount greater than zero.");
                            return;
                        }
                        // Ensure address is a valid Ethereum address (basic check)
                        if (!ethers.isAddress(address)) {
                            alert("Please enter a valid recipient Ethereum address.");
                            return;
                        }
                        handleSend(address, amount);
                    } else {
                        alert("Please enter both recipient address and amount");
                    }
                }}
            // ...existing button attributes...
            >
                <SendHorizontal className="w-5 h-5" />
                <span>Send {crypto.symbol || 'Asset'}</span>
            </button>

            // ...existing code...
        </div>
    );
}

// ... (rest of the component) ...
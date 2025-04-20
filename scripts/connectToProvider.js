const { JsonRpcProvider } = require('ethers');

const createProvider = (rpcUrl, chainId, chainName) => {
    const provider = new JsonRpcProvider(rpcUrl, {
        chainId: chainId,
        name: chainName,
    });

    return provider;
};

const PROVIDER_RPC = {
    rpc: 'https://westend-asset-hub-eth-rpc.polkadot.io',
    chainId: 420420421,
    name: 'Asset-Hub Westend Testnet',
};

createProvider(PROVIDER_RPC.rpc, PROVIDER_RPC.chainId, PROVIDER_RPC.name);
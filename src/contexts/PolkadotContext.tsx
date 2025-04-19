"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { WESTEND_ASSET_HUB_RPC } from '@/config/polkadot';

interface PolkadotContextProps {
    api: ApiPromise | null;
    isConnected: boolean;
}

const PolkadotContext = createContext<PolkadotContextProps | undefined>(undefined);

interface PolkadotProviderProps {
    children: ReactNode;
}

export const PolkadotProvider: React.FC<PolkadotProviderProps> = ({ children }) => {
    const [api, setApi] = useState<ApiPromise | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const connect = async () => {
            console.log(`Connecting to ${WESTEND_ASSET_HUB_RPC}...`);
            const provider = new WsProvider(WESTEND_ASSET_HUB_RPC);
            const polkadotApi = await ApiPromise.create({ provider });

            polkadotApi.on('connected', () => {
                console.log('API connected');
                setIsConnected(true);
            });

            polkadotApi.on('disconnected', () => {
                console.log('API disconnected');
                setIsConnected(false);
                // Optional: Implement reconnection logic here
            });

            polkadotApi.on('error', (error) => {
                console.error('API error:', error);
                setIsConnected(false);
            });

            polkadotApi.on('ready', () => {
                console.log('API ready');
                // Connection is considered established when ready
            });

            setApi(polkadotApi);
        };

        connect().catch(error => {
            console.error("Failed to connect to Polkadot API:", error);
            setIsConnected(false);
        });

        // Cleanup function
        return () => {
            api?.disconnect();
        };
    }, [api]); // Re-run effect if api instance changes (e.g., for cleanup)

    return (
        <PolkadotContext.Provider value={{ api, isConnected }}>
            {children}
        </PolkadotContext.Provider>
    );
};

export const usePolkadot = (): PolkadotContextProps => {
    const context = useContext(PolkadotContext);
    if (context === undefined) {
        throw new Error('usePolkadot must be used within a PolkadotProvider');
    }
    return context;
};

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
// TODO: Implement crypto utilities
// import { encryptMnemonic, decryptMnemonic } from '@/lib/crypto';
import { WESTEND_SS58_FORMAT } from '@/config/polkadot';

interface WalletState {
    mnemonic: string | null;
    keypair: KeyringPair | null;
    address: string | null;
    isLocked: boolean;
    hasWallet: boolean; // Indicates if encrypted mnemonic exists in storage
}

interface WalletContextProps extends WalletState {
    createWallet: (password: string) => Promise<string>; // Returns mnemonic
    importWallet: (mnemonic: string, password: string) => Promise<void>;
    lockWallet: () => void;
    unlockWallet: (password: string) => Promise<boolean>;
    logout: () => void;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'polkadot-wallet-encrypted-mnemonic';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

interface WalletProviderProps {
    children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [walletState, setWalletState] = useState<WalletState>({
        mnemonic: null,
        keypair: null,
        address: null,
        isLocked: true,
        hasWallet: false,
    });
    const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

    // Check local storage on initial load
    useEffect(() => {
        const encryptedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        setWalletState(prev => ({ ...prev, hasWallet: !!encryptedData, isLocked: !!encryptedData }));
    }, []);

    // --- Inactivity Lock ---
    const resetInactivityTimer = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (!walletState.isLocked && walletState.hasWallet) {
            const timer = setTimeout(() => {
                console.log('Locking wallet due to inactivity.');
                lockWallet();
            }, INACTIVITY_TIMEOUT);
            setInactivityTimer(timer);
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', resetInactivityTimer);
        window.addEventListener('keypress', resetInactivityTimer);
        window.addEventListener('click', resetInactivityTimer);
        window.addEventListener('scroll', resetInactivityTimer);

        resetInactivityTimer(); // Initial setup

        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', resetInactivityTimer);
            window.removeEventListener('keypress', resetInactivityTimer);
            window.removeEventListener('click', resetInactivityTimer);
            window.removeEventListener('scroll', resetInactivityTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletState.isLocked, walletState.hasWallet]); // Re-run when lock state changes

    // --- Wallet Core Functions ---

    const loadKeypair = (mnemonic: string): KeyringPair => {
        if (!mnemonicValidate(mnemonic)) {
            throw new Error('Invalid mnemonic phrase');
        }
        const keyring = new Keyring({ type: 'sr25519', ss58Format: WESTEND_SS58_FORMAT });
        const keypair = keyring.addFromMnemonic(mnemonic);
        return keypair;
    };

    const createWallet = async (password: string): Promise<string> => {
        const newMnemonic = mnemonicGenerate(12);
        const keypair = loadKeypair(newMnemonic);
        // TODO: Implement encryption
        // const encryptedData = await encryptMnemonic(newMnemonic, password);
        // localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(encryptedData));
        localStorage.setItem(LOCAL_STORAGE_KEY, `TEMP_UNENCRYPTED:${newMnemonic}`); // Placeholder

        setWalletState({
            mnemonic: newMnemonic,
            keypair: keypair,
            address: keypair.address,
            isLocked: false,
            hasWallet: true,
        });
        resetInactivityTimer();
        return newMnemonic;
    };

    const importWallet = async (mnemonic: string, password: string): Promise<void> => {
        if (!mnemonicValidate(mnemonic)) {
            throw new Error('Invalid mnemonic phrase');
        }
        const keypair = loadKeypair(mnemonic);
        // TODO: Implement encryption
        // const encryptedData = await encryptMnemonic(mnemonic, password);
        // localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(encryptedData));
        localStorage.setItem(LOCAL_STORAGE_KEY, `TEMP_UNENCRYPTED:${mnemonic}`); // Placeholder

        setWalletState({
            mnemonic: mnemonic,
            keypair: keypair,
            address: keypair.address,
            isLocked: false,
            hasWallet: true,
        });
        resetInactivityTimer();
    };

    const lockWallet = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        setInactivityTimer(null);
        setWalletState(prev => ({
            ...prev,
            mnemonic: null,
            keypair: null,
            // Keep address? Maybe not needed when locked.
            // address: null,
            isLocked: true,
        }));
        console.log("Wallet locked.");
    };

    const unlockWallet = async (password: string): Promise<boolean> => {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!storedData) {
            console.error("No wallet data found in storage.");
            return false;
        }

        try {
            let mnemonic: string | null = null;
            // TODO: Implement decryption
            // const decryptedMnemonic = await decryptMnemonic(JSON.parse(storedData), password);
            // mnemonic = decryptedMnemonic;

            // Placeholder decryption
            if (storedData.startsWith('TEMP_UNENCRYPTED:')) {
                mnemonic = storedData.substring('TEMP_UNENCRYPTED:'.length);
                // In real scenario, PBKDF2 derivation and AES decryption happen here.
                // If decryption fails, throw error.
                console.warn("Using temporary unencrypted storage for mnemonic.");
            } else {
                throw new Error("Invalid stored data format (Encryption not implemented)");
            }


            if (!mnemonic || !mnemonicValidate(mnemonic)) {
                throw new Error('Decryption failed or invalid mnemonic');
            }

            const keypair = loadKeypair(mnemonic);
            setWalletState(prev => ({
                ...prev,
                mnemonic: mnemonic,
                keypair: keypair,
                address: keypair.address,
                isLocked: false,
            }));
            resetInactivityTimer();
            console.log("Wallet unlocked.");
            return true;
        } catch (error) {
            console.error('Failed to unlock wallet:', error);
            // Ensure wallet remains locked on failure
            setWalletState(prev => ({
                ...prev,
                mnemonic: null,
                keypair: null,
                isLocked: true,
            }));
            return false;
        }
    };

    const logout = () => {
        lockWallet(); // Ensure state is cleared
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Remove from storage
        setWalletState({ // Reset state completely
            mnemonic: null,
            keypair: null,
            address: null,
            isLocked: true,
            hasWallet: false,
        });
        console.log("User logged out, wallet removed.");
    };


    return (
        <WalletContext.Provider value={{ ...walletState, createWallet, importWallet, lockWallet, unlockWallet, logout }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = (): WalletContextProps => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};

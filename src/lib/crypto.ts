// Placeholder for crypto functions using SubtleCrypto API

/**
 * Derives an encryption key from a password using PBKDF2.
 * @param password The user's password.
 * @param salt The salt used for key derivation (should be stored).
 * @returns The derived CryptoKey.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000, // Recommended minimum
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true, // Extractable = false in production?
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts the mnemonic phrase using AES-GCM.
 * @param mnemonic The mnemonic phrase to encrypt.
 * @param password The user's password.
 * @returns An object containing ciphertext, iv, and salt.
 */
export async function encryptMnemonic(mnemonic: string, password: string): Promise<{ ciphertext: ArrayBuffer, iv: Uint8Array, salt: Uint8Array }> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        enc.encode(mnemonic)
    );

    return { ciphertext, iv, salt };
}

/**
 * Decrypts the mnemonic phrase using AES-GCM.
 * @param encryptedData An object containing ciphertext, iv, and salt.
 * @param password The user's password.
 * @returns The decrypted mnemonic phrase.
 */
export async function decryptMnemonic(encryptedData: { ciphertext: ArrayBuffer, iv: Uint8Array, salt: Uint8Array }, password: string): Promise<string> {
    const { ciphertext, iv, salt } = encryptedData;
    // Need to convert ArrayBuffer back to Uint8Array if stored as JSON
    const saltBytes = new Uint8Array(Object.values(salt));
    const ivBytes = new Uint8Array(Object.values(iv));
    // Convert ciphertext ArrayBuffer if needed (depends on how it's stored/retrieved)
    // Assuming ciphertext is already ArrayBuffer
    const ciphertextBuffer = new Uint8Array(Object.values(ciphertext)).buffer;


    const key = await deriveKey(password, saltBytes);
    const dec = new TextDecoder();

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBytes,
            },
            key,
            ciphertextBuffer
        );
        return dec.decode(decrypted);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Decryption failed. Invalid password?");
    }
}

// Helper to convert ArrayBuffer to Base64 string for storage
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper to convert Base64 string back to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Example structure for storing encrypted data in LocalStorage
export interface EncryptedDataStorage {
    ct: string; // ciphertext (base64)
    iv: number[]; // iv (array of numbers)
    salt: number[]; // salt (array of numbers)
}

// --- Usage Example (Illustrative) ---

/*
async function storeEncrypted(mnemonic: string, pass: string) {
    const { ciphertext, iv, salt } = await encryptMnemonic(mnemonic, pass);
    const storageData: EncryptedDataStorage = {
        ct: arrayBufferToBase64(ciphertext),
        iv: Array.from(iv),
        salt: Array.from(salt)
    };
    localStorage.setItem('encrypted_wallet', JSON.stringify(storageData));
    console.log("Stored encrypted data");
}

async function retrieveDecrypted(pass: string): Promise<string | null> {
    const storedJson = localStorage.getItem('encrypted_wallet');
    if (!storedJson) return null;

    try {
        const storedData: EncryptedDataStorage = JSON.parse(storedJson);
        const dataToDecrypt = {
            ciphertext: base64ToArrayBuffer(storedData.ct),
            iv: new Uint8Array(storedData.iv),
            salt: new Uint8Array(storedData.salt)
        };
        const mnemonic = await decryptMnemonic(dataToDecrypt, pass);
        console.log("Decrypted mnemonic:", mnemonic);
        return mnemonic;
    } catch (error) {
        console.error("Failed to retrieve/decrypt:", error);
        return null;
    }
}
*/

"use client"; // Needed for useState and onClick handlers

import { useState } from "react";
import CreateAccountFlow from "../../components/CreateAccountFlow"; // We'll create this next
// Import component placeholder (you'd create this later)
// import ImportAccountFlow from './components/ImportAccountFlow';

export default function Home() {
    const [showAuthOptions, setShowAuthOptions] = useState(false);
    const [showCreateFlow, setShowCreateFlow] = useState(false);
    const [showImportFlow, setShowImportFlow] = useState(false); // For later

    const handleSignInClick = () => {
        setShowAuthOptions(true);
    };

    const handleCreateClick = () => {
        setShowAuthOptions(false); // Hide options
        setShowCreateFlow(true); // Show create flow component
    };

    const handleImportClick = () => {
        // TODO: Implement Import Flow later
        console.log("Import account clicked");
        // setShowAuthOptions(false);
        // setShowImportFlow(true);
    };

    // If create flow is active, render only that
    if (showCreateFlow) {
        return <CreateAccountFlow />;
    }

    // If import flow is active, render only that (for future)
    // if (showImportFlow) {
    //   return <ImportAccountFlow />;
    // }

    return (
        <main style={styles.container}>
            <h1>Welcome to Your Wallet</h1>

            {!showAuthOptions && !showCreateFlow && !showImportFlow && (
                <button onClick={handleSignInClick} style={styles.button}>
                    Sign In / Get Started
                </button>
            )}

            {showAuthOptions && (
                <div style={styles.authOptions}>
                    <h2>Choose an option:</h2>
                    <button onClick={handleCreateClick} style={styles.button}>
                        Create New Account
                    </button>
                    <button
                        onClick={handleImportClick}
                        style={{ ...styles.button, ...styles.secondaryButton }}
                    >
                        Import Existing Account
                    </button>
                </div>
            )}
        </main>
    );
}

// Basic Styling (consider using CSS Modules or Tailwind)
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
        fontFamily: "sans-serif",
    },
    authOptions: {
        marginTop: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "15px",
        border: "1px solid #ccc",
        padding: "30px",
        borderRadius: "8px",
    },
    button: {
        padding: "12px 25px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "#0070f3",
        color: "white",
        border: "none",
        borderRadius: "5px",
    },
    secondaryButton: {
        backgroundColor: "#eee",
        color: "#333",
    },
};

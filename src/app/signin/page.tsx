"use client";

import { useState } from "react";
import CreateAccountFlow from "../../components/CreateAccountFlow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Import, KeyRound } from "lucide-react";

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
        <main className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-12 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
            <div className="w-full max-w-md mx-auto text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-6 bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 text-transparent bg-clip-text">
                    Welcome to Your Wallet
                </h1>

                {!showAuthOptions && !showCreateFlow && !showImportFlow && (
                    <Button 
                        onClick={handleSignInClick} 
                        className="w-full py-6 px-8 text-lg justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white focus:ring-2 focus:ring-blue-400 hover:shadow-xl transition duration-200"
                        size="lg"
                    >
                        <KeyRound className="mr-2 h-6 w-6" />
                        Sign In / Get Started
                    </Button>
                    
                )}

                {showAuthOptions && (
                    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl">Choose an option</CardTitle>
                            <CardDescription>Create a new wallet or import an existing one</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button 
                                onClick={handleCreateClick} 
                                className="w-full py-6 text-lg justify-center rounded-lg"
                                size="lg"
                            >
                                <Shield className="mr-2 h-5 w-5" />
                                Create New Account
                            </Button>
                            
                            <Button 
                                onClick={handleImportClick} 
                                variant="outline"
                                className="w-full py-6 text-lg justify-center rounded-lg border-zinc-300 dark:border-zinc-700"
                                size="lg"
                            >
                                <Import className="mr-2 h-5 w-5" />
                                Import Existing Account
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}

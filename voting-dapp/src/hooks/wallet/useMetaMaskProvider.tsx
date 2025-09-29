"use client";

import { useEffect, useState } from "react";

export interface UseMetaMaskProviderState {
  provider: any;
  isConnecting: boolean;
  error: string | null;
}

export const useMetaMaskProvider = (): UseMetaMaskProviderState => {
  const [provider, setProvider] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initProvider = async () => {
      if (typeof window === "undefined") return;

      try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === "undefined") {
          setError("MetaMask not detected. Please install MetaMask.");
          return;
        }

        setProvider(window.ethereum);
        setError(null);
      } catch (err) {
        setError("Failed to initialize MetaMask provider");
        console.error("MetaMask provider initialization error:", err);
      }
    };

    initProvider();
  }, []);

  const connect = async () => {
    if (!provider) {
      setError("MetaMask provider not available");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      await provider.request({ method: "eth_requestAccounts" });
    } catch (err: any) {
      if (err.code === 4001) {
        setError("User rejected the connection request");
      } else {
        setError("Failed to connect to MetaMask");
      }
      console.error("MetaMask connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Add connect method to the return object
  return {
    provider,
    isConnecting,
    error,
    connect,
  } as UseMetaMaskProviderState & { connect: () => Promise<void> };
};

"use client";

import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";

export interface UseMetaMaskSignerState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  signer: ethers.JsonRpcSigner | undefined;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToChain: (chainId: number) => Promise<void>;
}

export const useMetaMaskSigner = (
  initialMockChains?: Readonly<Record<number, string>>
): UseMetaMaskSignerState => {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [accounts, setAccounts] = useState<string[] | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>();

  const mockChainsRef = useRef<Record<number, string> | undefined>(
    initialMockChains
  );

  // Initialize provider
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initProvider = async () => {
      try {
        if (typeof window.ethereum === "undefined") {
          setError("MetaMask not detected. Please install MetaMask.");
          return;
        }

        const ethProvider = window.ethereum;
        setProvider(ethProvider);

        // Check if already connected
        const accounts = await ethProvider.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          setAccounts(accounts);
          setIsConnected(true);

          // Get chain ID
          const chainIdHex = await ethProvider.request({ method: "eth_chainId" });
          const chainId = parseInt(chainIdHex as string, 16);
          setChainId(chainId);

          // Create signer - if this is a mock chain, MetaMask should already be connected to the mock RPC
          const ethersProvider = new ethers.BrowserProvider(ethProvider);
          const signer = await ethersProvider.getSigner();
          setSigner(signer);
        }
      } catch (err) {
        setError("Failed to initialize MetaMask");
        console.error("MetaMask initialization error:", err);
      }
    };

    initProvider();
  }, []); // Only run once on mount, mockChains config doesn't change

  // Listen for account changes
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = async (newAccounts: string[]) => {
      if (newAccounts.length === 0) {
        // User disconnected
        setAccounts(undefined);
        setIsConnected(false);
        setSigner(undefined);
      } else {
        setAccounts(newAccounts);
        setIsConnected(true);

        // Create new signer
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        setSigner(signer);
      }
    };

    const handleChainChanged = async (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);

      // Recreate signer with new chain
      if (accounts && accounts.length > 0) {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        setSigner(signer);
      }
    };

    const handleDisconnect = () => {
      setAccounts(undefined);
      setIsConnected(false);
      setSigner(undefined);
      setChainId(undefined);
    };

    // Use addEventListener for Eip1193Provider compatibility
    if (typeof (provider as any).on === 'function') {
      (provider as any).on("accountsChanged", handleAccountsChanged);
      (provider as any).on("chainChanged", handleChainChanged);
      (provider as any).on("disconnect", handleDisconnect);
    }

    return () => {
      if (typeof (provider as any).removeListener === 'function') {
        (provider as any).removeListener("accountsChanged", handleAccountsChanged);
        (provider as any).removeListener("chainChanged", handleChainChanged);
        (provider as any).removeListener("disconnect", handleDisconnect);
      }
    };
  }, [provider, accounts]);

  const connect = async () => {
    if (!provider) {
      setError("MetaMask provider not available");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setAccounts(accounts);
      setIsConnected(true);

      // Get chain ID
      const chainIdHex = await provider.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex as string, 16);
      setChainId(chainId);

      // Create signer
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      setSigner(signer);
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

  const disconnect = () => {
    setAccounts(undefined);
    setIsConnected(false);
    setSigner(undefined);
    setChainId(undefined);
    setError(null);
  };

  const switchToChain = async (targetChainId: number) => {
    if (!provider) {
      setError("MetaMask not connected");
      return;
    }

    try {
      const chainIdHex = `0x${targetChainId.toString(16)}`;

      // Check if this is a mock chain that needs custom RPC
      const mockRpcUrl = mockChainsRef.current?.[targetChainId];

      if (mockRpcUrl) {
        // For mock chains, we need to add the network to MetaMask first
        const networkParams = {
          chainId: chainIdHex,
          chainName: `Mock Chain ${targetChainId}`,
          nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: [mockRpcUrl],
          blockExplorerUrls: [],
        };

        try {
          // Try to switch to the network
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
          });
          console.log(`Successfully switched to existing network ${targetChainId}`);
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            console.log(`Adding network ${targetChainId} to MetaMask with RPC: ${mockRpcUrl}`);
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [networkParams],
            });
            console.log(`Successfully added network ${targetChainId}`);
          } else {
            console.error(`Failed to switch to network ${targetChainId}:`, switchError);
            throw switchError;
          }
        }
      } else {
        // For real networks, just try to switch
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      }
    } catch (err: any) {
      setError(`Failed to switch to chain ${targetChainId}: ${err.message}`);
      console.error("Chain switch error:", err);
    }
  };

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    isConnecting,
    error,
    signer,
    connect,
    disconnect,
    switchToChain,
  };
};
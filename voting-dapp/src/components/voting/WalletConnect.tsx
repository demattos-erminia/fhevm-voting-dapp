"use client";

import { useMetaMaskSigner } from "@/hooks/wallet/useMetaMaskSigner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface WalletConnectProps {
  mockChains?: Record<number, string>;
}

export const WalletConnect = ({ mockChains }: WalletConnectProps) => {
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    isConnecting,
    error,
    signer,
    connect,
    disconnect,
  } = useMetaMaskSigner(mockChains);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet";
      case 11155111:
        return "Sepolia Testnet";
      case 31337:
        return "Hardhat Local";
      default:
        return `Chain ${chainId}`;
    }
  };

  if (!provider) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Wallet Required</CardTitle>
          <CardDescription className="text-center">
            Please install MetaMask or another Web3 wallet to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => window.open("https://metamask.io/", "_blank")}
          >
            Install MetaMask
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Connect Wallet</CardTitle>
          <CardDescription className="text-center">
            Connect your wallet to participate in encrypted voting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={connect}
            loading={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </Button>
          {error && (
            <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Wallet Connected</CardTitle>
        <CardDescription className="text-center">
          Your encrypted voting wallet is ready
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">Address</div>
          <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
            {accounts && accounts[0] ? formatAddress(accounts[0]) : "Unknown"}
          </div>
        </div>

        {chainId && (
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-600">Network</div>
            <div className="text-sm font-medium">{getChainName(chainId)}</div>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={disconnect}
        >
          Disconnect
        </Button>
      </CardContent>
    </Card>
  );
};

// FHEVM Types for the voting dapp

export interface FhevmInstance {
  userDecrypt?: (handles: { handle: string; contractAddress: string }[], privateKey: string, publicKey: string, signature: string, contractAddresses: string[], userAddress: string, startTimestamp: number, durationDays: number) => Promise<Record<string, any>>;
  decrypt?: (contractAddress: string, handle: string) => Promise<any>;
  decryptPublic?: (contractAddress: string, handle: string) => Promise<any>;
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  getPublicKey: () => any;
  getPublicParams: (size: number) => any;
}

export interface FhevmWindowType extends Window {
  relayerSDK: FhevmRelayerSDKType;
}

export interface FhevmRelayerSDKType {
  initSDK: (options?: FhevmInitSDKOptions) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: FhevmNetworkConfig;
  __initialized__?: boolean;
}

export interface FhevmInitSDKOptions {
  threads?: number;
}

export type FhevmLoadSDKType = () => Promise<void>;
export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;

export interface FhevmNetworkConfig {
  aclContractAddress: `0x${string}`;
  inputVerifierContractAddress: `0x${string}`;
  kmsContractAddress: `0x${string}`;
  network?: string;
  gatewayChainId: number;
  chainId: number;
}

export interface FhevmInstanceConfig extends FhevmNetworkConfig {
  publicKey?: string;
  publicParams?: string;
  network: string;
}
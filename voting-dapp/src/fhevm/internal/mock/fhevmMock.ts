//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAY USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

// Wrapper class to adapt MockFhevmInstance to our FhevmInstance interface
class AdaptedMockFhevmInstance implements FhevmInstance {
  private mockInstance: MockFhevmInstance;

  constructor(mockInstance: MockFhevmInstance) {
    this.mockInstance = mockInstance;
  }

  createEncryptedInput(contractAddress: string, userAddress: string): any {
    return this.mockInstance.createEncryptedInput(contractAddress, userAddress);
  }

  getPublicKey(): any {
    const result = this.mockInstance.getPublicKey();
    return result ? result.publicKey : "";
  }

  getPublicParams(size: number): any {
    const result = this.mockInstance.getPublicParams(size as any);
    return result ? result.publicParams : "";
  }

  // Optional methods - may not be implemented in mock
  userDecrypt?(): Promise<Record<string, any>> {
    return Promise.resolve({});
  }

  decrypt?(): Promise<any> {
    return Promise.resolve(null);
  }

  decryptPublic?(): Promise<any> {
    return Promise.resolve(null);
  }
}

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  const provider = new JsonRpcProvider(parameters.rpcUrl);
  const mockInstance = await MockFhevmInstance.create(provider, provider, {
    aclContractAddress: parameters.metadata.ACLAddress,
    chainId: parameters.chainId,
    gatewayChainId: 55815,
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption:
      "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification:
      "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
  });

  return new AdaptedMockFhevmInstance(mockInstance);
};
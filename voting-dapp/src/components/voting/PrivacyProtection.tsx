"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface PrivacyProtectionProps {
  showDetailed?: boolean;
}

export const PrivacyProtection = ({ showDetailed = false }: PrivacyProtectionProps) => {
  if (!showDetailed) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔐</div>
            <div>
              <h4 className="font-semibold text-blue-900">Privacy Protected</h4>
              <p className="text-sm text-blue-700">
                Your vote is encrypted using FHE technology and remains private.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            Privacy Protection Overview
          </CardTitle>
          <CardDescription>
            How FHEVM ensures your voting privacy and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Encryption Process */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">🔒 Vote Encryption</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Your vote is encrypted before leaving your device</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Uses Fully Homomorphic Encryption (FHE) technology</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Only encrypted ciphertext is stored on the blockchain</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>No one can read your vote, including system administrators</span>
                </div>
              </div>
            </div>
          </div>

          {/* Result Revelation */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">📊 Result Revelation</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Results remain encrypted until voting period ends</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Minimum vote threshold must be met before revelation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Only proposal creator can trigger result revelation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Decrypted results are verifiable but anonymous</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Guarantees */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">🛡️ Security Guarantees</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h5 className="font-medium text-red-900 mb-2">What We Protect Against</h5>
                <ul className="text-xs text-red-800 space-y-1">
                  <li>• Vote manipulation</li>
                  <li>• Individual vote tracking</li>
                  <li>• Coercion and bribery</li>
                  <li>• System compromise</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="font-medium text-green-900 mb-2">What We Guarantee</h5>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>• Vote anonymity</li>
                  <li>• Result integrity</li>
                  <li>• Vote verifiability</li>
                  <li>• System transparency</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">⚙️ Technical Implementation</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h6 className="font-medium text-gray-900 mb-2">Frontend Encryption</h6>
                  <ul className="text-gray-700 space-y-1">
                    <li>• TFHE WASM library</li>
                    <li>• Client-side key generation</li>
                    <li>• Zero-knowledge proofs</li>
                    <li>• Input validation</li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-medium text-gray-900 mb-2">Smart Contract Logic</h6>
                  <ul className="text-gray-700 space-y-1">
                    <li>• FHE data types (euint32)</li>
                    <li>• Encrypted arithmetic</li>
                    <li>• Access control lists</li>
                    <li>• Result aggregation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Facts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">🔒</div>
            <h4 className="font-semibold text-gray-900 mb-1">End-to-End Encryption</h4>
            <p className="text-xs text-gray-600">
              Your vote is encrypted from the moment you select it until results are revealed
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">🎭</div>
            <h4 className="font-semibold text-gray-900 mb-1">Complete Anonymity</h4>
            <p className="text-xs text-gray-600">
              No way to link votes back to individual voters, even by system administrators
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">✅</div>
            <h4 className="font-semibold text-gray-900 mb-1">Verifiable Results</h4>
            <p className="text-xs text-gray-600">
              Anyone can verify that results are correctly calculated from encrypted votes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

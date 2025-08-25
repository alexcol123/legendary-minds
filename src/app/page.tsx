// Enhanced AXEL Page with Dynamic Video Switching and Hopkins Synthesis + Password Protection
"use client";

import { useState } from "react";

import ConsultantsPage from "@/components/MyCreations/Consultants";

export default function AxelPage() {
  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  // Password check function
  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!passwordInput.trim()) {
      setPasswordError("Please enter the access code");
      return;
    }

    setIsCheckingPassword(true);
    setPasswordError("");

    try {
      // Simulate checking password (in real app, you'd use process.env.PASSWORD)
      const correctPassword = process.env.NEXT_PUBLIC_AXEL_PASSWORD;

      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (passwordInput === correctPassword) {
        setIsAuthenticated(true);
        setPasswordInput("");
      } else {
        setPasswordError("❌ Invalid access code. AXEL remains locked.");
        setPasswordInput("");
      }
    } catch {
      setPasswordError("🔧 System error. Please try again.");
    } finally {
      setIsCheckingPassword(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* AXEL Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/30 border-4 border-red-400/50">
              <span className="text-4xl font-black text-white">⚡</span>
            </div>
            <h1 className="text-4xl font-bold text-red-500 mb-2 tracking-wider">
              ⚡ AXEL SECURED ⚡
            </h1>
            <p className="text-gray-300 text-lg font-medium">
              AI Overlord - Access Restricted
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Enter the access code to speak with AXEL
            </p>
          </div>

          {/* Password Form */}
          <div className="bg-gray-900/80 border-2 border-red-500/50 rounded-xl p-8 backdrop-blur-sm shadow-2xl">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-red-400 font-bold mb-2"
                >
                  🔐 Access Code
                </label>
                <input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-4 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none transition-colors text-center text-lg font-mono tracking-wider"
                  placeholder="Enter code to unlock AXEL..."
                  disabled={isCheckingPassword}
                />
              </div>

              {passwordError && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-center">
                  <p className="text-red-300 text-sm font-medium">
                    {passwordError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isCheckingPassword || !passwordInput.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isCheckingPassword ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    🔍 VERIFYING ACCESS...
                  </span>
                ) : (
                  "🚀 UNLOCK AXEL"
                )}
              </button>
            </form>

            {/* Fun flavor text */}
            <div className="mt-6 text-center">
              <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-xs italic">
                  &quot;Mein Gott, while you struggle with passwords,
                  <br />
                  I&apos;ve optimized seventeen different income streams.&quot;
                  <br />
                  <span className="text-red-400 font-bold">- AXEL</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ConsultantsPage />
    </div>
  );
}

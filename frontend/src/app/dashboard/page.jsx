"use client";
import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaTelegramPlane, FaCode } from "react-icons/fa";
import Web3 from "web3";
import { getContractsForUser, getSolidityCode } from "@/lib/contractService";
import { GlobalContext } from "@/contexts/UserContext";

const chainConfig = {
  2710: { name: "Morph Testnet", logo: "/chain/morph-logo.jpeg", path: "morph" },
  31: { name: "RootStock Testnet", logo: "/chain/base-logo.png", path: "base" },
  8008135: { name: "Fhenix Helium", logo: "/chain/fhenix-logo.png", path: "fhenix" },
  rootstock: { name: "Chainlink", logo: "/chain/base-logo.png", path: "base" },
  84532: { name: "Base Sepolia", logo: "/chain/base-logo.png", path: "base" },
  8453: { name: "Base", logo: "/chain/base-logo.png", path: "base" },
  11155420: { name: "Optimism Sepolia", logo: "/chain/optimism-logo.png", path: "optimism" },
  10: { name: "Optimism", logo: "/chain/optimism-logo.png", path: "optimism" },
  114: { name: "Flare Testnet", logo: "/chain/flare-logo.png", path: "flare" },
  default: { name: "Unknown Chain", logo: "/chain/hedera-logo.png", path: "base" },
};

const getChainInfo = (chainId) => {
  if (chainId === "rootstock") return chainConfig.rootstock;
  return chainConfig[chainId] || chainConfig.default;
};

const DashboardPage = () => {
  const [userContracts, setUserContracts] = useState([]);
  const [account, setAccount] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [nameInitials, setNameInitials] = useState("");
  const { userData } = useContext(GlobalContext);
  const router = useRouter();

  // Connect to wallet and get account address
  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          const web3 = new Web3(window.ethereum);
          const accounts = await web3.eth.getAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsWalletConnected(true);
          } else {
            setIsWalletConnected(false);
          }
        } catch (error) {
          console.error("Error connecting to wallet:", error);
          setIsWalletConnected(false);
        }
      } else {
        console.log("Please install MetaMask!");
        setIsWalletConnected(false);
      }
    };

    connectWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsWalletConnected(true);
        } else {
          setAccount(null);
          setIsWalletConnected(false);
        }
      });
    }

    // Cleanup listener on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  // Fetch contracts when account is available and set name initials if userData exists
  useEffect(() => {
    if (account) {
      const fetchContracts = async () => {
        try {
          const contracts = await getContractsForUser(account);
          setUserContracts(contracts);
        } catch (error) {
          console.error("Error fetching user contracts:", error);
        }
      };

      fetchContracts();
    }

    if (userData && userData.name) {
      const initials = userData.name.split(" ").map((n) => n[0]).join("");
      setNameInitials(initials);
    }
  }, [account, userData]);

  const handleViewCode = async (contract) => {
    try {
      const code = await getSolidityCode(contract.solidityFilePath);
      const chainInfo = getChainInfo(contract.chainId);
      localStorage.setItem("loadedContractCode", code);
      router.push(`/agent/${chainInfo.path}/code`);
    } catch (error) {
      console.error("Error loading contract code:", error);
    }
  };

  // Show message if wallet is not connected
  if (!isWalletConnected) {
    return (
      <div className="p-8 min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-2xl font-bold">
          Please connect your wallet to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            {userData && userData.profileImage ? (
              <Image
                src={userData.profileImage}
                alt="User Avatar"
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-theme-purple-light rounded-full flex items-center justify-center text-2xl font-bold">
                {account ? account.slice(0, 2).toUpperCase() : nameInitials || "??"}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {userData?.name || "Welcome!"}
              </h1>
              <p className="text-gray-600">
                {account
                  ? `${account.slice(0, 6)}...${account.slice(-4)}`
                  : userData?.email || "No account connected"}
              </p>
              {userData?.verifier && (
                <p className="text-sm text-gray-500">
                  Verified by: {userData.verifier}
                </p>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Your Deployed Contracts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userContracts.map((contract, index) => {
            const chainInfo = getChainInfo(contract.chainId);
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-5">
                <div className="flex w-full justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={chainInfo.logo}
                      alt={chainInfo.name}
                      width={30}
                      height={30}
                    />
                    <div className="text-xl font-bold">{chainInfo.name}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewCode(contract)}
                      className="text-2xl p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      <FaCode />
                    </button>
                    <Link
                      href={contract.blockExplorerUrl}
                      className="text-2xl p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <FaTelegramPlane />
                    </Link>
                  </div>
                </div>
                <div className="font-light text-sm mb-2">
                  Address: {contract.contractAddress.slice(0, 10)}...
                  {contract.contractAddress.slice(-8)}
                </div>
                <div className="font-light text-sm">
                  Deployed on:{" "}
                  {new Date(contract.deploymentDate).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
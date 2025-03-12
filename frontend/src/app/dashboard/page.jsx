"use client"
import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaTelegramPlane, FaCode } from 'react-icons/fa';
import { getContractsForUser, getSolidityCode } from '@/lib/contractService';
import { GlobalContext } from "@/contexts/UserContext";

const chainConfig = {
  2710: { name: 'Morph Testnet', logo: '/chain/morph-logo.jpeg', path: 'morph' },
  31: { name: 'RootStock Testnet', logo: '/chain/base-logo.png', path: 'base' },
  8008135: { name: 'Fhenix Helium', logo: '/chain/fhenix-logo.png', path: 'fhenix' },
  rootstock: { name: 'Chainlink', logo: '/chain/base-logo.png', path: 'base' },
  84532: { name: 'Base Sepolia', logo: '/chain/base-logo.png', path: 'base' },
  8453: { name: 'Base', logo: '/chain/base-logo.png', path: 'base' },
  11155420: { name: 'Optimism Sepolia', logo: '/chain/optimism-logo.png', path: 'optimism' },
  10: { name: 'Optimism', logo: '/chain/optimism-logo.png', path: 'optimism' },
  default: { name: 'Unknown Chain', logo: '/chain/hedera-logo.png', path: 'base' }
};

const getChainInfo = (chainId) => {
  if (chainId === 'rootstock') return chainConfig.rootstock;
  return chainConfig[chainId] || chainConfig.default;
};

const DashboardPage = () => {
  const [userContracts, setUserContracts] = useState([]);
  const { userData } = useContext(GlobalContext);
  const [nameInitials, setNameInitials] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (userData && userData.email) {
      const fetchContracts = async () => {
        try {
          const contracts = await getContractsForUser(userData.email);
          console.log(contracts)
          setUserContracts(contracts);
        } catch (error) {
          console.error("Error fetching user contracts:", error);
        }
      };

      fetchContracts();

      if (userData.name) {
        const initials = userData.name.split(' ').map((n) => n[0]).join('');
        setNameInitials(initials);
      }
    }
  }, [userData]);

  const handleViewCode = async (contract) => {
    try {
      // Get the code from Firebase using the stored file path
      const code = await getSolidityCode(contract.solidityFilePath);
      
      // Get the appropriate agent path based on chain ID
      const chainInfo = await getChainInfo(contract.chainId);
      
      // Store the code in localStorage for the agent page to access
      localStorage.setItem('loadedContractCode', code);
      
      // Navigate to the appropriate agent page
      router.push(`/agent/${chainInfo.path}/code`);
    } catch (error) {
      console.error("Error loading contract code:", error);
      // You might want to show a toast notification here
    }
  };

  if (!userData) {
    return (
      <div className="p-8 min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-2xl font-bold">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            {userData.profileImage ? (
              <Image
                src={userData.profileImage}
                alt="User Avatar"
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-theme-purple-light rounded-full flex items-center justify-center text-2xl font-bold">
                {nameInitials}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{userData.name || 'Welcome!'}</h1>
              <p className="text-gray-600">{userData.email}</p>
              {userData.verifier && <p className="text-sm text-gray-500">Verified by: {userData.verifier}</p>}
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
                    <div className="text-xl font-bold">
                      {chainInfo.name}
                    </div>
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
                  Deployed on: {new Date(contract.deploymentDate).toLocaleDateString()}
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
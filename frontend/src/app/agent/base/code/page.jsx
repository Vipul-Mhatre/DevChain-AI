"use client";
import React, { useState, useContext, useEffect } from "react";
import { Avatar, Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { ethers } from "ethers";
import SolidityEditor from "@/components/SolidityEditor";
import axios from "axios";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useAccount } from "wagmi";
import { useSolidityCodeAgent } from "@/hooks/useSolidityCodeAgent";
import { Toaster, toast } from "react-hot-toast";
import { useContractState } from "@/contexts/ContractContext";
import { saveContractData, saveSolidityCode } from "@/lib/contractService";
import ContractInteraction from "@/components/ContractInteractions";
import { PRIVATE_KEY } from "@/utils/config";
import ConstructorArgsModal from "@/components/ConstructorArgsModal";
import SecondaryNavbar from "@/components/SecondaryNavbar";

export default function Editor() {
    const {
        agentResponse,
        handleRunAgent,
        inputDisabled,
        setAgentResponse,
        progressMessage,
    } = useSolidityCodeAgent();

    const [userPrompt, setUserPrompt] = useState("");
    const [result, setResult] = useState(null);
    const { setContractState, contractState } = useContractState();
    const [isCompiling, setCompiling] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const account = useAccount();

    const BACKEND_URL =
        "https://msl8g5vbv6.execute-api.ap-south-1.amazonaws.com/prod/api/contract/compile";
    
    // **Changed for Flare Testnet (Coston2)**
    const FLARE_TESTNET_CHAIN_ID = 114; // Updated from BASE_SEPOLIA_CHAIN_ID = 84532

    useEffect(() => {
        const loadedCode = localStorage.getItem("loadedContractCode");
        if (loadedCode) {
            setAgentResponse(loadedCode);
        }
    }, []);

    const compileCode = async () => {
        setCompiling(true);

        if (!agentResponse) {
            toast.error("Nothing to compile!");
            setCompiling(false);
            return;
        }

        if (agentResponse.includes("import")) {
            toast.error("Importing contracts is not yet supported :(");
            setCompiling(false);
            return;
        }
        try {
            const formData = new FormData();
            formData.append(
                "file",
                new Blob([agentResponse], { type: "text/plain" }),
                "Contract.sol"
            );
            const response = await axios.post(BACKEND_URL, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(response.data);
            if (response.data.status === "success") {
                setContractState((prevState) => ({
                    ...prevState,
                    abi: response.data.abi,
                    bytecode: response.data.bytecode,
                    isCompiled: true,
                }));
            }
        } catch (error) {
            console.error("Error compiling contract:", error.response.data);
            setResult(error.response.data);
        } finally {
            setCompiling(false);
        }
    };
    const DeployContract = async ({ constructorArgs }) => {
        console.log("Initiating contract deployment...");
        setIsModalOpen(false);
        
        try {
            setIsDeploying(true);
    
            // **Check if MetaMask is installed**
            if (!window.ethereum) {
                toast.error("MetaMask is not installed! Please install MetaMask to deploy contracts.");
                return;
            }
    
            // **Initialize provider and signer with MetaMask**
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
    
            // **Request account access from MetaMask**
            console.log("Requesting account access...");
            try {
                await provider.send("eth_requestAccounts", []);
            } catch (error) {
                console.error("User denied account access:", error);
                toast.error("Please connect MetaMask to continue.");
                return;
            }
    
            // **Define Flare Testnet (Coston2) network details**
            const flareTestnet = {
                chainId: "0x72", // 114 in hex
                chainName: "Flare Testnet Coston2",
                nativeCurrency: {
                    name: "Coston2 Flare",
                    symbol: "C2FLR",
                    decimals: 18,
                },
                rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
                blockExplorerUrls: ["https://coston2-explorer.flare.network/"],
            };
    
            // **Check and switch to Flare Testnet**
            let network = await provider.getNetwork();
            console.log("Current network chainId:", network.chainId);
            const FLARE_TESTNET_CHAIN_ID = 114;
    
            if (network.chainId !== FLARE_TESTNET_CHAIN_ID) {
                console.log("Attempting to switch to Flare Testnet...");
                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: flareTestnet.chainId }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        console.log("Flare Testnet not found in MetaMask, adding it...");
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [flareTestnet],
                        });
                    } else {
                        throw new Error("Network switch failed. Please switch to Flare Testnet manually in MetaMask.");
                    }
                }
    
                // **Verify network after switching**
                network = await provider.getNetwork();
                if (network.chainId !== FLARE_TESTNET_CHAIN_ID) {
                    throw new Error("Failed to switch to Flare Testnet. Please switch manually in MetaMask.");
                }
            }
    
            // **Ensure ABI and bytecode are defined before proceeding**
            if (!result || !result.abi || !result.bytecode) {
                throw new Error("Smart contract ABI or bytecode is missing.");
            }
    
            // **Create contract factory with MetaMask signer**
            const contractFactory = new ethers.ContractFactory(result.abi, result.bytecode, signer);
    
            // **Deploy the contract via MetaMask**
            console.log("Sending deployment transaction to MetaMask...");
            const contract = await contractFactory.deploy(...constructorArgs);
    
            toast.success("Transaction sent! Awaiting MetaMask confirmation...");
    
            // **Wait for deployment confirmation**
            console.log("Waiting for contract to be deployed...");
            await contract.deployed();
    
            // **Construct block explorer URL**
            const blockExplorerUrl = `https://coston2-explorer.flare.network/address/${contract.address}`;
    
            // **Save Solidity code**
            const solidityCode = agentResponse; // Ensure 'agentResponse' contains the Solidity code
            const fileName = `Contract_${contract.address}.sol`;
            const solidityFilePath = await saveSolidityCode(solidityCode, fileName);
    
            // **Prepare and save contract data**
            const contractData = {
                chainId: FLARE_TESTNET_CHAIN_ID,
                contractAddress: contract.address,
                abi: result.abi,
                bytecode: result.bytecode,
                blockExplorerUrl: blockExplorerUrl,
                solidityFilePath: solidityFilePath,
                deploymentDate: new Date().toISOString(),
            };
    
            // **Get user address from signer**
            const userAddress = await signer.getAddress();
            if (userAddress) {
                await saveContractData(contractData, userAddress);
            } else {
                console.error("User address not available");
            }
    
            // **Update contract state**
            await setContractState((prevState) => ({
                ...prevState,
                address: contract.address,
                isDeployed: true,
                blockExplorerUrl: blockExplorerUrl,
            }));
    
            // **Display success message**
            toast.success(
                <div>
                    Contract deployed successfully at {contract.address}!
                    <a
                        href={blockExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-blue-500 hover:underline"
                    >
                        View on Block Explorer
                    </a>
                </div>,
                { duration: 5000 }
            );
            console.log(`Contract deployed at: ${contract.address}`);
    
        } catch (error) {
            setError(error);
            console.error("Deployment error:", error);
    
            // **Enhanced error handling**
            if (error.code === "INVALID_ARGUMENT") {
                toast.error("Invalid constructor arguments provided.");
            } else if (error.code === 4001) {
                toast.error("Transaction rejected by user in MetaMask.");
            } else if (error.message.includes("insufficient funds")) {
                toast.error("Insufficient funds in your MetaMask account to deploy the contract.");
            } else if (error.message.includes("Network switch failed")) {
                toast.error(error.message);
            } else {
                toast.error(`Deployment failed: ${error.message || "Unknown error"}`);
            }
        } finally {
            setIsDeploying(false);
        }
    };

    
    const handleCodeChange = (code) => {
        setAgentResponse(code);
        localStorage.setItem("loadedContractCode", code);
    };

    const RenderResult = () => {
        const [ABIcopied, setABICopied] = useState(false);
        const [Bytecopied, setByteCopied] = useState(false);

        const copyToClipboard = (text, ele) => {
            navigator.clipboard.writeText(text);
        };

        if (!result) {
            return (
                <div className="bg-gray-100 border border-gray-400 text-black p-4 rounded">
                    Compilation results will appear here.
                </div>
            );
        }
        if (result.status === "error") {
            const error = result.message;
            return (
                <div>
                    <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
                        <h3 className="font-bold">Compilation failed!</h3>
                        <p>{error}</p>
                    </div>
                </div>
            );
        }
        if (result.status === "success") {
            return (
                <div>
                    <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded">
                        <h3 className="font-bold">Compilation Successful!</h3>
                    </div>
                </div>
            );
        }
        return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded">
                Error while compilation!.
            </div>
        );
    };

    const handleDeployContract = async () => {
        console.log("Deploying contract...");
        if (!result || result.status !== "success") {
            toast.error("Please compile the contract successfully before deploying.");
            return;
        }
        if (result.abi.filter((item) => item.type === "constructor").length > 0) {
            if (result.abi.filter((item) => item.type === "constructor")[0].inputs.length > 0) {
                console.log("Constructor arguments found");
                setIsModalOpen(true);
                return;
            }
        }
        await DeployContract({
            constructorArgs: [],
        });
    };

    return (
        <div className="">
            <Toaster />
            {isModalOpen && (
                <ConstructorArgsModal
                    setIsModalOpen={setIsModalOpen}
                    abi={result.abi}
                    onSubmit={async (args) => {
                        await DeployContract({ constructorArgs: args });
                    }}
                />
            )}
            <div className="flex ">
                <div className="w-1/2 p-2">
                    <Card className="flex-grow h-full p-6">
                        <div className="max-w-2xl bg-gray-100 p-4 rounded-lg shadow-md">
                            <div className="flex items-center space-x-4">
                                {/* **Changed for Flare Testnet (Coston2)** */}
                                {/* Removed Base logo; optionally replace with Flare logo if available */}
                                {/* <Avatar isBordered radius="md" src="/chain/flare-logo.png" /> */}
                                <div className="flex-grow">
                                    {account?.isConnected ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-green-600 font-semibold">
                                                Connected
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600">Not connected</span>
                                    )}
                                </div>
                                <SecondaryNavbar />
                            </div>
                        </div>
                        <div className="my-3 h-48 mb-14">
                            <h1 className="font-bold my-2">Describe your smart contract</h1>
                            <textarea
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                className="w-full h-full p-4 rounded-xl border"
                                placeholder="E.g. I want to create a smart contract that allows users to create a token"
                            />
                        </div>

                        <div className="max-w-xl">
                            {account?.isConnected ? (
                                <Button
                                    disabled={inputDisabled}
                                    onClick={() => handleRunAgent(userPrompt)}
                                    color="primary"
                                >
                                    {inputDisabled ? progressMessage : "Generate code"}
                                </Button>
                            ) : (
                                <WalletConnectButton text="Connect Wallet to Generate Code" />
                            )}
                        </div>

                        <div className="my-5">
                            <RenderResult />
                        </div>
                        {account?.isConnected ? (
                            // **Changed for Flare Testnet (Coston2)**
                            <ContractInteraction currChainId={FLARE_TESTNET_CHAIN_ID} /> // Updated from BASE_SEPOLIA_CHAIN_ID
                        ) : (
                            <div className="text-gray-600 ">
                                <p className="p-2 ">
                                    Please connect your wallet to compile and deploy the contract
                                </p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* code editor part */}
                <div className="w-1/2 p-2 flex flex-col">
                    <Card className="flex-grow">
                        <CardHeader className="flex justify-between items-center px-4 py-2">
                            <div className="flex items-center">
                                {/* **Changed for Flare Testnet (Coston2)** */}
                                <h2 className="text-xl font-bold">Flare Testnet</h2> // Updated from "Base"
                            </div>

                            {/* compile and deploy buttons */}
                            {account?.isConnected && (
                                <div className="flex items-center justify-center py-2">
                                    <Button
                                        color="default"
                                        onClick={compileCode}
                                        isLoading={isCompiling}
                                    >
                                        {isCompiling ? "Compiling..." : "Compile"}
                                    </Button>
                                    <Button
                                        color="success"
                                        onClick={handleDeployContract}
                                        isLoading={isDeploying}
                                        className="ml-4"
                                    >
                                        {isDeploying ? "Deploying..." : "Deploy"}
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardBody className="p-4 h-full">
                            <div
                                className="h-full overflow-auto"
                                style={{ maxHeight: "calc(100vh - 200px)" }}
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex-grow h-screen">
                                        <SolidityEditor
                                            code={agentResponse}
                                            defaultValue={"// Solidity code will appear here"}
                                            onChange={handleCodeChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
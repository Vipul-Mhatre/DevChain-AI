"use client";
import React, { useState, useContext, useEffect } from "react";
import { Avatar, Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import Web3 from "web3"; // Replaced ethers with Web3.js
import SolidityEditor from "@/components/SolidityEditor";
import axios from "axios";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useAccount } from "wagmi";
import { useSolidityCodeAgent } from "@/hooks/useSolidityCodeAgent";
import { Toaster, toast } from "react-hot-toast";
import { useContractState } from "@/contexts/ContractContext";
import { saveContractData, saveSolidityCode } from "../../../../lib/contractService.js";
import ContractInteraction from "@/components/ContractInteractions";
import { PRIVATE_KEY } from "@/utils/config";
import {FaClipboard, FaClipboardCheck} from "react-icons/fa";
import ConstructorArgsModal from "@/components/ConstructorArgsModal";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import { GlobalContext } from "@/contexts/UserContext";

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
    const { userData } = useContext(GlobalContext);


    const account = useAccount();

    const BACKEND_URL =
        "https://msl8g5vbv6.execute-api.ap-south-1.amazonaws.com/prod/api/contract/compile";

    // Flare Testnet (Coston2) chain ID
    const FLARE_TESTNET_CHAIN_ID = 114;

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

    const DeployContract = async ({ constructorArgs = [] }) => {
        if (!result || result.status !== "success") {
            toast.error("Please compile the contract successfully before deploying.");
            return;
        }
        console.log("Deploying contract...");

        try {
            // Check for MetaMask installation
            if (!window.ethereum) {
                toast.error("Please install MetaMask to deploy the contract.");
                return;
            }

            // Request wallet connection
            await window.ethereum.request({ method: "eth_requestAccounts" });

            // Initialize Web3.js with MetaMask provider
            const web3 = new Web3(window.ethereum);

            // Verify network (Flare Testnet - Coston2)
            const chainId = await web3.eth.getChainId();
            // if (chainId !== FLARE_TESTNET_CHAIN_ID) {
            //     toast.error("Please switch to the Flare Testnet (Coston2) in MetaMask.");
            //     return;
            // }

            setIsDeploying(true);

            // Get the user's account
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];
            console.log("account", account);
            // Create contract instance with ABI
            const contract = new web3.eth.Contract(result.abi);

            // Ensure bytecode has '0x' prefix
            const bytecode = result.bytecode.startsWith('0x') ? result.bytecode : '0x' + result.bytecode;

            // Prepare deployment transaction
            const deployTx = contract.deploy({
                data: bytecode,
                arguments: constructorArgs,
            });

            // Estimate gas
            const gasEstimate = await deployTx.estimateGas({ from: account });

            // Deploy the contract
            const deployedContract = await deployTx.send({
                from: account,
                gas: gasEstimate,
            });

            const contractAddress = deployedContract.options.address;
            console.log(contractAddress)

            // Flare Testnet (Coston2) block explorer URL
            const blockExplorerUrl = `https://coston2-explorer.flare.network/address/${contractAddress}`;

            // Save Solidity code
            const solidityCode = agentResponse; // Corrected from 'suggestions' to 'agentResponse'
            const fileName = `Contract_${contractAddress}.sol`;
            const solidityFilePath = await saveSolidityCode(solidityCode, fileName);

            // Prepare contract data
            const contractData = {
                chainId: Number(114n), // or simply 114 if the value is constant
                contractAddress: deployedContract.options.address,
                abi: result.abi,
                bytecode: result.bytecode,
                blockExplorerUrl: blockExplorerUrl,
                solidityFilePath: solidityFilePath,
                deploymentDate: new Date().toISOString(),
            };

            // Save contract data if user email is available
            if (account) {
                await saveContractData(contractData, account);
            } else {
                console.error("Account addresss not available");
            }

            // Update contract state
            setContractState((prevState) => ({
                ...prevState,
                address: contractAddress,
                isDeployed: true,
                blockExplorerUrl: blockExplorerUrl,
            }));

            // Display success message
            toast.success(
                <div>
                    Contract deployed successfully!
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
            console.log(`Contract deployed at: ${contractAddress}`);
        } catch (error) {
            console.error("Error deploying contract:", error);
            toast.error("Failed to deploy contract. Check the console for details.");
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
            console.log(text);
            navigator.clipboard.writeText(text);
        };

        if (!result) {
            return (
                <div className="text-gray-600 ">
                    Compilation results will appear here.
                </div>
            );
        }

        if (result.errors && result.errors.length > 0) {
            const error = result.errors[0];
            return (
                <div>
                    <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
                        <h3 className="font-bold">Compilation failed!</h3>
                        <p>{error.message}</p>
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
                    <div className=" p-4 rounded flex items-center space-x-4 justify-end my-2">
                        <Button color="primary" className="flex gap-2 items-center" onClick={
                            () => {
                                copyToClipboard(result.bytecode, 1)
                            }
                        }>
                            <h4 className="">
                                {
                                    Bytecopied ? "Bytecode Copied" : "Copy Bytecode"
                                }
                            </h4>
                            {
                                Bytecopied ? <FaClipboardCheck/>
                                    : <FaClipboard/>
                            }
                        </Button>
                        <Button color="primary" className="flex gap-2 items-center" onClick={() => {
                            copyToClipboard(JSON.stringify(result.abi), 0)
                        }}>
                            <h4 className="">{
                                ABIcopied ? "ABI Copied" : "Copy ABI"
                            }</h4>
                            {
                                ABIcopied ? <FaClipboardCheck/>
                                    : <FaClipboard/>
                            }
                        </Button>

                    </div>

                </div>

            )
                ;
        }

        return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded">
                Unexpected result format.
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
                        <div className="max-w-full bg-gray-100 p-4 rounded-lg shadow-md">
                            <div className="flex items-center space-x-4">
                                <Avatar isBordered radius="sm" src="/chain/flare-logo.png" />
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
                            <ContractInteraction currChainId={FLARE_TESTNET_CHAIN_ID} />
                        ) : (
                            <div className="text-gray-600 ">
                                <p className="p-2 ">
                                    Please connect your wallet to compile and deploy the contract
                                </p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Code editor part */}
                <div className="w-1/2 p-2 flex flex-col">
                    <Card className="flex-grow">
                        <CardHeader className="flex justify-between items-center px-4 py-2">
                            <div className="flex items-center">
                                <h2 className="text-xl mt-4 ml-3 font-bold">Flare Testnet</h2>
                            </div>

                            {/* Compile and deploy buttons */}
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
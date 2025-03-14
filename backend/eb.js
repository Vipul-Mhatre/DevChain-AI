const Web3 = require('web3');
const fs = require('fs');
const solc = require('solc');

async function deployContract() {
  try {
    // Step 1: Specify the contract file path and name
    const contractPath = './simplestorage.sol'; // Replace with your contract's file path
    const contractName = 'SimpleStorage'; // Replace with your contract's name
    const sourceCode = fs.readFileSync(contractPath, 'utf8');

    // Step 2: Compile the Solidity contract
    const input = {
      language: 'Solidity',
      sources: {
        [contractName + '.sol']: {
          content: sourceCode,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
      },
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractOutput = output.contracts[contractName + '.sol'][contractName];
    const abi = contractOutput.abi;
    const bytecode = contractOutput.evm.bytecode.object;

    // Step 3: Set up Web3.js with Flare Testnet (Coston2) RPC URL
    const web3 = new Web3('https://coston2-api.flare.network/ext/C/rpc');

    // Step 4: Add the hardcoded private key to the wallet
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Replace with your actual private key
    web3.eth.accounts.wallet.add(privateKey);
    const account = web3.eth.accounts.wallet[0].address;

    // Step 5: Create a contract instance
    const contract = new web3.eth.Contract(abi);

    // Step 6: Estimate gas for deployment
    const gasEstimate = await contract.deploy({
      data: '0x' + bytecode,
      // arguments: [] // Uncomment and add constructor arguments if needed
    }).estimateGas();

    console.log('Estimated gas:', gasEstimate);

    // Step 7: Deploy the contract
    const newContractInstance = await contract.deploy({
      data: '0x' + bytecode,
      // arguments: [] // Uncomment and add constructor arguments if needed
    }).send({
      from: account,
      gas: Math.ceil(gasEstimate * 1.2), // Add 20% buffer to gas estimate
    });

    console.log('Contract deployed at:', newContractInstance.options.address);
  } catch (error) {
    console.error('Error deploying contract:', error);
  }
}

// Execute the deployment
deployContract();
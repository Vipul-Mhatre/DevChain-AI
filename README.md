# DevChain.AI 🚀🔥

**Helping Web 2.0 Developers onboard into Web 3.0 and making their ideas turn into reality! 🌍💡**

## About

DevChain AI is designed to streamline the blockchain development process, making it accessible and efficient for developers of all levels. Whether you're new to blockchain or an experienced developer, DevChain AI provides the tools and assistance you need to bring your ideas to life on the Flare blockchain.


![Flare](https://github.com/user-attachments/assets/612c6285-e49e-40dd-973f-0096c81c0766)



## Features


### 1. 🤖 AI-Powered Smart Contract Generator

- Describe your contract requirements in natural language
- Our AI agent will generate a fully functional smart contract based on your description
- Specialized training on Gemini models for Solidity-based contracts, with future extensions for Rust-based projects

  ![33216637-04a4-4a4c-ab04-f70f50960ece](https://github.com/user-attachments/assets/7bf8dac9-6f73-4742-a665-78adcc0c80f2)


### 2. ⚡ One-Click Compile and Deploy

- Compile your smart contracts with a single click
- Runs on GCP for high-performance execution
- Seamless deployment on the Flare blockchain
- Automated error handling and suggestions for fixes

![d36842da-60f5-4f45-8a71-63c9ee547d98](https://github.com/user-attachments/assets/7943083d-60da-4cfd-a6d6-023fecb5de93)


### 3. 🔗 Contract Interaction Tool

- Interact with deployed contracts directly from the platform
- Test and execute functions with an intuitive interface

![427d31d3-14a4-4bf1-8219-14519a35ff78](https://github.com/user-attachments/assets/c938e060-06ae-4658-bcb5-4c482a2be74c)


### 4. 📂 Saved Contract Dashboard

- Access your previously deployed contracts anytime
- Firebase integration to store and manage contract history

![Screenshot 2025-03-15 092048](https://github.com/user-attachments/assets/b819e7c5-9551-42fb-b77e-1812c3cef8cd)


### 5. 🔍 GitHub URL Scraper for Documentation Retrieval (RAG)

- Input any repository link containing documentation
- Extracts all `.md` and `.mdx` files
- Uses Gemini 2.0 Flash to answer questions based on the documentation

![sfsfs](https://github.com/user-attachments/assets/dafe8197-24c9-4862-b20f-f436dcf55e57)


## Supported Blockchain Platform

- 🔥 Flare

## How It Works

### Code Generation 🛠️

1. **Describe Your Contract**: Tell our AI what you want your smart contract to do.
2. **Generate Code**: Our AI will create a smart contract based on your description.
3. **Review and Customize**: Make any necessary adjustments to the generated code.
4. **Compile and Test**: Use our one-click compilation feature to check for errors.
5. **Deploy**: Deploy your contract to the Flare blockchain with ease.
6. **Interact**: Test and interact with your deployed contract.

### Platform Assistance 💬

1. **Ask Questions**: Pose your questions to our AI-powered assistants.
2. **Get Answers**: Receive responses with detailed explanations, code, and links to relevant resources.

## 🔒 Secure Environment & Deployment

- Utilizes **Intel Trust Domain Extensions (TDX)** for secure execution
- **Deployed in a Docker container on AWS & GCP**

## 🌐 API Endpoints

### 🛠️ Clone a GitHub Repository for Documentation Scraping

```
POST: https://flare-api-1075798775939.us-central1.run.app/clone
{
  "repo_url": "https://github.com/ethereum-optimism/docs"
}
```

### ❓ Query Extracted Documentation

```
POST: https://flare-api-1075798775939.us-central1.run.app/query
{
  "repo_url": "https://github.com/ethereum-optimism/docs"
}
```

## 🎯 Benefits

- **⏳ Time-Saving**: Reduce development time with AI-generated contracts and quick deployment. No need to read lengthy documentation.
- **📚 Learning Tool**: Perfect for beginners to understand smart contract development.
- **🚀 Error Reduction**: AI-assisted coding and compilation help minimize errors.
- **🔥 Flare Ecosystem Expertise**: Gain insights into Flare blockchain development without extensive research.

## 📝 License

DevChain AI is released under the [MIT License](LICENSE).

---

🚀 Ready to revolutionize your blockchain development experience? Get started with DevChain AI today! 🌍🔥

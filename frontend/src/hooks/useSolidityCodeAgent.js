import { useState, useCallback, useMemo } from "react";

// Load the Gemini API key from environment variables (set this in your .env file)
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "your-fallback-key";

export function useSolidityCodeAgent() {
  // State for the generated Solidity code
  const [agentResponse, setAgentResponse] = useState("// Solidity code will appear here");
  // State to disable input during processing
  const [inputDisabled, setInputDisabled] = useState(false);
  // State for progress messages during code generation
  const [progressMessage, setProgressMessage] = useState("Understanding your question...");
  // State to store the interval ID for progress messages
  const [intervalId, setIntervalId] = useState(null);

  // Memoized array of progress messages
  const codeGenerationMessages = useMemo(
    () => [
      "Retrieving knowledge base...",
      "Finding answers...",
      "Generating answers...",
      "Almost there...",
    ],
    []
  );

  // Function to remove unwanted formatting from the API response
  const removeSolidityFormatting = useCallback((inputString) => {
    return inputString
      .trim()
      .replace(/```solidity/g, "")
      .replace(/```/g, "")
      .trim();
  }, []);

  // Progress message logic
  const messages = codeGenerationMessages;
  let messageIndex = 0;

  const displayMessage = () => {
    if (messageIndex < messages.length) {
      setProgressMessage(messages[messageIndex]);
      messageIndex++;
    } else {
      messageIndex = 0; // Loop back to the start
    }
  };

  // Main function to handle user input and generate Solidity code
  const handleRunAgent = useCallback(
    async (userInput) => {
      if (!userInput.trim()) return; // Ignore empty input

      setInputDisabled(true); // Disable input during processing
      setAgentResponse("// Generating Solidity code..."); // Reset response

      // Start displaying progress messages every 3 seconds
      const id = setInterval(displayMessage, 3000);
      setIntervalId(id);

      try {
        // Make a request to the Gemini API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a Solidity code agent. Your task is to write clear, secure, and gas-efficient Solidity code based on the user's requirements. Always include detailed comments to explain your code. At the top of every contract, include an SPDX license identifier. Use "SPDX-License-Identifier: MIT" for open-source code or "SPDX-License-Identifier: UNLICENSED" for non-open-source code unless the user specifies otherwise. Format your response as pure Solidity code without markdown formatting.
                      
                      User request: ${userInput}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2, // Low temperature for precise output
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192, // Allow for longer responses if needed
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              ],
            }),
          }
        );

        // Check if the API request was successful
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Extract the generated code from the API response
        let responseText = "";
        if (
          data.candidates &&
          data.candidates.length > 0 &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts.length > 0
        ) {
          responseText = data.candidates[0].content.parts[0].text || "";
        }

        // Process the response and update the state
        const processedCode = removeSolidityFormatting(responseText);
        setAgentResponse(processedCode);
        localStorage.setItem("loadedContractCode", processedCode); // Save to local storage
      } catch (error) {
        console.error("Error processing agent response:", error);
        setAgentResponse(`// Error: ${error.message}\n// Please check your API key and try again.`);
      } finally {
        setInputDisabled(false); // Re-enable input
        clearInterval(id); // Stop progress messages
      }
    },
    [removeSolidityFormatting]
  );

  // Return the hook's API
  return {
    agentResponse,
    handleRunAgent,
    inputDisabled,
    setAgentResponse,
    progressMessage,
  };
}
"use client";
import { useState } from "react";
// import sqlite3 from "sqlite3";
// import fetch from "node-fetch";
import { useAccount } from "wagmi";
import SecondaryNavbar from "@/components/SecondaryNavbar";

export default function ChatPage() {
  const account = useAccount();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 3)}...${address.slice(-3)}`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Ensure the endpoint is '/api/chat'
      const response = await fetch(`/api/chat?question=${encodeURIComponent(input)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const botMessage = { 
        text: data.answer || "Sorry, I couldn't find an answer.", 
        sender: "bot" 
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error querying API:", error);
      setMessages((prev) => [...prev, { 
        text: "An error occurred while fetching the answer.", 
        sender: "bot" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full">
      <div className="flex gap-5 w-full px-5 justify-between items-center">
        <div className="flex flex-col justify-center">
          <div className="font-bold text-2xl">Flare Agent</div>
          <p>Our agent knows just about everything there is to know about Flare and blockchain!</p>
        </div>
        <SecondaryNavbar />
      </div>
      <div className="p-5 min-h-screen">
        <div className="chat-container">
          <div className="messages" style={{ maxHeight: "70vh", overflowY: "auto", marginBottom: "20px" }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender}`}
                style={{
                  margin: "10px",
                  padding: "10px",
                  borderRadius: "5px",
                  backgroundColor: msg.sender === "user" ? "#e0f7fa" : "#f5f5f5",
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "70%",
                }}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="message bot">Typing...</div>}
          </div>
          <div className="input-area" style={{ display: "flex", gap: "10px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about Flare or blockchain..."
              style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              style={{
                padding: "10px 20px",
                borderRadius: "5px",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
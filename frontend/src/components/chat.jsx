"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaUser, FaPaperPlane, FaGithub } from "react-icons/fa";
import Image from "next/image";

const UserMessage = ({ text }) => {
  return (
    <div className="flex flex-row gap-3 items-start justify-start mt-10">
      <div className="flex items-center justify-center rounded-full w-10 h-10 bg-theme-purple">
        <FaUser className="" />
      </div>
      <div className="p-3 bg-gray-100 rounded-lg">{text}</div>
    </div>
  );
};

const AssistantMessage = ({ text }) => {
  return (
    <div className="flex flex-row gap-3 items-start justify-start my-5">
      <div className="flex items-center justify-center rounded-full w-10 h-10 bg-blue-500">
        <FaGithub className="text-white" />
      </div>
      <div className="p-3 bg-blue-50 rounded-lg max-w-3xl">
        <ReactMarkdown
          className=""
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <pre className="bg-gray-800 text-white p-4 rounded-md my-2 overflow-auto">
                  <code className={className} {...props}>
                    {String(children).replace(/\n$/, "")}
                  </code>
                </pre>
              ) : (
                <code className="bg-gray-100 px-1 rounded" {...props}>
                  {children}
                </code>
              );
            },
            a({ node, children, href, ...props }) {
              return (
                <a href={href} className="text-blue-500 underline" {...props}>
                  {children}
                </a>
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
};

const Message = ({ role, text }) => {
  switch (role) {
    case "user":
      return <UserMessage text={text} />;
    case "assistant":
      return <AssistantMessage text={text} />;
    default:
      return null;
  }
};

const GitHubChat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [isInitialView, setIsInitialView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  
  // Automatically scroll to bottom of chat
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeRepo = async (url) => {
    setIsLoading(true);
    try {
      const response = await fetch("https://flare-api-1075798775939.us-central1.run.app/clone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: url
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setRepoUrl(url);
      setIsInitialView(false);
      setMessages([
        { role: "user", text: `Initialize repository: ${url}` },
        { role: "assistant", text: "Repository initialized successfully! You can now ask questions about the codebase." }
      ]);
    } catch (error) {
      console.error("Error initializing repository:", error);
      setMessages([
        { role: "user", text: `Initialize repository: ${url}` },
        { role: "assistant", text: `Error initializing repository: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
      setInputDisabled(false);
    }
  };

  const sendMessage = async (text) => {
    setInputDisabled(true);
    setIsLoading(true);
    
    try {
      const response = await fetch("https://flare-api-1075798775939.us-central1.run.app/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: text,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Parse the response and handle code blocks
      let formattedAnswer = data.answer;
      
      // Replace tool_code blocks with regular code blocks
      formattedAnswer = formattedAnswer.replace(/```tool_code\n([\s\S]*?)```/g, '```\n$1```');
      
      setMessages(prevMessages => [
        ...prevMessages,
        { role: "assistant", text: formattedAnswer }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prevMessages => [
        ...prevMessages,
        { role: "assistant", text: `Error: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
      setInputDisabled(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    if (isInitialView) {
      initializeRepo(userInput);
    } else {
      setMessages(prevMessages => [
        ...prevMessages,
        { role: "user", text: userInput }
      ]);
      sendMessage(userInput);
    }
    
    setUserInput("");
    setInputDisabled(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto p-4">
        {isInitialView ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">GitHub Repository Chat</h1>
              <p className="text-gray-600">Enter a GitHub repository URL to get started</p>
            </div>
            <form onSubmit={handleSubmit} className="w-full max-w-lg">
              <div className="flex items-center border-2 rounded-lg overflow-hidden">
                <input
                  type="text"
                  className="flex-grow p-4 focus:outline-none"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  disabled={inputDisabled}
                />
                <button
                  type="submit"
                  className="bg-theme-purple p-4 text-white"
                  disabled={inputDisabled}
                >
                  {isLoading ? "Loading..." : "Initialize"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {messages.map((msg, index) => (
              <Message key={index} role={msg.role} text={msg.text} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {!isInitialView && (
        <div className="p-4 border-t">
          <form
            onSubmit={handleSubmit}
            className="flex justify-between items-center p-2 bg-white shadow-md rounded-lg max-w-screen-xl mx-auto"
          >
            <input
              type="text"
              className="flex-grow p-2 focus:outline-none"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={inputDisabled ? "Finding answers..." : "Ask a question about the repository"}
              disabled={inputDisabled}
            />
            <button
              type="submit"
              className="rounded-full h-10 w-10 flex items-center justify-center bg-theme-purple-light hover:text-theme-purple-dark"
              disabled={inputDisabled}
            >
              <FaPaperPlane className="text-lg" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default GitHubChat;
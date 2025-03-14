"use client";
import {useContext} from "react";
import {GlobalContext} from "@/contexts/UserContext";
import Link from "next/link";
import AgentCard from '@/components/AgentCard';

function App() {
    const agentData = [
        {
            name: "Flare",
            logo: "/chain/flare-logo.png", // Ensure this image is available in the public directory
            description: "Flare is the blockchain network designed to bring real-world data to decentralized applications.",
            backgroundColor: "bg-theme-blue-light",  
            buttonColor: "bg-theme-blue-dark", 
            chatLink: "/agent/flare/chat",
            codeLink: "/agent/flare/code"
        },
    ];

    return (
        <main className="w-full px-10">
            <div className="w-full px-5 pt-36 flex flex-col justify-center items-center gap-8">
                <div className="text-4xl md:text-6xl mx-auto text-center">Think <span className="">Ideas</span>, Not
                    Code.
                </div>
                <button onClick={() => {
                    document.getElementById("agents")?.scrollIntoView({behavior: "smooth"});
                }} className="py-3 px-5 text-white bg-theme-dark text rounded-full mx-auto">
                    Get Started
                </button>
                <div className="w-[90%] border mt-2 border-theme-dark"></div>
                <div className="text-lg md:text-3xl font-light text-center">
                    Empowering Web2 developers to transition into Web3 with our AI-driven platform. <br/>Describe your
                    needs,
                    and our AI will handle the rest.
                </div>
            </div>

            <div className="bg-theme-off-white-light rounded-xl p-10 w-full mt-24">
                <div className="w-full text-center text-4xl mb-10" id="agents"><span>Choose an agent</span></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-7">
                    {agentData.map((agent, index) => (
                        <AgentCard key={index} agent={agent}/>
                    ))}
                </div>
            </div>

            {/* Google Cloud mention */}
            <div className="text-center mt-10 text-lg">
                <span>Sponsored by <a href="https://cloud.google.com" target="_blank" className="text-blue-500">Google Cloud</a></span>
            </div>
        </main>
    );
}

export default App;

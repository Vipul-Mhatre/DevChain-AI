import React from "react";
import { FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";

function Footer(props) {
  return (
    <div className="bg-transparent  flex flex-row py-3 mt-10  pl-24 pr-10 justify-between items-center">
      <div className="font-bold ">DDevChain AI © 2024</div>
      <div className="flex flex-row gap-5 items-center">
        <Link href="https://github.com/shantanuSakpal/based-india" className="">
          <FaGithub />
        </Link>
        <Link href="#" className="">
          <FaXTwitter />
        </Link>
      </div>
    </div>
  );
}

export default Footer;

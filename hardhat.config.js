import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const networks = process.env.SEPOLIA_RPC_URL
  ? {
      sepolia: {
        type: "http",
        chainType: "l1",
        url: process.env.SEPOLIA_RPC_URL,
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      },
    }
  : {};

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.24",
  },
  networks,
});

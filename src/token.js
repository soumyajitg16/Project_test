import React, { useState } from "react";
import { ethers } from "ethers";

const TokenTransfer = () => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // ERC-20 Token ABI (minimal for transfer functionality)
  const erc20Abi = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address owner) public view returns (uint256)",
    "function decimals() public view returns (uint8)",
  ];

  const handleTransfer = async () => {
    if (!window.ethereum) {
      setStatus("No Ethereum provider detected. Please install MetaMask.");
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      setStatus("Invalid recipient address.");
      return;
    }

    try {
      setLoading(true);
      setStatus("");

      // Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Connect to the token contract
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);

      // Fetch token decimals and balance
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(walletAddress);

      // Convert amount to the appropriate token units
      const tokenAmount = ethers.toBigInt(ethers.parseUnits(amount, decimals));

      // Check if the wallet has enough balance
      if (balance < tokenAmount) {
        setStatus("Insufficient token balance.");
        setLoading(false);
        return;
      }

      // Execute the transfer
      const tx = await tokenContract.transfer(recipientAddress, tokenAmount);
      setStatus("Transaction submitted. Waiting for confirmation...");

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setStatus("Transaction successful!");
      } else {
        setStatus("Transaction failed.");
      }
    } catch (error) {
      if (error.code === "INSUFFICIENT_FUNDS") {
        setStatus("Insufficient gas balance to cover transaction fees.");
      } else {
        setStatus(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>Transfer Tokens</h2>
      <div>
        <label>
          Token Contract Address:
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </label>
      </div>
      <div>
        <label>
          Recipient Address:
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </label>
      </div>
      <div>
        <label>
          Amount to Transfer:
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 10.5"
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </label>
      </div>
      <button
        onClick={handleTransfer}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        {loading ? "Transferring..." : "Transfer Tokens"}
      </button>
      {status && <p style={{ marginTop: "20px", color: "red" }}>{status}</p>}
    </div>
  );
};

export default TokenTransfer;
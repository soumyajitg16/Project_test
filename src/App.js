import React, {useState } from "react";
import Papa from "papaparse";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  //Task1

  //To keep the data of the provider, signer and contract .. For easy accessing
  const [state, setstate] = useState({
    provider: null,
    signer: null
  });  
  const [Account, setacount] = useState("Not Connected"); //For Account details

  //To connect Metamask wallet
  const handleClick = async () => {
    ////Metamask part
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // console.log(provider);
        const accounts = await provider.send("eth_requestAccounts", []);
        window.ethereum.on("accountsChanged", async ()=>{
            const accounts = await provider.send("eth_requestAccounts", []);
            const account = accounts[0];
            setacount(account);
            alert("Account is Changed");
        });
        const account = accounts[0];
        setacount(account);
        // console.log(provider);

        const signer = provider.getSigner();
        // console.log(signer);
        setstate({provider, signer});
        alert("Account is Connected")
        // console.log(state.provider);

    } catch (error) {
        console.log(error);
    }
  }

  //Task2
  const [validAddresses, setValidAddresses] = useState([]);
  const [invalidAddresses, setInvalidAddresses] = useState([]);

  // Validate Ethereum address
  const isValidEthereumAddress = (address) => {
    return ethers.isAddress(address);
  };

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) {
      toast.error("Please upload a file.");
      return;
    }

    // Parse the CSV file
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawAddresses = results.data.flat(); // Flatten in case of nested arrays
        processAddresses(rawAddresses);
      },
      error: (error) => {
        toast.error(`Error reading CSV file: ${error.message}`);
      },
    });
  };

  // Process and validate addresses
  const processAddresses = (rawAddresses) => {
    const uniqueAddresses = new Set();
    const valid = [];
    const invalid = [];

    rawAddresses.forEach((address) => {
      const trimmedAddress = address.trim();
      if (uniqueAddresses.has(trimmedAddress)) {
        invalid.push({ address: trimmedAddress, reason: "Duplicate" });
      } else if (!isValidEthereumAddress(trimmedAddress)) {
        invalid.push({ address: trimmedAddress, reason: "Invalid Ethereum address" });
      } else {
        uniqueAddresses.add(trimmedAddress);
        valid.push(trimmedAddress);
      }
    });

    setValidAddresses([...valid]);
    setInvalidAddresses([...invalid]);

    toast.success(`${valid.length} valid addresses processed.`);
    if (invalid.length > 0) {
      toast.warn(`${invalid.length} invalid or duplicate addresses found.`);
    }
  };

  //Task3
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
    <div>
      <div className="items-center text-center mt-10 flex flex-col">
            <button
                className="p-4 mt-4 text-sm bg-gray-500 text-white rounded-sm border-2 hover:bg-gray-400"
                onClick={handleClick}
            >
                Connect to Metamask
            </button> <br></br>
            <h1>The Wallet is: {Account} </h1>
        </div>
      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        <h2>CSV Address Uploader</h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ marginBottom: "20px" }}
        />
        <h3>Valid Addresses</h3>
        <textarea
          rows="10"
          cols="50"
          value={validAddresses.join("\n")}
          readOnly
          style={{ width: "100%", marginBottom: "20px" }}
        ></textarea>
        <h3>Invalid Addresses</h3>
        <textarea
          rows="10"
          cols="50"
          value={invalidAddresses
            .map((entry) => `${entry.address} (${entry.reason})`)
            .join("\n")}
          readOnly
          style={{ width: "100%", marginBottom: "20px", color: "red" }}
        ></textarea>
        <ToastContainer />
      </div>
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
    </div>
  );
}

export default App;

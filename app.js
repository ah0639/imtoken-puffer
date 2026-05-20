let provider;
let signer;
let userAddress = "";

// 合约地址（根据网络切换）
const CONTRACTS = {
  mainnet: "0xD9A442856C234a39a81a089C06451EBAa4306a72",
  sepolia: "0xD9A442856C234a39a81a089C06451EBAa4306a72"  // 如无测试网部署，暂时用相同地址（会失败）
};

const pufferABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) payable returns (uint256 shares)"
];

let currentChain = "sepolia";

async function switchNetwork(chain) {
  currentChain = chain;
  const targetChainId = chain === "sepolia" ? 11155111 : 1;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + targetChainId.toString(16) }],
    });
    document.getElementById('current-network').textContent = chain === "sepolia" ? "Sepolia 测试网" : "Ethereum 主网";
  } catch (error) {
    if (error.code === 4902) {
      alert("请手动在 imToken 中添加 Sepolia 测试网");
    } else {
      alert("切换网络失败: " + error.message);
    }
  }
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("❌ 请在 imToken 内置浏览器中打开！");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];

    signer = await provider.getSigner();

    document.getElementById('address').textContent = userAddress.slice(0,6) + "..." + userAddress.slice(-4);
    document.getElementById('wallet-info').classList.remove('hidden');
    
    await updateAllBalances();
    alert('✅ 连接成功！');
  } catch (error) {
    alert('连接失败: ' + error.message);
  }
}

async function updateAllBalances() {
  if (!provider || !userAddress) return;
  
  const ethBalance = await provider.getBalance(userAddress);
  document.getElementById('eth-balance').textContent = ethers.formatEther(ethBalance).slice(0,6);

  const vaultAddress = CONTRACTS[currentChain];
  const vaultContract = new ethers.Contract(vaultAddress, pufferABI, provider);
  
  try {
    const pufBalance = await vaultContract.balanceOf(userAddress);
    document.getElementById('pufeth-balance').textContent = ethers.formatEther(pufBalance).slice(0,6);
  } catch(e) { 
    document.getElementById('pufeth-balance').textContent = "暂无"; 
  }

  try {
    const rate = await vaultContract.convertToAssets(ethers.parseEther("1"));
    document.getElementById('rate').textContent = parseFloat(ethers.formatEther(rate)).toFixed(4);
  } catch(e) {
    document.getElementById('rate').textContent = "1.00+";
  }
}

// 事件绑定
document.getElementById('network-select').addEventListener('change', (e) => {
  switchNetwork(e.target.value);
});

document.getElementById('connect-btn').addEventListener('click', connectWallet);

document.getElementById('stake-btn').addEventListener('click', async () => {
  alert('当前为演示模式\n\n实际交易需在 Sepolia 测试网上测试');
});

console.log("Puffer Mini App 已加载 - 支持 Sepolia 测试网");

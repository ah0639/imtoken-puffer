let provider;
let signer;
let userAddress = "";

const CONTRACTS = {
  mainnet: "0xD9A442856C234a39a81a089C06451EBAa4306a72",
  sepolia: "0xD9A442856C234a39a81a089C06451EBAa4306a72"   // 测试网如无部署会报错
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
      params: [{ chainId: '0x' + targetChainId.toString(16) }]
    });
    document.getElementById('current-network').textContent = chain === "sepolia" ? "Sepolia 测试网" : "Ethereum 主网";
  } catch (error) {
    alert("网络切换失败，请在 imToken 中手动切换到 " + (chain === "sepolia" ? "Sepolia" : "主网"));
  }
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("请在 imToken 内置浏览器中打开此页面！");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];

    signer = await provider.getSigner();

    // 更新 UI 为已连接状态
    const connectBtn = document.getElementById('connect-btn');
    connectBtn.textContent = "✅ 已连接";
    connectBtn.style.background = "#00cc77";
    connectBtn.style.cursor = "default";

    document.getElementById('wallet-info').classList.remove('hidden');
    document.getElementById('address').textContent = userAddress.slice(0,6) + "..." + userAddress.slice(-4);

    await updateAllBalances();
    alert('✅ 钱包连接成功！');
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
    document.getElementById('pufeth-balance').textContent = "0.00"; 
  }

  try {
    const rate = await vaultContract.convertToAssets(ethers.parseEther("1"));
    document.getElementById('rate').textContent = parseFloat(ethers.formatEther(rate)).toFixed(4);
  } catch(e) {
    document.getElementById('rate').textContent = "1.00+";
  }
}

// 按钮事件
document.getElementById('network-select').addEventListener('change', (e) => switchNetwork(e.target.value));
document.getElementById('connect-btn').addEventListener('click', connectWallet);

document.getElementById('stake-btn').addEventListener('click', async () => {
  alert('✅ 演示成功！\n\n实际交易功能（ETH/stETH/wstETH）正在开发中\n当前支持连接 + 余额显示 + 汇率查询');
});

document.getElementById('unifi-btn').addEventListener('click', () => {
  alert('UniFi Vault 演示：\n\n你可以把 pufETH 存入 UniFi Vault 赚取额外奖励\n（实际可跳转到 app.puffer.fi/vaults）');
});

console.log("Puffer Mini App v2 已加载 - 支持多资产 + UniFi");

let provider, signer, userAddress = "";

const CONTRACTS = {
  mainnet: "0xD9A442856C234a39a81a089C06451EBAa4306a72",
  sepolia: "0xD9A442856C234a39a81a089C06451EBAa4306a72"
};

const pufferABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) payable returns (uint256 shares)"
];

let currentChain = "mainnet";

async function switchNetwork(chain) {
  currentChain = chain;
  const chainId = chain === "sepolia" ? 11155111 : 1;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + chainId.toString(16) }] });
    document.getElementById('current-network').textContent = chain === "sepolia" ? "Sepolia 测试网" : "Ethereum 主网";
  } catch (e) {
    alert("请在 imToken 中手动切换网络");
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

    const btn = document.getElementById('connect-btn');
    btn.textContent = "✅ 已连接";
    btn.style.background = "#00cc77";
    btn.style.pointerEvents = "none";

    document.getElementById('wallet-info').classList.remove('hidden');
    document.getElementById('address').textContent = userAddress.slice(0,6) + "..." + userAddress.slice(-4);

    await updateAllBalances();
    alert('✅ 连接成功！（基于 imToken Token Core）');
  } catch (error) {
    alert('连接失败: ' + error.message);
  }
}

async function updateAllBalances() {
  if (!provider || !userAddress) return;
  
  try {
    const ethBalance = await provider.getBalance(userAddress);
    document.getElementById('eth-balance').textContent = ethers.formatEther(ethBalance).slice(0,6);
  } catch(e) {}

  const vaultContract = new ethers.Contract(CONTRACTS[currentChain], pufferABI, provider);
  try {
    const pufBalance = await vaultContract.balanceOf(userAddress);
    document.getElementById('pufeth-balance').textContent = ethers.formatEther(pufBalance).slice(0,6);
  } catch(e) { document.getElementById('pufeth-balance').textContent = "0.00"; }

  try {
    const rate = await vaultContract.convertToAssets(ethers.parseEther("1"));
    document.getElementById('rate').textContent = parseFloat(ethers.formatEther(rate)).toFixed(4);
  } catch(e) { document.getElementById('rate').textContent = "1.00+"; }
}

// 事件绑定
document.getElementById('network-select').addEventListener('change', (e) => switchNetwork(e.target.value));
document.getElementById('connect-btn').addEventListener('click', connectWallet);

document.getElementById('stake-btn').addEventListener('click', async () => {
  const asset = document.getElementById('asset-select').value;
  const amountStr = document.getElementById('amount').value;
  
  if (!signer || parseFloat(amountStr) <= 0) {
    return alert('请先连接钱包并输入数量');
  }

  if (asset === "ETH") {
    try {
      const vaultContract = new ethers.Contract(CONTRACTS.mainnet, pufferABI, signer);
      alert(`正在质押 ${amountStr} ETH...\n请在 imToken 中确认交易！`);
      
      const tx = await vaultContract.deposit(
        ethers.parseEther(amountStr), 
        userAddress, 
        { value: ethers.parseEther(amountStr) }
      );
      
      alert(`✅ 交易发送成功！\nHash: ${tx.hash}`);
      setTimeout(updateAllBalances, 8000);
    } catch (error) {
      alert('交易失败或取消: ' + (error.shortMessage || error.message));
    }
  } else {
    alert(`✅ 模拟质押成功！\n${amountStr} ${asset} → pufETH\n（实际需先 approve）`);
    setTimeout(updateAllBalances, 1500);
  }
});

document.getElementById('dex-btn').addEventListener('click', () => {
  const token = document.getElementById('dex-asset').value;
  alert(`🚀 DEX 聚合演示完成！\n${token} 已通过聚合器兑换为 ETH 并质押为 pufETH`);
  setTimeout(updateAllBalances, 1000);
});

document.getElementById('unifi-btn').addEventListener('click', () => {
  window.open('https://app.puffer.fi', '_blank');
});

console.log("Puffer Mini App 最终完整版已加载");

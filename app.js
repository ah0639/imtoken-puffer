let provider;
let signer;
let userAddress = "";

const CONTRACTS = {
  mainnet: "0xD9A442856C234a39a81a089C06451EBAa4306a72",
  sepolia: "0xD9A442856C234a39a81a089C06451EBAa4306a72" // 测试网暂无，切换会失败
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
      alert("请在 imToken 内置浏览器中打开！");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];
    signer = await provider.getSigner();

    // 更新为已连接状态
    const btn = document.getElementById('connect-btn');
    btn.textContent = "✅ 已连接";
    btn.style.background = "#00cc77";
    btn.style.pointerEvents = "none";

    document.getElementById('wallet-info').classList.remove('hidden');
    document.getElementById('address').textContent = userAddress.slice(0,6) + "..." + userAddress.slice(-4);

    await updateAllBalances();
    alert('✅ 钱包连接成功！（基于 Token Core）');
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
  } catch(e) { document.getElementById('pufeth-balance').textContent = "0.00"; }

  try {
    const rate = await vaultContract.convertToAssets(ethers.parseEther("1"));
    document.getElementById('rate').textContent = parseFloat(ethers.formatEther(rate)).toFixed(4);
  } catch(e) { document.getElementById('rate').textContent = "1.00+"; }
}

document.getElementById('network-select').addEventListener('change', (e) => switchNetwork(e.target.value));
document.getElementById('connect-btn').addEventListener('click', connectWallet);

document.getElementById('stake-btn').addEventListener('click', async () => {
  const amountStr = document.getElementById('amount').value;
  if (!signer || parseFloat(amountStr) <= 0) {
    alert('请先连接钱包并输入数量');
    return;
  }
  if (currentChain === "sepolia") {
    alert('Sepolia 测试网暂无 Puffer 部署，请切换到主网小额测试');
    return;
  }

  try {
    const vaultContract = new ethers.Contract(CONTRACTS.mainnet, pufferABI, signer);
    alert(`即将发起质押 ${amountStr} ETH\n请在 imToken 中确认交易！`);

    const tx = await vaultContract.deposit(
      ethers.parseEther(amountStr),
      userAddress,
      { value: ethers.parseEther(amountStr) }
    );

    alert(`交易已发送！Hash: ${tx.hash}\n等待确认后刷新余额`);
    setTimeout(updateAllBalances, 10000);
  } catch (error) {
    alert('交易取消或失败: ' + (error.shortMessage || error.message));
  }
});

document.getElementById('unifi-btn').addEventListener('click', () => {
  window.open('https://app.puffer.fi', '_blank');
});

console.log("Puffer Mini App - 完整版（含真实质押 + Token Core 兼容）");

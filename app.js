let provider;
let signer;
let userAddress = "";

// Puffer 合约地址（主网）
const PUFFER_VAULT = "0xD9A442856C234a39a81a089C06451EBAa4306a72";

const pufferABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) payable returns (uint256 shares)"
];

async function connectWallet() {
  console.log("连接按钮被点击了"); // 用于调试
  
  try {
    if (!window.ethereum) {
      alert("❌ 未检测到钱包\n\n请在 imToken 内置浏览器中打开此页面！");
      return;
    }

    alert("正在请求连接钱包...\n请在 imToken 中授权");

    provider = new ethers.BrowserProvider(window.ethereum);
    
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];

    signer = await provider.getSigner();

    document.getElementById('address').textContent = userAddress.slice(0,6) + "..." + userAddress.slice(-4);
    document.getElementById('wallet-info').classList.remove('hidden');

    await updateAllBalances();
    alert('✅ 连接成功！');
  } catch (error) {
    console.error(error);
    alert('连接失败: ' + error.message + '\n\n请确保在 imToken 浏览器中打开');
  }
}

async function updateAllBalances() {
  if (!provider || !userAddress) return;
  
  const ethBalance = await provider.getBalance(userAddress);
  document.getElementById('eth-balance').textContent = ethers.formatEther(ethBalance).slice(0,6);

  const vaultContract = new ethers.Contract(PUFFER_VAULT, pufferABI, provider);
  
  try {
    const pufBalance = await vaultContract.balanceOf(userAddress);
    document.getElementById('pufeth-balance').textContent = ethers.formatEther(pufBalance).slice(0,6);
  } catch(e) {}

  try {
    const rate = await vaultContract.convertToAssets(ethers.parseEther("1"));
    document.getElementById('rate').textContent = parseFloat(ethers.formatEther(rate)).toFixed(4);
  } catch(e) {}
}

// 绑定按钮
document.getElementById('connect-btn').addEventListener('click', connectWallet);

document.getElementById('stake-btn').addEventListener('click', async () => {
  const amountStr = document.getElementById('amount').value;
  if (!signer || parseFloat(amountStr) <= 0) {
    alert('请先连接钱包并输入数量');
    return;
  }
  alert('交易功能待完善（当前仅演示连接）');
});

console.log("页面脚本已加载");

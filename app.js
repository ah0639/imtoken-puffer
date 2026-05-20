let provider;
let signer;
let userAddress = "";

// Puffer 主网合约地址
const PUFFER_VAULT = "0xD9A442856C234a39a81a089C06451EBAa4306a72"; // pufETH Vault (ERC20 + Vault)

// 简化的 ABI（包含常用函数）
const pufferABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256 shares)",
  "function deposit(uint256 assets, address receiver) payable returns (uint256 shares)",
  "function getRate() view returns (uint256)",   // 部分版本有
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)"
];

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("请在 imToken 浏览器中打开此页面");
      return;
    }
    
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    
    document.getElementById('address').textContent = userAddress.slice(0,6) + "..." + userAddress.slice(-4);
    document.getElementById('wallet-info').classList.remove('hidden');
    
    await updateAllBalances();
    alert('✅ 钱包连接成功！imToken / MetaMask');
  } catch (error) {
    alert('连接失败: ' + error.message);
  }
}

async function updateAllBalances() {
  if (!provider || !userAddress) return;
  
  // ETH 余额
  const ethBalance = await provider.getBalance(userAddress);
  document.getElementById('eth-balance').textContent = ethers.formatEther(ethBalance).slice(0,6);

  // pufETH 余额
  const vaultContract = new ethers.Contract(PUFFER_VAULT, pufferABI, provider);
  try {
    const pufBalance = await vaultContract.balanceOf(userAddress);
    document.getElementById('pufeth-balance').textContent = ethers.formatEther(pufBalance).slice(0,6);
  } catch(e) {
    console.log("pufETH balance query failed", e);
  }

  // 当前汇率（1 pufETH ≈ ? ETH）
  try {
    const rate = await vaultContract.convertToAssets(ethers.parseEther("1.0"));
    const rateFormatted = parseFloat(ethers.formatEther(rate)).toFixed(4);
    document.getElementById('rate').textContent = rateFormatted;
  } catch(e) {
    // fallback
    document.getElementById('rate').textContent = "1.00+";
  }
}

document.getElementById('connect-btn').addEventListener('click', connectWallet);

document.getElementById('stake-btn').addEventListener('click', async () => {
  const amountStr = document.getElementById('amount').value;
  const amount = parseFloat(amountStr);
  
  if (!signer || amount <= 0) {
    alert('请先连接钱包并输入数量');
    return;
  }
  
  try {
    const vaultContract = new ethers.Contract(PUFFER_VAULT, pufferABI, signer);
    
    alert(`正在发起质押交易...\n金额: ${amount} ETH\n\n请在 imToken 中确认！`);
    
    const tx = await vaultContract.deposit(ethers.parseEther(amountStr), userAddress, {
      value: ethers.parseEther(amountStr
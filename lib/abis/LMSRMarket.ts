export const LMSR_MARKET_ABI = [
  {
    "type": "function",
    "name": "buy",
    "inputs": [
      { "name": "outcomeIndex", "type": "uint256", "internalType": "uint256" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "maxCost", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "cost", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "sell",
    "inputs": [
      { "name": "outcomeIndex", "type": "uint256", "internalType": "uint256" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "minPayout", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "payout", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addLiquidity",
    "inputs": [{ "name": "amount", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "shares", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeLiquidity",
    "inputs": [{ "name": "shares", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "amount", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimWinnings",
    "inputs": [],
    "outputs": [{ "name": "payout", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getCost",
    "inputs": [
      { "name": "outcomeIndex", "type": "uint256", "internalType": "uint256" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPrice",
    "inputs": [{ "name": "outcomeIndex", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "question",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tradingEndsAt",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint64", "internalType": "uint64" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "resolved",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "winningOutcome",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Trade",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "outcomeIndex", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "isBuy", "type": "bool", "indexed": false, "internalType": "bool" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "cost", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "newPrice", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LiquidityAdded",
    "inputs": [
      { "name": "provider", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "shares", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MarketResolved",
    "inputs": [
      { "name": "winningOutcome", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "resolvedAt", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const

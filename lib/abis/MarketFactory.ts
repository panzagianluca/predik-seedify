export const MARKET_FACTORY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "collateral_", "type": "address", "internalType": "address" },
      { "name": "outcome1155_", "type": "address", "internalType": "address" },
      { "name": "treasury_", "type": "address", "internalType": "address" },
      { "name": "oracle_", "type": "address", "internalType": "address" },
      { "name": "router_", "type": "address", "internalType": "address" },
      { "name": "defaultLiquidityParameter_", "type": "uint256", "internalType": "uint256" },
      { "name": "defaultProtocolFeeBps_", "type": "uint16", "internalType": "uint16" },
      { "name": "defaultCreatorFeeBps_", "type": "uint16", "internalType": "uint16" },
      { "name": "defaultOracleFeeBps_", "type": "uint16", "internalType": "uint16" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createMarket",
    "inputs": [
      { "name": "question", "type": "string", "internalType": "string" },
      { "name": "outcomes", "type": "string[]", "internalType": "string[]" },
      { "name": "tradingEndsAt", "type": "uint64", "internalType": "uint64" },
      { "name": "initialLiquidity", "type": "uint256", "internalType": "uint256" },
      { "name": "protocolFeeBps", "type": "uint16", "internalType": "uint16" },
      { "name": "creatorFeeBps", "type": "uint16", "internalType": "uint16" },
      { "name": "oracleFeeBps", "type": "uint16", "internalType": "uint16" },
      { "name": "liquidityParameter", "type": "uint256", "internalType": "uint256" },
      { "name": "delphAIMarketId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "marketId", "type": "uint256", "internalType": "uint256" },
      { "name": "marketAddress", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getMarket",
    "inputs": [{ "name": "marketId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMarketCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllMarkets",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMarkets",
    "inputs": [
      { "name": "offset", "type": "uint256", "internalType": "uint256" },
      { "name": "limit", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "MarketCreated",
    "inputs": [
      { "name": "marketId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "marketAddress", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "creator", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "question", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "outcomes", "type": "string[]", "indexed": false, "internalType": "string[]" },
      { "name": "tradingEndsAt", "type": "uint64", "indexed": false, "internalType": "uint64" },
      { "name": "delphAIMarketId", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const

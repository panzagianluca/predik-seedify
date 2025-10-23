// PredictionMarket V3.4 ABI - Events only
// Full ABI available in node_modules/polkamarkets-js/abis/PredictionMarketV3_4.json

export const PREDICTION_MARKET_ABI = [
  {
    type: 'event',
    name: 'MarketActionTx',
    inputs: [
      {
        name: 'user',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'action',
        type: 'uint8',
        indexed: true,
        internalType: 'enum PredictionMarketV3_4.MarketAction',
      },
      {
        name: 'marketId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'outcomeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'shares',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'value',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'timestamp',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MarketResolved',
    inputs: [
      {
        name: 'user',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'marketId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'outcomeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'timestamp',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'admin',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
] as const

// MarketAction enum values
export enum MarketAction {
  BUY = 0,
  SELL = 1,
  ADD_LIQUIDITY = 2,
  REMOVE_LIQUIDITY = 3,
  CLAIM_WINNINGS = 4,
  CLAIM_LIQUIDITY = 5,
  CLAIM_FEES = 6,
  CLAIM_VOIDED = 7,
}

export const MARKET_ACTION_LABELS: Record<MarketAction, string> = {
  [MarketAction.BUY]: 'Buy',
  [MarketAction.SELL]: 'Sell',
  [MarketAction.ADD_LIQUIDITY]: 'Add Liquidity',
  [MarketAction.REMOVE_LIQUIDITY]: 'Remove Liquidity',
  [MarketAction.CLAIM_WINNINGS]: 'Claim Winnings',
  [MarketAction.CLAIM_LIQUIDITY]: 'Claim Liquidity',
  [MarketAction.CLAIM_FEES]: 'Claim Fees',
  [MarketAction.CLAIM_VOIDED]: 'Claim Voided',
}

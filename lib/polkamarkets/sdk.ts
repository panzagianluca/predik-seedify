// Polkamarkets SDK wrapper
import * as polkamarketsjs from 'polkamarkets-js'

const PM_CONTRACT = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || ''
const PM_QUERIER = process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER || ''

export function createPolkamarketsInstance(provider: any) {
  return new polkamarketsjs.Application({
    web3Provider: provider,
  })
}

export function getPredictionMarketContract(polkamarkets: any) {
  return polkamarkets.getPredictionMarketV3PlusContract({
    contractAddress: PM_CONTRACT,
    querierContractAddress: PM_QUERIER,
  })
}

export function getERC20Contract(polkamarkets: any, tokenAddress: string) {
  return polkamarkets.getERC20Contract({
    contractAddress: tokenAddress,
  })
}

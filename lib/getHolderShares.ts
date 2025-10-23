import Web3 from 'web3'

const PM_ABI = [
  {
    type: 'function',
    name: 'getUserMarketShares',
    inputs: [
      { name: 'marketId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'liquidity', type: 'uint256', internalType: 'uint256' },
      { name: 'outcomes', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  }
] as const

export async function getHolderShares(
  marketId: number,
  holderAddress: string
): Promise<{ liquidityShares: bigint; outcomeShares: bigint[] }> {
  const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
  
  const contract = new web3.eth.Contract(
    PM_ABI as any,
    process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS!
  )

  try {
    const result = await contract.methods
      .getUserMarketShares(marketId, holderAddress)
      .call()

    // result is { liquidity, outcomes }
    return {
      liquidityShares: BigInt(result.liquidity as string),
      outcomeShares: (result.outcomes as string[]).map(s => BigInt(s))
    }
  } catch (err) {
    console.error(`Error fetching shares for ${holderAddress}:`, err)
    throw err
  }
}

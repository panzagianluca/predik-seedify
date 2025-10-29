declare module 'polkamarkets-js' {
  export class Application {
    constructor(config: {
      web3Provider?: any
      web3EventsProvider?: any
      web3PrivateKey?: string
    })
    
    login(): Promise<void>
    getAddress(): Promise<string>
    getPredictionMarketV3PlusContract(config: {
      contractAddress: string
      querierContractAddress?: string
    }): any
    getERC20Contract(config: { contractAddress: string }): any
  }
}

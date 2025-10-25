[Skip to content](https://help.myriad.markets/Polkamarkets-SDK-1b5c9e49da8280bbaa95f0fd7bfccec4#main)

![🔨 Page icon](<Base64-Image-Removed>)![🔨 Page icon](https://notion-emojis.s3-us-west-2.amazonaws.com/prod/svg-twitter/1f528.svg)

# Polkamarkets SDK

Myriad leverages [Polkamarkets](https://www.polkamarkets.com/) infrastructure for placing predictions.

polkamarkets-js

is a library providing JavaScript bindings to interact with Polkamarkets smart contracts. It supports functionalities like wallet connection, ERC-20 approval,buying/selling shares,claiming winnings, and more.

Below is an introductory guide to installing and initializing the polkamarkets-js library, showing a typical configuration for social login and network details. You can adapt these fields and environment variables to match your own application setup.

### Installation

Install the package via npm or yarn:

Shell

Copy

\# npmnpminstall polkamarkets-js

\# yarnyarnadd polkamarkets-js

​

### Importing the Library

In your code, import all exported modules or the parts you need:

JavaScript

Copy

import\*as polkamarketsjs from'polkamarkets-js';

​

### Initializing Polkamarkets

Below is an example snippet that creates a new Polkamarkets application instance with social login and various network configurations:

JavaScript

Copy

const polkamarkets =newpolkamarketsjs.Application({
web3Provider,
web3EventsProvider,
web3PrivateKey
});

​

Once created,

polkamarkets

can be used throughout your app to interact with Polkamarkets smart contracts, handle user logins, track events, and more.

### Configuration Fields

The table below describes each field you see in the initialization object above. Many values are derived from environment variables in this example, but you can hardcode them if you prefer.

|     |     |     |
| --- | --- | --- |
| Field | Type | Description |
| web3Provider | string | Primary Web3 provider endpoint or an instantiated provider object for RPC calls (e.g. MetaMask, Alchemy, Infura). |
| web3PrivateKey | string | (Optional) private key of wallet to use, if you want to bypass wallet/social login authentication |
| web3EventsProvider | string | (Optional) polkamarkets-rpc web3 endpoint specifically for event subscriptions. |

### Logging in Polkamarkets-js

After initializing your Polkamarkets instance, you can call other methods (e.g., connecting to the user’s wallet, creating markets, buying/selling outcome shares, adding liquidity, claiming rewards, etc.). These topics can be documented in subsequent sections.

#### 1\. Connecting Wallet

Before you can check allowances or send transactions, you need to login into the application using the

login

method. This will trigger a wallet popup to authorize the application. If

web3PrivateKey

is sent when initializing polkamarkets this step is not necessary.

JavaScript

Copy

await service.login();// triggers polkamarkets to connect user wallet

​

#### 2\. Getting the User Address

JavaScript

Copy

const userAddress =await polkamarkets.getAddress();
console.log(\`User is logged in as: ${address}\`);

​

### Prediction Market Contract

Before calling these methods, you'll typically create a

pm

instance from your polkamarkets application object:

JavaScript

Copy

import\*as polkamarketsjs from'polkamarkets-js';// Example snippet:// 1) You've already instantiated \`polkamarkets\` (see the prior docs).// 2) Now get the prediction market V3 contract:const pm = polkamarkets.getPredictionMarketV3PlusContract({contractAddress:'0x1234...',// actual PM contractquerierContractAddress:'0xabcd...'// optional, if you have a read-only/querier contract});

​

Below you can find the relevant contract addresses for each chain:

#### Abstract

|  | Mainnet | Testnet |
| --- | --- | --- |
| PredictionMarket | [0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289](https://abscan.org/address/0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289) | [0x6c44Abf72085E5e71EeB7C951E3079073B1E7312](https://sepolia.abscan.org/address/0x6c44Abf72085E5e71EeB7C951E3079073B1E7312) |
| PredictionMarketQuerier | [0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff](https://abscan.org/address/0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff) | [0xa30c60107f9011dd49fc9e04ebe15963064eecc1](https://sepolia.abscan.org/address/0xa30c60107f9011dd49fc9e04ebe15963064eecc1) |

#### Linea

Deployed Contracts

|  | Mainnet | Testnet |
| --- | --- | --- |
| PredictionMarket | [0x39e66ee6b2ddaf4defded3038e0162180dbef340](https://lineascan.build/address/0x39e66ee6b2ddaf4defded3038e0162180dbef340) | [0xED5CCb260f80A7EB1E5779B02115b4dc25aA3cDE](https://sepolia.lineascan.build/address/0xED5CCb260f80A7EB1E5779B02115b4dc25aA3cDE) |
| PredictionMarketQuerier | [0x503c9f98398dc3433ABa819BF3eC0b97e02B8D04](https://lineascan.build/address/0x503c9f98398dc3433ABa819BF3eC0b97e02B8D04) | [0x90916C3C1a070ED31f6CdFCD42807a38B563392F](https://sepolia.lineascan.build/address/0x90916C3C1a070ED31f6CdFCD42807a38B563392F) |

All subsequent calls in this guide assume you have a valid

pm

reference.

### 1\. Buying and Selling

#### 1.1 Buying

JavaScript

Copy

// the following method is used to calculate how many shares the user wants to purchaseconst minOutcomeSharesToBuy =await pm.calcBuyAmount({
marketId,
outcomeId,
value
});await pm.buy({
marketId,// e.g. "123"
outcomeId,// e.g. 1 (Yes)
value,// e.g. 100
minOutcomeSharesToBuy // slippage protection
wrapped // true/false (if using ETH or an ERC20 token)});// alternatively, if we have a referral code, we can call referralBuyawait pm.referralBuy({
marketId,// e.g. "123"
outcomeId,// e.g. 1 (Yes)
value,// e.g. 100
minOutcomeSharesToBuy // slippage protection
code // referral code});

​

#### 1.2 Selling

JavaScript

Copy

// the following method is used to calculate how many shares the user wants to sellconst maxOutcomeSharesToSell =await pm.calcSellAmount({
marketId,
outcomeId,
value
});await pm.sell({
marketId,
outcomeId,
value,// e.g. 50 tokens
maxOutcomeSharesToSell,// slippage
wrapped
});// alternatively, if we have a referral code, we can call referralSellawait pm.referralSell({
marketId,
outcomeId,
value,// e.g. 50 tokens
maxOutcomeSharesToSell,// slippage
code
});

​

### 2\. Claim Winnings

#### 2.1 Claim Winnings

Once the market is resolved, users can claim their winnings using the following snippet.

JavaScript

Copy

await pm.claimWinnings({
marketId,// e.g. "123"
wrapped // true/false (if using ETH or an ERC20 token)});

​

#### 2.2 Claim Voided Shares

If the market is canceled (voided), users can claim their tokens back at closing prices. The following snippet can be used.

JavaScript

Copy

await pm.claimVoidedOutcomeShares({
marketId,
outcomeId,
wrapped
});

​

### 3\. Portfolio

#### 3.1 Fetch portfolio

The following method fetches the user’s holdings and claim status for each outcome.

JavaScript

Copy

const portfolio =await pm.getPortfolio({
user
});

console.log(portfolio);// Example response:// {// ..,// 20: {// liquidity: {// shares: 1000,// price: 0.89035,// },// outcomes: {// 0: {// shares: 1591.87,// price: 0.6281,// voidedWinningsToClaim: false,// voidedWinningsClaimed: false,// },// 1: {// shares: 0,// price: 0,// voidedWinningsToClaim: false,// voidedWinningsClaimed: false,// }// }// claimStatus: {// winningsToClaim: false,// winningsClaimed: false,// liquidityToClaim: false,// liquidityClaimed: false,// voidedWinningsToClaim: false,// voidedWinningsClaimed: false,// }// },// ...// }

​

### 4\. Market Prices

#### 4.1 Fetch market prices

The following method fetches the user’s holdings and claim status for each outcome. Prices range from 0 to 1.

JavaScript

Copy

const prices =await pm.getMarketPrices({
marketId
});

console.log(prices);// Example response:// {// "liquidity": 0.6181712323806557,// "outcomes": {// "0": 0.8930217320508439,// "1": 0.10697826794915608// }// }

​

### 5\. Prediction Market Querier

A

predictionMarketQuerier

contract can be used in order to avoid making N RPC calls (where N is the number of desired markets) to fetch info such as:

Market ERC20 decimals

User market positions

Market outcome prices

The querier contract receives an array of market IDs and aggregates all the info into one return. You can use it by adding

querierContractAddress

as an argument of the initialization of the PredictionMarketV3 instance (see code [above](https://help.myriad.markets/1b5c9e49da8280bbaa95f0fd7bfccec4?pvs=25#1b5c9e49da8280b48dd6e421c9d1d35f)).

### ERC20 Contract

Create an ERC20 contract instance using

polkamarkets.getERC20Contract(...)

. This snippet assumes you’ve already instantiated your

polkamarkets

application:

JavaScript

Copy

const erc20 = polkamarkets.getERC20Contract({contractAddress:'0xYOUR\_ERC20\_TOKEN\_ADDRESS'});

​

ERC20 Contract addresses:

Staging (reach out to Myriad support if you need any of the staging tokens minted to your account):

USDC

\- [0x8820c84FD53663C2e2EA26e7a4c2b79dCc479765](https://sepolia.abscan.org/address/0x8820c84FD53663C2e2EA26e7a4c2b79dCc479765)

PENGU

\- [0x6ccDDCf494182a3A237ac3f33A303a57961FaF55](https://sepolia.abscan.org/address/0x6ccddcf494182a3a237ac3f33a303a57961faf55)

PTS

\- [0x6cC39C1149aed1fdbf6b11Fd60C18b96446cBc96](https://sepolia.abscan.org/address/0x6cC39C1149aed1fdbf6b11Fd60C18b96446cBc96)

Production:

USDC.e

\- [0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1](https://abscan.org/address/0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1)

PENGU

\- [0x9eBe3A824Ca958e4b3Da772D2065518F009CBa62](https://abscan.org/address/0x9eBe3A824Ca958e4b3Da772D2065518F009CBa62)

PTS

\- [0x0b07cf011b6e2b7e0803b892d97f751659940f23](https://abscan.org/address/0x0b07cf011b6e2b7e0803b892d97f751659940f23)

All subsequent calls in this guide assume you have a valid

erc20

reference.

#### 1\. Check Approval Status

Checks if the user has approved at least

amount

of tokens for

spender

:

JavaScript

Copy

await erc20.isApproved({address: polkamarkets.getAddress(),
amount,
spenderAddress
});

​

#### 2\. Approve

Grants the

spender

contract permission to move up to

amount

tokens on behalf of the user:

JavaScript

Copy

await erc20.approve({
address,
amount
});

​

Below there’s an example of a complete flow using abstract mainnet. We’ll:

Initialize Polkamarkets with a web3Provider and web3PrivateKey.

Instantiate a Prediction Market V3 contract (

pm

) and an ERC20 contract (

erc20

).

Check approval, approve if needed, create a market, buy outcome shares, and finally claim winnings.

JavaScript

Copy

import\*as polkamarketsjs from'polkamarkets-js';// 1) Initialize polkamarketsconst polkamarkets =newpolkamarketsjs.Application({web3Provider:'api.mainnet.abs.xyz',web3PrivateKey:'',// add your pk here});// 2) Get the Prediction Market V3 contractconst pm = polkamarkets.getPredictionMarketV3PlusContract({contractAddress:'0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289',// pmContractAddressquerierContractAddress:'0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff'// pmQuerierAddress (optional)});// 3) Get the ERC20 contractconst erc20 = polkamarkets.getERC20Contract({contractAddress:'0x84a71ccd554cc1b02749b35d22f684cc8ec987e1'// erc20Address});// 4) (Optional) Log in (not strictly required if using private key, but included for completeness)await polkamarkets.login();// 5) Grab current user addressconst userAddress =await polkamarkets.getAddress();
console.log('User address:', userAddress);// 6) Check allowance for the pm contractconst neededAmount ='100000000';const spender ='0x4f4988A910f8aE9B3214149A8eA1F2E4e3Cd93CC';const approved =await erc20.isApproved({address: userAddress,spenderAddress: spender,amount: neededAmount
});if(!approved){
console.log('Not enough allowance; approving now...');await erc20.approve({address: userAddress,amount: neededAmount,spenderAddress: spender
});
console.log('Approval successful!');}else{
console.log('Sufficient allowance already exists.');}// 7) Buy some outcome shares of a marketIdconst marketId =123;// the market id you want to purchase sharesconst outcomeId =0;// the market id you want to purchase sharesconst value =10;// the amount (in human format, it is converted to the correct decimals in the function)const minOutcomeSharesToBuy =await pm.calcBuyAmount({
marketId,
outcomeId,
value
});await pm.buy({
marketId,
outcomeId,
value,
minOutcomeSharesToBuy
});console.log('Bought outcome shares!');const portfolio =await pm.getPortfolio({user:userAddress });console.log(portfolio);// 9) (Later) Claim winnings (assumes market eventually resolves in your favor)// ...// await pm.claimWinnings(marketId);// console.log('Winnings claimed!');

​

#### Flow

Initialization: We pass a

web3Provider

(

api.mainnet.abs.xyz

) and a random

web3PrivateKey

for direct signing, plus

isSocialLogin: false

to skip the wallet UI.

Contracts:

pm

is our Prediction Market V3 instance.

erc20

is the token contract used for buying shares or adding liquidity.

Login: If you prefer a standard wallet approach (Metamask, etc.), remove

web3PrivateKey

and set

isSocialLogin: true

; calling

await polkamarkets.login()

triggers the wallet flow.

Approval: We check if the user has at least

neededAmount

allowance for the PM contract, then approve if needed.

Buy: We purchase outcome 0 with

'50000000'

units of the token. Adjust to match your token’s decimals.

Claim: Eventually, after resolution, you might call

pm.claimWinnings(marketId)

if you hold the winning outcome.
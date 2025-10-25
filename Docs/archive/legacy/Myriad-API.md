[Skip to content](https://help.myriad.markets/Myriad-API-1b5c9e49da8280ccab83f7b37cb28a79#main)

![📈 Page icon](<Base64-Image-Removed>)![📈 Page icon](https://notion-emojis.s3-us-west-2.amazonaws.com/prod/svg-twitter/1f4c8.svg)

# Myriad API

Welcome to the Myriad API documentation. Myriad is an EVM-based multi-chain protocol deployed across several chains.

This API allows you to fetch information about markets for both Staging (testnet) and Production (mainnet) environments. Below you will find details on how to use the endpoints, token addresses, query parameters, and the fields each entity contains.

### Base URLs

All endpoints are available under these two base URLs:

Staging:

https://api-v1.staging.myriadprotocol.com/

Production:

https://api-v1.myriadprotocol.com/

### Networks

Myriad protocol is currently on [Abstract](https://www.abs.xyz/), [Linea](https://linea.build/) and [Celo](https://celo.org/) chains. Here’s the deployment details on each of them.

#### Abstract

Deployed Contracts

|  | Mainnet | Testnet |
| --- | --- | --- |
| PredictionMarket | [0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289](https://abscan.org/address/0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289) | [0x6c44Abf72085E5e71EeB7C951E3079073B1E7312](https://sepolia.abscan.org/address/0x6c44Abf72085E5e71EeB7C951E3079073B1E7312) |
| PredictionMarketQuerier | [0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff](https://abscan.org/address/0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff) | [0xa30c60107f9011dd49fc9e04ebe15963064eecc1](https://sepolia.abscan.org/address/0xa30c60107f9011dd49fc9e04ebe15963064eecc1) |

Tokens

| Token | Mainnet | Testnet |
| --- | --- | --- |
| USDC.e | [0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1](https://abscan.org/address/0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1) | [0x8820c84FD53663C2e2EA26e7a4c2b79dCc479765](https://sepolia.abscan.org/address/0x8820c84FD53663C2e2EA26e7a4c2b79dCc479765) |
| PENGU | [0x9eBe3A824Ca958e4b3Da772D2065518F009CBa62](https://abscan.org/address/0x9eBe3A824Ca958e4b3Da772D2065518F009CBa62) | [0x6ccDDCf494182a3A237ac3f33A303a57961FaF55](https://sepolia.abscan.org/address/0x6ccddcf494182a3a237ac3f33a303a57961faf55) |
| PTS | [0x0b07cf011b6e2b7e0803b892d97f751659940f23](https://abscan.org/address/0x0b07cf011b6e2b7e0803b892d97f751659940f23) | [0x6cC39C1149aed1fdbf6b11Fd60C18b96446cBc96](https://sepolia.abscan.org/address/0x6cC39C1149aed1fdbf6b11Fd60C18b96446cBc96) |

#### Linea

Deployed Contracts

|  | Mainnet | Testnet |
| --- | --- | --- |
| PredictionMarket | [0x39e66ee6b2ddaf4defded3038e0162180dbef340](https://lineascan.build/address/0x39e66ee6b2ddaf4defded3038e0162180dbef340) | [0xED5CCb260f80A7EB1E5779B02115b4dc25aA3cDE](https://sepolia.lineascan.build/address/0xED5CCb260f80A7EB1E5779B02115b4dc25aA3cDE) |
| PredictionMarketQuerier | [0x503c9f98398dc3433ABa819BF3eC0b97e02B8D04](https://lineascan.build/address/0x503c9f98398dc3433ABa819BF3eC0b97e02B8D04) | [0x90916C3C1a070ED31f6CdFCD42807a38B563392F](https://sepolia.lineascan.build/address/0x90916C3C1a070ED31f6CdFCD42807a38B563392F) |

Tokens

| Token | Mainnet | Testnet |
| --- | --- | --- |
| USDC | [0x176211869cA2b568f2A7D4EE941E073a821EE1ff](https://lineascan.build/address/0x176211869cA2b568f2A7D4EE941E073a821EE1ff) | [0xFEce4462D57bD51A6A552365A011b95f0E16d9B7](https://sepolia.lineascan.build/address/0xFEce4462D57bD51A6A552365A011b95f0E16d9B7) |

#### Celo

Deployed Contracts

|  | Mainnet | Testnet |
| --- | --- | --- |
| PredictionMarket | Coming soon | [0x289E3908ECDc3c8CcceC5b6801E758549846Ab19](https://celo-sepolia.blockscout.com/address/0x289E3908ECDc3c8CcceC5b6801E758549846Ab19) |
| PredictionMarketQuerier | Coming soon | [0x49c86faa48facCBaC75920Bb0d5Dd955F8678e15](https://celo-sepolia.blockscout.com/address/0x49c86faa48facCBaC75920Bb0d5Dd955F8678e15) |

Tokens

| Token | Mainnet | Testnet |
| --- | --- | --- |
| USDT | Coming soon | [0xf74B14ecbAdC9fBb283Fb3c8ae11E186856eae6f](https://celo-sepolia.blockscout.com/address/0xf74B14ecbAdC9fBb283Fb3c8ae11E186856eae6f) |

## 1\. Markets

A "market" on Myriad is a prediction market. It contains information such as its question, potential outcomes, status, network, and more.

Each market is traded in a specific token. Supported tokens are mentioned on the section above.

### 1.1. Fetch Markets

Plain Text

Copy

GET /markets

​

Query String Parameters

token

(required): The token symbol

Example:

USDC.e

state

(optional): Filters by state of the markets. Possible values:

open

closed

resolved

network\_id

(optional): Chain id of the desired markets. If not sent, will default to

Abstract

network\_id. Possible values:

|  | Mainnet | Testnet |
| --- | --- | --- |
| Abstract | 274133<br>\- actual chain id is <br>2741<br>, <br>33<br>was appended to it, signalling version 3.3 of the smart contract | 1112432<br>\- actual chain id is <br>11124<br>, the value <br>32<br>was appended to it, signalling version 3.2 of the smart contract |
| Linea | 5914434<br>\- actual chain id is <br>59144<br>, <br>34<br>was appended to it, signalling version 3.4 of the smart contract | 59141 |
| Abstract (Legacy) | 2741 | 11124 |
| Linea (Legacy - Beta) | 59144 | N/A |
| Celo | Coming soon | 11142220 |

Example Request

Plain Text

Copy

GET https://api-v1.myriadprotocol.com/markets?state=resolved&token=USDC.e

​

Example Response (Partial / Illustrative)

JSON

Copy

\[{"id":144,"network\_id":2741,"slug":"fear-and-greed-index-at-25-or-above-on-march-10","title":"Fear and Greed Index at 25 or above on March 10?","description":"The market is open throughout the weekend following the White House Crypto Summit scheduled for March 7. The market closes on March 10, 2025 at 00:00 UTC...\\n\\n(Full description omitted for brevity)","created\_at":"2025-03-06T19:10:03.767Z","expires\_at":"2025-03-10T00:00:00.000Z","scheduled\_at":null,"fee":0.0,"treasury\_fee":0.03,"treasury":"0x5E3EbEc100e2294C0EB2264FC96225dF067AAaa3","state":"resolved","verified":false,"category":"Crypto;;https://alternative.me/crypto/fear-and-greed-index/ ;Alternative.me","subcategory":"","topics":\["Crypto"\],"resolution\_source":"https://alternative.me/crypto/fear-and-greed-index/","resolution\_title":"Alternative.me","token":{"name":"Bridged USDC (Stargate)","address":"0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1","symbol":"USDC.e","decimals":6,"wrapped":false},"image\_url":"https://imagedelivery.net/YN1-rdnufJQJCgu3i1CbVw/251d08d0-8e3a-4e64/public","banner\_url":"https://imagedelivery.net/YN1-rdnufJQJCgu3i1CbVw/56ccb9ae-dd19-4581/public","og\_image\_url":"https://imagedelivery.net/YN1-rdnufJQJCgu3i1CbVw/3bb71262-7b6a-436a/public","image\_ipfs\_hash":"","liquidity":12792.659545,"liquidity\_eur":12792.659545,"liquidity\_price":0.5653941835595063,"volume":83841.697395,"volume\_eur":83841.697395,"shares":29858.989744,"question\_id":"0x9758dc99bcea93a6460e4a3694963025b8c761391ef1c5fdaabc173dfa1526d0","resolved\_outcome\_id":1,"voided":false,"trading\_view\_symbol":null,"news":\[\],"votes":{"up":0,"down":0},"users":2114,"likes":0,"comments":0,"featured":false,"featured\_at":null,"publish\_status":"published","edit\_history":\[\],"tournaments":\[{"id":255,"network\_id":2741,"slug":"usdc-myriad-markets","title":"USDC Myriad Markets","description":"USDC Myriad Markets","created\_at":"2025-02-28T12:05:18.845Z","image\_url":"","og\_image\_url":"https://imagedelivery.net/YN1-rdnufJQJCgu3i1CbVw/018127af-3436-4a82-850a/public","expires\_at":"2026-01-01T00:00:00.000Z","users":4813,"position":1,"rank\_by":"earnings\_eur","rewards":\[{"to":1,"from":1,"title":"Big Rewards","rank\_by":"earnings\_eur","image\_url":"","description":"Big Rewards"}\],"topics":\["Sports","Society","Economy","Finance","Politics","Entertainment/Arts"\],"published":true,"land":{"id":80,"slug":"myriad-usdc","title":"Myriad - USDC","network\_id":"2741","description":"\*\*Myriad is a revolutionary application designed to reward you for every article read...\*\*","short\_description":"Welcome to Myriad Predictions Land...","token\_controller\_address":"0x31a13479f5cc684b561bdd9c66d88aeaa765cbc6","created\_at":"2025-02-28T12:00:43.884Z","position":8,"rank\_by":"earnings\_eur","users":0,"image\_url":"https://imagedelivery.net/YN1-rdnufJQJCgu3i1CbVw/7a26f238-8194/public","banner\_url":"https://imagedelivery.net/YN1-rdnufJQJCgu3i1CbVw/359049f1-f480/public","admins":\["0x0a70f6F09caa802D...","..."\],"published":true,"website\_url":"https://dastan.co","whitelabel":true,"onboarded":true,"advanced":true,"topics":\["Culture","Crypto","Sports"\]}}\],"question":{"id":"0x9758dc99bcea93a6460e4a3694963025b8c761391ef1c5fdaabc173dfa1526d0","bond":0.0,"best\_answer":"0x0000000000000000000000000000000000000000000000000000000000000000","is\_finalized":false,"arbitrator":"0x0000000000000000000000000000000000000000","is\_pending\_arbitration":false,"is\_claimed":false,"finalize\_ts":0,"timeout":0,"dispute\_id":null,"is\_pending\_arbitration\_request":false},"outcomes":\[{"id":0,"market\_id":144,"title":"Yes","shares":9280.985087,"shares\_held":24909.361857,"price":0.72,"closing\_price":null,"price\_change\_24h":-0.07,"image\_url":"https://imagedelivery.net/YN1-rdnufJQJCgu3i1CbVw/ea8dfd3b-3eca/public","image\_ipfs\_hash":"Qmc5D837Ufpbq9Rz8LXNKbapqLDPWrvE3zx78igp7n9ohM"},{"id":1,"market\_id":144,"title":"No","shares":10774.71906,"shares\_held":23415.627884,"price":0.28,"closing\_price":null,"price\_change\_24h":0.01,"image\_url":null,"image\_ipfs\_hash":null}\],"liked":false,"related\_markets":\[{"id":145,"slug":"will-pump-fun-s-cumulative-revenue-exceed-615m-by-the-end-of-march","title":"Will Pump.Fun’s cumulative revenue exceed $615M by the end of March?","state":"open","token":{"symbol":"USDC.e"}},\
...\
\]},{"id":143,"network\_id":2741,"slug":"ufc-313-pereira-vs-ankalaev-who-wins","title":"UFC 313: Pereira vs Ankalaev - Who wins?","description":"...","state":"closed",\
...\
}\]

​

### Market Fields

Each Market object may contain many fields. Below is a consolidated view of the fields visible in the example you provided, along with brief explanations:

| Field | Type | Description |
| --- | --- | --- |
| id | Integer | The API’s unique numeric identifier of the market. |
| network\_id | Integer | The network on which the market is hosted (<br>274133<br>for Abstract mainnet). |
| slug | String | The unique, human-readable identifier used in the market’s URL (e.g., <br>fear-and-greed-index-at-25-or-above-on-march-10<br>). |
| title | String | The main title or question of the market. |
| description | String | A more detailed explanation or instructions about the market, including rules for resolution or cancellation.<br>Often written with Markdown. |
| created\_at | DateTime (ISO8601) | Timestamp of when this market was originally created. |
| expires\_at | DateTime (ISO8601) | When the market is set to expire (i.e. close, stop accepting new positions). |
| scheduled\_at | DateTime (ISO8601) or null | If present, indicates when the market is scheduled to open, go live, or otherwise update. May be <br>null<br>if unscheduled. |
| fee | Number | The Liquidity Provider fee in decimal format (e.g., <br>0.0<br>for zero fee, <br>0.03<br>for 3% fee).<br>This fee is levied on all trades (buys and sells) and is claimable by Liquidity Providers based on their share of the Liquidity Pool. |
| treasury\_fee | Number | A fee levied on each trade that is sent to a specific wallet address, determined by the market creator. Also as a decimal (e.g., <br>0.0<br>for zero fee, <br>0.03<br>for 3% fee). |
| treasury | String (address) | The on-chain address that collects the treasury fee. |
| state | String | The market’s current state (e.g., <br>open<br>, <br>closed<br>, <br>resolved<br>). |
| verified | Boolean | Indicates whether the market is verified by some official or automated process. |
| category | String | High-level category (or categories) for the market (e.g., <br>Crypto<br>). May occasionally include extra data or URLs. |
| subcategory | String | A further breakdown of the main category, if applicable (may be empty). |
| topics | Array of Strings | A list of topics/tags associated with the market (e.g., <br>\["Crypto", "Culture"\]<br>). |
| resolution\_source | String (URL) | URL that is displayed alongside the market description, typically used to decide on the resolution of the market’s outcome. |
| resolution\_title | String | A descriptive name for the resolution source (e.g., <br>CryptoMarketCap<br>). |
| token | Object | Contains details about the ERC-20 token used for trading in this market (i.e. name, address, symbol, decimals, wrapped). <br>"token": {<br>"name": "Bridged USDC (Stargate)",<br>"address": "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1",<br>"symbol": "USDC.e",<br>"decimals": 6,<br>"wrapped": false<br>}, |
| image\_url | String (URL) | URL of an image that visually represents this market. |
| banner\_url | String (URL) | URL of a banner or header image for the market. |
| og\_image\_url | String (URL) | URL of an Open Graph image used when sharing the market on social platforms. |
| image\_ipfs\_hash | String (IPFS hash) | If stored on IPFS, the IPFS hash for the market’s primary image. |
| liquidity | Number | The amount of liquidity (in tokens) that has been provided to the market. |
| liquidity\_price | Number | Price representing the cost or value of liquidity shares in the market (may be used for reference). |
| volume | Number | Total trading volume in the market (in the market’s token). |
| shares | Number | The total number of outstanding shares in the market. |
| question\_id | String (address/hash) | An ID or hash reference for the on-chain question this market is based on. |
| resolved\_outcome\_id | Integer or null | Numeric ID of the winning outcome, if the market is resolved. <br>-1<br>or <br>null<br>may appear if unresolved or canceled. |
| voided | Boolean | true<br>if the market was canceled/voided, <br>false<br>otherwise. |
| trading\_view\_symbol | String or null | If the market references a TradingView symbol for price tracking, it may appear here. Otherwise, <br>null<br>. |
| news | Array | An array of news items or relevant updates. |
| votes | Object | Tracks up/down votes for the market, e.g., <br>{"up": 0, "down": 0}<br>. |
| users | Integer | Number of users who engaged with this market. |
| likes | Integer | (Not used) Number of likes or favorites. |
| comments | Integer | (Not used) Number of comments or discussion entries tied to this market. |
| featured | Boolean | Indicates if the market is highlighted or featured in the UI. |
| featured\_at | DateTime (ISO8601) or null | Timestamp of when the market became featured, if ever. |
| publish\_status | String | The publishing state of the market (e.g., <br>draft<br>, <br>published<br>). |
| edit\_history | Array | A record of edits made to the market’s description or other fields (timestamped). |
| tournaments | Array of Objects | (Not relevant to Partners) Lists any tournaments this market is associated with. Each object contains tournament details (e.g., <br>id<br>, <br>slug<br>, <br>title<br>). |
| outcomes | Array of Objects | The market’s possible outcomes. Each outcome typically includes: • <br>id<br>(Integer) • <br>market\_id<br>(Integer) • <br>title<br>(String) • <br>price<br>(Number) • <br>price\_charts<br>(Array) • <br>shares<br>(Number) • <br>image\_url<br>(String) • <br>image\_ipfs\_hash<br>(String or null) … etc. |
| liked | Boolean | Indicates if the currently authenticated user (if any) has “liked” the market. |
| related\_markets | Array of Objects | A list of other markets that may be related or recommended; each entry is itself a simplified Market object. |

#### Nested Objects

token

:

name

: Name of the token

address

: Token contract address

symbol

: Ticker symbol (e.g.,

USDC.e

)

decimals

: Decimal precision

wrapped

: Boolean indicating if it is a wrapped token

question

:

Contains data related to the on-chain question or oracle (e.g.,

id

,

bond

,

arbitrator

).

Typically used for advanced resolution or dispute logic.

outcomes

:

Each outcome may include extra fields like

shares\_held

,

closing\_price

,

price\_change\_24h

, etc., depending on the market’s lifecycle and analytics.

> Note: Fields, such as
>
> related\_markets
>
> , or
>
> price\_charts
>
> under each outcome, appear only for
>
> /markets/:slug
>
> requests.

### 1.2. Fetch a Single Market

Plain Text

Copy

GET /markets/:slug

​

Example Request

Plain Text

Copy

GET https://api-v1.myriadprotocol.com/markets/fear-and-greed-index-at-25-or-above-on-march-10

​
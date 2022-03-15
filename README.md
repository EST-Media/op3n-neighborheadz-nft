# NeighborheadzNFT smart contract

Website: https://neighborheadz.op3n.world/
Mint site: T.B.D

# Setup project with hardhat

1. Install hardhat `npm install --save-dev hardhat`
2. Install packages: `npm install`
3. Install shorthand: `npm i -g hardhat-shorthand` after install can run hardhat command by `hh` instead of `npx hardhat`

# Compile, deploy and verify smart contract

Script env vars:
  | key                                      | description                                                                                                                                                        |
|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PRIVATE_KEY`                            | a mnemonic or private key of deployer's account, ignore if when deploy on hardhat local. The account should have native coin to run deploy contract scripts                     |
| `ROPSTEN_URL`, `RINKEBY_URL`, `GOERLI_URL` | network gateway, get at: [infura](https://infura.io/) [moralis](https://moralis.io/)                                                                               |
| `ETHERSCAN_API_KEY`                      | explorer api key, get at:  [etherscan](https://etherscan.io/myapikey) [bscscan](https://bscscan.com/myapikey) [polygonscan](https://polygonscan.com/myapikey)... |

### Deploy and Verify:

**Command**
1. Set env vars
2. Deploy contract: `hh run scripts/deploy.ts --network <network>`
3. Verify contract: `hh verify <contract_address> --contract contracts/NeighborheadzNFT.sol:NeighborheadzNFT --network <network>`

# Testing

**Command**
  `hh test`

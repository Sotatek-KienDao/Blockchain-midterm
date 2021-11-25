require('dotenv').config()
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-etherscan')

if (
  process.env.INFURA_API_KEY != undefined &&
  process.env.PRIVATE_KEY != undefined &&
  process.env.ETHERSCAN_API_KEY != undefined
) {
  module.exports = {
    solidity: '0.8.4',
    networks: {
      rinkeby: {
        url: process.env.INFURA_API_KEY, //Infura url with projectId
        accounts: [process.env.PRIVATE_KEY], // add the account that will deploy the contract (private key)
      },
    },
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY, // eth
    },
  }
}

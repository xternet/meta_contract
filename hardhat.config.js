require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      }
    ],
  }
};

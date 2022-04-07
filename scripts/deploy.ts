import hre = require("hardhat");

async function main() {
  const contractClass = "NeighborheadzNFT";
  const contractFactory = await hre.ethers.getContractFactory(contractClass);

  const contract = await contractFactory.deploy();
  await contract.deployed();

  const [owner] = await hre.ethers.getSigners();
  await contract.activate(
    30,
    53,
    5555,
    "ipfs://QmTW1pFN4zqnFPWjkRy1UVxZuwFLKtX4Sq8acQ1ZaqE1J2/",
    owner.address
  );

  console.log(contractClass, contract.address.toLowerCase());
  console.log("-----------------Verify Contract-----------------");
  console.log(
    "hh verify",
    contract.address.toLowerCase(),
    "--contract contracts/" +
      contractClass +
      ".sol:" +
      contractClass +
      " --network",
    hre.network.name
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

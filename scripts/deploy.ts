import hre = require("hardhat");

// beforeReveal: "ipfs://QmYsAGA6UWkqScDuphvwbfXuyPJ3siYY8JJCMVQAixp42x/"
// aftereReveal:

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
    "ipfs://QmXnMrJuNANFRV2GfdiyAdNkjcKzR3HoJWpxXfz49x1aXU/",
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

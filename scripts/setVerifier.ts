import hre = require("hardhat");

async function main() {
  const contractAddress = process.env.DEPLOYED_CONTRACT;
  if (!contractAddress) {
    console.error("Please set DEPLOYED_CONTRACT");
    return;
  }

  const verifierAddress = process.env.VERIFIER_ADDRESS;
  if (!verifierAddress) {
    console.error("Please set VERIFIER_ADDRESS");
    return;
  }

  const [owner] = await hre.ethers.getSigners();
  const contractClass = "NeighborheadzNFT";
  const artifact = await hre.artifacts.readArtifact(contractClass);
  const contract = new hre.ethers.Contract(
    contractAddress,
    artifact.abi,
    owner
  );

  const tx = await contract.setVerifier(verifierAddress);
  const receipt = await tx.wait();
  console.log(receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import hre = require("hardhat");

async function main() {
  const contractAddress = process.env.DEPLOYED_CONTRACT;
  if (!contractAddress) {
    console.error("Please set DEPLOYED_CONTRACT");
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

  const salt = new Date().getTime();
  const orderHash = hre.ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [owner.address, salt]
  );
  const sig = await owner.signMessage(hre.ethers.utils.arrayify(orderHash));

  const tx = await contract.mint(salt, sig, [], {
    value: hre.ethers.utils.parseUnits("0.08", "ether"),
  });
  const receipt = await tx.wait();
  console.log(receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

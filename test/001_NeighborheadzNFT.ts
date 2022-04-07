// import fs from "fs"; // Filesystem
// import path from "path"; // Path
import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 = require("keccak256");
// import { parseUnits, solidityKeccak256 } from "ethers/lib/utils";

describe("NeighborheadzNFT contract", function () {
  let contract: any;
  let owner: any;
  let addrs: any;
  const sigTypes = ["address", "uint256"];

  beforeEach(async function () {
    [owner, ...addrs] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NeighborheadzNFT");
    contract = await contractFactory.deploy();
  });

  describe("#initialize", function () {
    it("sets name is Neighborheadz", async function () {
      expect(await contract.name()).to.equal("Neighborheadz");
    });

    it("sets symbol is NBHZ", async function () {
      expect(await contract.symbol()).to.equal("NBHZ");
    });

    it("sets UNIT_PRICE is 0.08 eth", async function () {
      expect(await contract.UNIT_PRICE()).to.equal(
        ethers.utils.parseUnits("0.08", "ether")
      );
    });

    it("sets MAX_PRESALE_PER_MINTER is 2", async function () {
      expect(await contract.MAX_PRESALE_PER_MINTER()).to.equal(2);
    });

    it("sets owner is deployer", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("sets owner is verifier", async function () {
      expect(await contract.isVerifier(owner.address)).to.equal(true);
    });

    it("grants owner is Admin", async function () {
      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      expect(await contract.hasRole(adminRole, owner.address)).to.equal(true);
    });
  });

  describe("#supportsInterface(bytes4 interfaceId) external view returns (bool)", function () {
    describe("when supports ERC721 - Non-Fungible Token Standard", function () {
      it("returns true", async function () {
        expect(await contract.supportsInterface(0x80ac58cd)).to.equal(true);
      });
    });

    describe("when supports ERC721Metadata - Non-Fungible Token Standard metadata extension", function () {
      it("returns true", async function () {
        expect(await contract.supportsInterface(0x5b5e139f)).to.equal(true);
      });
    });

    describe("when supports EIP2981 - NFT Royalty Standard", function () {
      it("returns true", async function () {
        expect(await contract.supportsInterface(0x2a55205a)).to.equal(true);
      });
    });
  });

  describe("#transferOwnership(address newOwner) external onlyOwner", function () {
    it("sets new owner for contract", async function () {
      const newOwner = addrs[2];

      expect(await contract.owner()).to.equal(owner.address);
      await contract.transferOwnership(newOwner.address);
      expect(await contract.owner()).to.equal(newOwner.address);
    });

    describe("when caller is not owner", function () {
      it("reverts with Ownable:", async function () {
        const caller = addrs[1];
        const newOwner = addrs[2];

        expect(await contract.owner()).to.equal(owner.address);
        await expect(
          contract.connect(caller).transferOwnership(newOwner.address)
        ).to.be.revertedWith("Ownable:");
        expect(await contract.owner()).to.equal(owner.address);
      });
    });
  });

  describe("#setVerifier(address verifier_) external onlyAdmin", function () {
    it("sets verifier", async function () {
      const verifier = addrs[2];

      expect(await contract.isVerifier(verifier.address)).to.equal(false);
      await contract.setVerifier(verifier.address);
      expect(await contract.isVerifier(verifier.address)).to.equal(true);
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).setVerifier(addrs[1].address)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#revokeVerifier(address verifier_) external onlyAdmin", function () {
    let verifier: any;
    beforeEach(async function () {
      verifier = addrs[2];
      await contract.setVerifier(verifier.address);
    });

    it("revokes verifier", async function () {
      expect(await contract.isVerifier(verifier.address)).to.equal(true);
      await contract.revokeVerifier(verifier.address);
      expect(await contract.isVerifier(verifier.address)).to.equal(false);
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).revokeVerifier(addrs[1].address)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#activate(uint256 startIndex_, uint256 totalSupply_, string memory tokenURI_, address fundRecipient_) external onlyAdmin", function () {
    describe("when caller is admin", function () {
      let fundRecipient: any;

      beforeEach(async function () {
        fundRecipient = addrs[2];
        await contract.activate(
          80,
          53,
          5555,
          "https://nft.uri/",
          fundRecipient.address
        );

        const salt = new Date().getTime();
        const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
          owner.address,
          salt,
        ]);
        const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));
        await contract.mint(salt, sig, [], {
          value: ethers.utils.parseUnits("0.1", "ether"),
        });
      });

      it("sets startIndex is 80", async function () {
        expect(await contract.tokenURI(81)).to.equal("https://nft.uri/81");
      });

      it("sets totalSupply is 5555", async function () {
        expect(await contract.totalSupply()).to.equal(5555);
      });

      it("sets baseURI is https://nft.uri", async function () {
        expect(await contract.tokenURI(81)).to.equal("https://nft.uri/81");
      });

      it("sets fundRecipient", async function () {
        expect(await contract.fundRecipient()).to.equal(fundRecipient.address);
      });

      it("sets tokenIndex is 80", async function () {
        expect(await contract.tokenURI(81)).to.equal("https://nft.uri/81");
      });

      it("sets royaltyInfo is fundRecipient and 0%", async function () {
        const result = await contract.royaltyInfo(
          81,
          ethers.utils.parseUnits("1", "ether")
        );
        expect(result[0]).to.equal(fundRecipient.address);
        expect(result[1]).to.equal(ethers.utils.parseUnits("0", "ether"));
      });

      describe("when already activated", function () {
        it("reverts with NBHZ: Already activated", async function () {
          await expect(
            contract.activate(
              80,
              53,
              5555,
              "https://nft1.uri/",
              fundRecipient.address
            )
          ).to.be.revertedWith("NBHZ: Already activated");
        });
      });
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract
            .connect(addrs[0])
            .activate(80, 53, 5555, "https://nft1.uri/", addrs[1].address)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyAdmin", function () {
    it("sets royaltyInfo 10%", async function () {
      await contract.setDefaultRoyalty(addrs[1].address, 1000);
      const result = await contract.royaltyInfo(
        81,
        ethers.utils.parseUnits("1", "ether")
      );
      expect(result[0]).to.equal(addrs[1].address);
      expect(result[1]).to.equal(ethers.utils.parseUnits("0.1", "ether"));
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).setDefaultRoyalty(addrs[1].address, 10000)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#setBaseTokenURI(string memory baseTokenURI_) external onlyAdmin", function () {
    beforeEach(async function () {
      await contract.activate(30, 53, 90, "https://nft.uri/", owner.address);
    });

    it("sets baseTokenURI", async function () {
      const salt = new Date().getTime();
      const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
        addrs[0].address,
        salt,
      ]);
      const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));
      await contract.connect(addrs[0]).mint(salt, sig, [], {
        value: ethers.utils.parseUnits("0.1", "ether"),
      });

      expect(await contract.tokenURI(31)).to.equal("https://nft.uri/31");
      const baseTokenURI = "ipfs://BaseTokenURI/";
      await contract.setBaseTokenURI(baseTokenURI);
      expect(await contract.tokenURI(31)).to.equal("ipfs://BaseTokenURI/31");
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).setBaseTokenURI("ipfs://BaseTokenURI/")
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#mintVIP(address toAddress, uint256 tokenId) external onlyAdmin", function () {
    let fundRecipient: any;

    beforeEach(async function () {
      fundRecipient = addrs[2];
      await contract.activate(
        80,
        5555,
        53,
        "https://nft.uri/",
        fundRecipient.address
      );
    });

    it("mints tokenID to toAddress", async function () {
      await contract.mintVIP(addrs[1].address, 1);
      expect(await contract.ownerOf(1)).to.equal(addrs[1].address);
    });

    it("increases toAddress balance by 1", async function () {
      expect(await contract.balanceOf(addrs[1].address)).to.equal(0);
      await contract.mintVIP(addrs[1].address, 1);
      expect(await contract.balanceOf(addrs[1].address)).to.equal(1);
      await contract.mintVIP(addrs[1].address, 2);
      expect(await contract.balanceOf(addrs[1].address)).to.equal(2);
    });

    describe("when tokenId already minted", function () {
      it("reverts with ERC721: token already minted", async function () {
        await contract.mintVIP(addrs[0].address, 1);
        await expect(contract.mintVIP(addrs[0].address, 1)).to.be.revertedWith(
          "ERC721: token already minted"
        );
      });
    });

    describe("when tokenId is 0", function () {
      it("reverts with NBHZ: Invalid tokenId", async function () {
        await expect(contract.mintVIP(addrs[0].address, 0)).to.be.revertedWith(
          "NBHZ: Invalid tokenId"
        );
      });
    });

    describe("when tokenId is greater than startIndex", function () {
      it("reverts with NBHZ: Invalid tokenId", async function () {
        await expect(contract.mintVIP(addrs[0].address, 81)).to.be.revertedWith(
          "NBHZ: Invalid tokenId"
        );
      });
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).mintVIP(addrs[0].address, 1)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#mint(uint256 salt, bytes memory sig) external nonReentrant payable", function () {
    let fundRecipient: any;

    // helpers
    async function mintCaller(minter: any, proof?: any): Promise<any> {
      const salt = new Date().getTime();
      const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
        minter.address,
        salt,
      ]);
      const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));
      return contract.connect(minter).mint(salt, sig, proof || [], {
        value: ethers.utils.parseUnits("0.1", "ether"),
      });
    }

    beforeEach(async function () {
      fundRecipient = addrs[2];
      await contract.activate(
        80,
        53,
        90,
        "https://nft.uri/",
        fundRecipient.address
      );
    });

    it("marks sig is finalized", async function () {
      const salt = new Date().getTime();
      const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
        addrs[0].address,
        salt,
      ]);
      const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));
      await contract.connect(addrs[0]).mint(salt, sig, [], {
        value: ethers.utils.parseUnits("0.1", "ether"),
      });
      expect(await contract.finalized(orderHash)).to.equal(true);
    });

    it("increases tokenIndex by 1", async function () {
      await mintCaller(addrs[0]);
      expect(await contract.tokenURI(81)).to.equal("https://nft.uri/81");

      await mintCaller(addrs[1]);
      expect(await contract.tokenURI(82)).to.equal("https://nft.uri/82");
    });

    it("sets right tokenURI minter balance", async function () {
      await expect(contract.tokenURI(81)).to.be.revertedWith("ERC721Metadata:");
      await mintCaller(addrs[1]);
      expect(await contract.tokenURI(81)).to.equal("https://nft.uri/81");
    });

    it("increases minter balance by 1", async function () {
      expect(await contract.balanceOf(addrs[1].address)).to.equal(0);
      await mintCaller(addrs[1]);
      expect(await contract.balanceOf(addrs[1].address)).to.equal(1);
      await mintCaller(addrs[1]);
      expect(await contract.balanceOf(addrs[1].address)).to.equal(2);
    });

    it("sends funds to fundRecipient", async function () {
      const fundRecipientBalance = await fundRecipient.getBalance();
      await mintCaller(addrs[1]);
      expect(await fundRecipient.getBalance()).to.equal(
        fundRecipientBalance.add(ethers.utils.parseUnits("0.1", "ether"))
      );
    });

    it("mints tokenID to minter", async function () {
      await mintCaller(addrs[1]);
      expect(await contract.ownerOf(81)).to.equal(addrs[1].address);
    });

    describe("when preSaleRoot exists", function () {
      let minter: any;
      let tree: MerkleTree;

      function generateLeaf(address: string): Buffer {
        return Buffer.from(
          // Hash in appropriate Merkle format
          ethers.utils.solidityKeccak256(["address"], [address]).slice(2),
          "hex"
        );
      }

      beforeEach(async function () {
        minter = addrs[1];
        const leaves: Buffer[] = [
          generateLeaf(minter.address),
          generateLeaf(addrs[2].address),
        ];
        tree = new MerkleTree(leaves, keccak256, {
          sortPairs: true,
        });
        await contract.setPreSaleRoot(tree.getHexRoot());
      });

      describe("when valid proof", function () {
        it("mints tokenID to minter", async function () {
          // const outputPath: string = path.join(__dirname, "../merkle.json");
          // await fs.writeFileSync(
          //   // Output to merkle.json
          //   outputPath,
          //   // Root + full tree
          //   JSON.stringify({
          //     root: tree.getHexRoot(),
          //     tree: tree,
          //   })
          // );
          // console.log(tree.getHexLeaves());
          // console.log(tree.getHexProof(keccak256(minter.address)));

          await mintCaller(minter, tree.getHexProof(keccak256(minter.address)));

          expect(await contract.ownerOf(81)).to.equal(minter.address);
        });

        describe("when minted is greater than MAX_PRESALE_PER_MINTER(is 2)", function () {
          it("reverts NBHZ: Can not mint", async function () {
            await mintCaller(
              minter,
              tree.getHexProof(keccak256(minter.address))
            );
            await mintCaller(
              minter,
              tree.getHexProof(keccak256(minter.address))
            );

            await expect(
              mintCaller(minter, tree.getHexProof(keccak256(minter.address)))
            ).to.be.revertedWith("NBHZ: Can not mint");
          });
        });
      });

      describe("when proof is empty", function () {
        it("reverts NBHZ: Can not mint", async function () {
          await expect(mintCaller(minter, [])).to.be.revertedWith(
            "NBHZ: Can not mint"
          );
        });
      });

      describe("when invalid proof", function () {
        it("reverts NBHZ: Can not mint", async function () {
          const leaves = [minter.address, addrs[2].address, addrs[3].address];
          const merkleTree = new MerkleTree(leaves, keccak256, {
            hashLeaves: true,
            sortPairs: true,
          });
          const leaf = keccak256(minter.address);
          const invalidProof = merkleTree.getHexProof(leaf);

          await expect(mintCaller(minter, invalidProof)).to.be.revertedWith(
            "NBHZ: Can not mint"
          );
        });
      });

      describe("when set preSaleRoot is empty", function () {
        it("when call mint with empty proof, mints tokenID to minter", async function () {
          await contract.setPreSaleRoot(ethers.constants.HashZero);

          await mintCaller(minter);
          expect(await contract.ownerOf(81)).to.equal(minter.address);
        });
      });
    });

    describe("when value is less than UNIT_PRICE", function () {
      it("reverts NBHZ: Invalid amount", async function () {
        const minter = addrs[1];
        const salt = new Date().getTime();
        const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
        ]);
        const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));

        await expect(
          contract.connect(minter).mint(salt, sig, [], {
            value: ethers.utils.parseUnits("0.07", "ether"),
          })
        ).to.be.revertedWith("NBHZ: Invalid amount");
      });
    });

    describe("when tokens reach limit total supply", function () {
      it("reverts NBHZ: Reach total supply", async function () {
        await mintCaller(addrs[1]);
        await mintCaller(addrs[2]);
        await mintCaller(addrs[1]);
        await mintCaller(addrs[2]);
        await mintCaller(addrs[1]);
        await mintCaller(addrs[2]);
        await mintCaller(addrs[1]);
        await mintCaller(addrs[2]);
        await mintCaller(addrs[1]);
        expect(await contract.ownerOf(89)).to.equal(addrs[1].address);
        await mintCaller(addrs[2]);
        expect(await contract.ownerOf(90)).to.equal(addrs[2].address);

        await expect(mintCaller(addrs[1])).to.be.revertedWith(
          "NBHZ: Reach total supply"
        );
      });
    });

    describe("when sig used", function () {
      it("reverts NBHZ: Salt Used", async function () {
        const minter = addrs[1];
        const salt = new Date().getTime();
        const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
        ]);
        const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));

        await contract.connect(minter).mint(salt, sig, [], {
          value: ethers.utils.parseUnits("0.1", "ether"),
        });
        expect(await contract.ownerOf(81)).to.equal(minter.address);

        await expect(
          contract.connect(minter).mint(salt, sig, [], {
            value: ethers.utils.parseUnits("0.1", "ether"),
          })
        ).to.be.revertedWith("NBHZ: Salt used");
      });
    });

    describe("when sig recover is not a verifier", function () {
      it("reverts NBHZ: Unauthorized", async function () {
        const minter = addrs[1];
        const salt = new Date().getTime();
        const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
        ]);
        const sig = await addrs[0].signMessage(
          ethers.utils.arrayify(orderHash)
        );

        await expect(
          contract.connect(minter).mint(salt, sig, [], {
            value: ethers.utils.parseUnits("0.1", "ether"),
          })
        ).to.be.revertedWith("NBHZ: Unauthorized");
      });
    });
  });

  describe("#giveaway(address toAddress) external onlyAdmin", function () {
    let fundRecipient: any;

    beforeEach(async function () {
      fundRecipient = addrs[2];
      await contract.activate(
        30,
        3,
        90,
        "https://nft.uri/",
        fundRecipient.address
      );
    });

    it("increases tokenIndex by 1", async function () {
      await contract.giveaway(addrs[0].address);
      expect(await contract.ownerOf(31)).to.equal(addrs[0].address);

      await contract.giveaway(addrs[1].address);
      expect(await contract.ownerOf(32)).to.equal(addrs[1].address);
    });

    describe("when giveaway reach max giveaway", function () {
      it("reverts NBHZ: Can not giveaway", async function () {
        await contract.giveaway(addrs[0].address);
        expect(await contract.ownerOf(31)).to.equal(addrs[0].address);

        await contract.giveaway(addrs[1].address);
        expect(await contract.ownerOf(32)).to.equal(addrs[1].address);

        await contract.giveaway(addrs[2].address);
        expect(await contract.ownerOf(33)).to.equal(addrs[2].address);

        await expect(contract.giveaway(addrs[3].address)).to.be.revertedWith(
          "NBHZ: Can not giveaway"
        );
      });
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).giveaway(addrs[1].address)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });
});

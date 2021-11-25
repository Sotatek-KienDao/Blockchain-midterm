const { expect } = require('chai')
const { ethers } = require('hardhat')
const ethersJS = require('ethers')

describe('KCollection', function () {
  let kCollection, owner, kien
  beforeEach(async function () {
    const KCollection = await ethers.getContractFactory('KCollection')
    ;[owner, kien] = await ethers.getSigners()
    kCollection = await KCollection.deploy('Kien Collection', 'KCollection')
  })
  it('mint and transfer token to kien account', async () => {
    await kCollection.mint(kien.address, 1)
    expect(await kCollection.balanceOf(kien.address)).to.be.eq(1) //This address has 1 token
  })

  it('mint and transfer 2 token to kien account', async () => {
    await kCollection.mint(kien.address, 1)
    await kCollection.mint(kien.address, 10)
    expect(await kCollection.balanceOf(kien.address)).to.be.eq(2) //This address has 2 token
  })

  it('mint and transfer token but failed since it already minted', async () => {
    await kCollection.connect(kien).mint(owner.address, 1)
    await expect(
      kCollection.connect(kien).mint(owner.address, 1)
    ).to.be.revertedWith('ERC721: token already minted')
  })

  it('check URI', async () => {
    await kCollection.mint(kien.address, 1)
    expect(await kCollection.tokenURI(1)).to.be.eq(
      'https://www.google.com/search?q=1'
    )
  })
})

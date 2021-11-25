const { expect } = require('chai')
const { ethers } = require('hardhat')
const ethersJS = require('ethers')

describe('KToken', function () {
  let kToken, owner, kien
  beforeEach(async function () {
    const KToken = await ethers.getContractFactory('KToken')
    ;[owner, kien] = await ethers.getSigners()
    kToken = await KToken.deploy('Kien Token', 'KToken')
  })
  it('mint and transfer token to kien account', async () => {
    await kToken.mint(kien.address, ethersJS.ethers.utils.parseEther('1'))
    expect(await kToken.balanceOf(kien.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('1')
    )
  })
  it('mint and transfer token but failed', async () => {
    await expect(
      kToken
        .connect(kien)
        .mint(owner.address, ethersJS.ethers.utils.parseEther('1'))
    ).to.be.revertedWith('KToken: caller is not the minter')
  })
})

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

  it('mint and burn token', async () => {
    await kToken.mint(owner.address, ethersJS.ethers.utils.parseEther('1'))
    await kToken.burn(ethersJS.ethers.utils.parseEther('1'))
    expect(await kToken.balanceOf(owner.address)).to.be.eq(0)
  })

  it('kien try to burn token but failed', async () => {
    await kToken.mint(kien.address, ethersJS.ethers.utils.parseEther('1'))
    await expect(
      kToken.connect(kien).burn(ethersJS.ethers.utils.parseEther('1'))
    ).to.be.revertedWith('KToken: caller is not the burner')
  })

  it('burn token but not enough balance', async () => {
    await expect(
      kToken.burn(ethersJS.ethers.utils.parseEther('1'))
    ).to.be.revertedWith('ERC20: burn amount exceeds balance')
  })

  it('burnFrom test', async () => {
    await kToken
      .connect(kien)
      .approve(owner.address, ethersJS.ethers.utils.parseEther('10000'))
    await kToken.mint(kien.address, ethersJS.ethers.utils.parseEther('1'))
    await kToken.burnFrom(kien.address, ethersJS.ethers.utils.parseEther('1'))
    expect(await kToken.balanceOf(kien.address)).to.be.eq(0)
  })

  it('burnFrom exceed allowance test', async () => {
    await kToken
      .connect(kien)
      .approve(owner.address, ethersJS.ethers.utils.parseEther('1'))
    await kToken.mint(kien.address, ethersJS.ethers.utils.parseEther('1'))
    await expect(
      kToken.burnFrom(kien.address, ethersJS.ethers.utils.parseEther('2'))
    ).to.be.revertedWith('ERC20: burn amount exceeds allowance')
  })

  it('kien try to use burn from function but failed', async () => {
    await kToken.mint(kien.address, ethersJS.ethers.utils.parseEther('1'))
    await expect(
      kToken
        .connect(kien)
        .burnFrom(kien.address, ethersJS.ethers.utils.parseEther('1'))
    ).to.be.revertedWith('KToken: caller is not the burner')
  })

  it('transaction pause but try to make transaction', async () => {
    await kToken.pauseTransaction()
    await expect(
      kToken.mint(kien.address, ethersJS.ethers.utils.parseEther('1'))
    ).to.be.revertedWith('KToken: token transfer while paused')
  })

  it('make transaction normal after unpause', async () => {
    await kToken.pauseTransaction()
    await kToken.unpauseTransaction()
    await kToken.mint(kien.address, ethersJS.ethers.utils.parseEther('1'))
    expect(await kToken.balanceOf(kien.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('1')
    )
  })
})

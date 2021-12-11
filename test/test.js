const { ethers } = require('hardhat')
const { expect } = require('chai')
const ethersJS = require('ethers')

describe('Vesting Token', function () {
  let owner, alice, bob, vestingToken
  beforeEach(async function () {
    const VestingToken = await ethers.getContractFactory('VestingToken')
    ;[owner, alice, bob] = await ethers.getSigners()
    vestingToken = await VestingToken.deploy('Vesting Token', 'VT')
    await vestingToken.grantRole(vestingToken.BURNER_ROLE(), alice.address)

    vestingToken.approve(
      owner.address,
      ethersJS.ethers.utils.parseEther('9999999')
    )
    vestingToken
      .connect(owner)
      .approve(owner.address, ethersJS.ethers.utils.parseEther('9999999'))
    vestingToken
      .connect(alice)
      .approve(alice.address, ethersJS.ethers.utils.parseEther('9999999'))
    vestingToken
      .connect(bob)
      .approve(bob.address, ethersJS.ethers.utils.parseEther('9999999'))
  })

  // TEST BURN
  it('Test burn function', async () => {
    await vestingToken.burn(ethersJS.ethers.utils.parseEther('1'))
    expect(await vestingToken.balanceOf(owner.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('999999')
    )

    await vestingToken.transfer(
      alice.address,
      ethersJS.ethers.utils.parseEther('1')
    )
    await vestingToken
      .connect(alice)
      .burn(ethersJS.ethers.utils.parseEther('1'))
    expect(await vestingToken.balanceOf(alice.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('0')
    )

    await vestingToken.transfer(
      bob.address,
      ethersJS.ethers.utils.parseEther('1')
    )
    await expect(
      vestingToken.connect(bob).burn(ethersJS.ethers.utils.parseEther('1'))
    ).to.be.revertedWith('VestingToken: caller is not the burner')
  })

  // TEST CHANGE SCHEDULES
  it('Test change schedules function', async () => {
    // Change angel investor vesting time
    await vestingToken.changeInvestorsSchedules(259200, 345600) // 3 days and 4 days in seconds
    let angelInvestorInfo = await vestingToken.angelInvestor()
    expect(await angelInvestorInfo.cliffDuration).to.be.eq(259200)
    expect(await angelInvestorInfo.vestingDuration).to.be.eq(345600)

    // Change private sale vesting time
    await vestingToken.changePrivateSaleSchedules(172800, 518400) // 2 days and 6 days in seconds
    let privateSaleInfo = await vestingToken.privateSale()
    expect(await privateSaleInfo.cliffDuration).to.be.eq(172800)
    expect(await privateSaleInfo.vestingDuration).to.be.eq(518400)

    // Change public sale vesting time
    await vestingToken.changePublicSaleSchedules(432000, 864000) // 5 days and 10 days in seconds
    let publicSaleInfo = await vestingToken.publicSale()
    expect(await publicSaleInfo.cliffDuration).to.be.eq(432000)
    expect(await publicSaleInfo.vestingDuration).to.be.eq(864000)

    await expect(
      vestingToken.connect(alice).changePublicSaleSchedules(432000, 864000)
    ).to.be.revertedWith('VestingToken: caller is not the admin')
  })

  // TEST FOR ANGEL INVESTOR
  it('Test granted token and check getter function', async () => {
    await vestingToken.changeInvestorsSchedules(15, 86400) // Change vesting schedules for testing purpose
    await vestingToken.grantTokenToInvestor(
      alice.address,
      ethersJS.ethers.utils.parseEther('100')
    )
    expect(await vestingToken.balanceOf(alice.address)).to.be.eq(0)
    expect(await vestingToken.getGrantedAmount(alice.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('100')
    )

    expect(await vestingToken.getLockedAmount(alice.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('100')
    ) // By the time the contract vesting init, all token was locked in the contract

    const oneHour = 60 * 60
    await ethers.provider.send('evm_increaseTime', [15]) // Add 15 second to end cliff duration and started vesting duration
    await ethers.provider.send('evm_mine')

    expect(await vestingToken.getUnlockedAmount(alice.address)).to.be.eq('0') // By the time cliff duration end, token started to unlock, at this time the unlocked amount should be 0

    await ethers.provider.send('evm_increaseTime', [oneHour])
    await ethers.provider.send('evm_mine')

    expect(await vestingToken.getUnlockedAmount(alice.address)).to.be.eq(
      '4166666666666666666'
    ) //All token will be unlocked at => 100/(60 *60 *24) = ~0.0011574 token unlock per second
    // => Token unlocked in 1 hour = ~0.0011574 * 60 * 60 = ~41666666666666666667

    await expect(
      vestingToken.grantTokenToInvestor(
        bob.address,
        ethersJS.ethers.utils.parseEther('400000')
      )
    ).to.be.revertedWith('VestingToken: Exceed allowed amount') // Amount allowed for angel Investor is 400_000 token (total transfer is 400_100 so it failed)
  })

  //TEST FOR PRIVATE SALE (This test is identical to angel investor test)
  it('Test granted token and check getter function', async () => {
    await vestingToken.changePrivateSaleSchedules(15, 86400) // Change vesting schedules for testing purpose
    // Change angel investor vesting time
    await vestingToken.grantTokenToPrivateSale(
      alice.address,
      ethersJS.ethers.utils.parseEther('100')
    )
    expect(await vestingToken.balanceOf(alice.address)).to.be.eq(0)
    expect(await vestingToken.getGrantedAmount(alice.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('100')
    )

    expect(await vestingToken.getLockedAmount(alice.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('100')
    ) // By the time the contract vesting init, all token was locked in the contract

    const oneHour = 60 * 60
    await ethers.provider.send('evm_increaseTime', [15]) // Add 15 second to end cliff duration and started vesting duration
    await ethers.provider.send('evm_mine')

    expect(await vestingToken.getUnlockedAmount(alice.address)).to.be.eq('0') // By the time cliff duration end, token started to unlock, at this time the unlocked amount should be 0

    await ethers.provider.send('evm_increaseTime', [oneHour])
    await ethers.provider.send('evm_mine')

    expect(await vestingToken.getUnlockedAmount(alice.address)).to.be.eq(
      '4166666666666666666'
    ) //All token will be unlocked at => 100/(60 *60 *24) = ~0.0011574 token unlock per second
    // => Token unlocked in 1 hour = ~0.0011574 * 60 * 60 = ~41666666666666666667

    await expect(
      vestingToken.grantTokenToPrivateSale(
        bob.address,
        ethersJS.ethers.utils.parseEther('300000')
      )
    ).to.be.revertedWith('VestingToken: Exceed allowed amount') // Amount allowed for private sale is 300_000 token (total transfer is 300_100 so it failed)
  })

  //TEST PUBLIC SALE
  it('Test granted token and check getter function', async () => {
    await vestingToken.grantTokenToPublicSale(
      alice.address,
      ethersJS.ethers.utils.parseEther('100')
    )
    expect(await vestingToken.balanceOf(alice.address)).to.be.eq(0)
    expect(await vestingToken.getGrantedAmount(alice.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('100')
    )
    expect(await vestingToken.getLockedAmount(alice.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('0')
    ) // Token of public sale doesn't get locked, all will be unlocked right after transfer
    expect(await vestingToken.getUnlockedAmount(alice.address)).to.be.eq(
      ethersJS.ethers.utils.parseEther('100')
    )
    await expect(
      vestingToken.grantTokenToPrivateSale(
        bob.address,
        ethersJS.ethers.utils.parseEther('300000')
      )
    ).to.be.revertedWith('VestingToken: Exceed allowed amount') // Amount allowed for public sale is 300_000 token (total transfer is 300_100 so it failed)
  })

  //TEST CLAIM AND TRANSFER FUNCTION FOR ANGEL INVESTOR
  it('Test claim and transfer function', async () => {
    await vestingToken.changeInvestorsSchedules(15, 86400) // Change vesting schedules for testing purpose
    await vestingToken.grantTokenToInvestor(
      alice.address,
      ethersJS.ethers.utils.parseEther('100')
    )
    expect(await vestingToken.balanceOf(alice.address)).to.be.eq(0)

    const oneHour = 60 * 60
    await ethers.provider.send('evm_increaseTime', [15]) // Add 15 second to end cliff duration and started vesting duration
    await ethers.provider.send('evm_mine')

    await ethers.provider.send('evm_increaseTime', [oneHour])
    await ethers.provider.send('evm_mine')

    expect(await vestingToken.getUnlockedAmount(alice.address)).to.be.eq(
      '4166666666666666666'
    ) // This function return the total unlocked token
    expect(
      await vestingToken.pendingUnlockedTokenToClaim(alice.address)
    ).to.be.eq('4166666666666666666') //This function return pending token to claim
    await vestingToken.connect(alice).claimUnlockedToken() // By the time this function executed in this test, the time run more than 1 second so it add ~0.0011574 to the user balance
    expect(await vestingToken.balanceOf(alice.address)).to.be.eq(
      '4167824074074074074'
    ) //At this time the unlocked token is ~0.0011574 * 60 * 60 + ~0.0011574

    await ethers.provider.send('evm_increaseTime', [oneHour - 1]) // Advance one more hour (minus one second for the time this test run)
    await ethers.provider.send('evm_mine')

    expect(await vestingToken.getUnlockedAmount(alice.address)).to.be.eq(
      '8333333333333333333'
    )
    expect(
      await vestingToken.pendingUnlockedTokenToClaim(alice.address)
    ).to.be.eq('4165509259259259259') // Because the time is 59 minutes so the token unlock is actually ~0.0011574 * 60 * 59 + ~0.0011574 * 59

    await vestingToken.connect(alice).claimUnlockedToken()
    expect(await vestingToken.balanceOf(alice.address)).to.be.eq(
      '8334490740740740740'
    ) // 4167824074074074074 (old balance) + 4166666666666666666 (4165509259259259259 + ~0.0011574 (1 second has pass))

    await ethers.provider.send('evm_increaseTime', [1]) // Advance one second
    await ethers.provider.send('evm_mine')

    await vestingToken
      .connect(alice)
      .claimAndTransferUnlockedToken(bob.address, '8334490740740740741') // I add 0.00000000000000001 token at the end that exceed the old balance
    // It pass because before the transfer happen, this function will claim all the pending token for the msg.sender
  })
})

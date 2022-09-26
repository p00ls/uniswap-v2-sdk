import { Token, WETH9, Price, CurrencyAmount } from '@uniswap/sdk-core'
import { InsufficientInputAmountError } from '../errors'
import { computePairAddress, Pair } from './pair'

const FACTORY_ADDRESSES = {
  [1]: '0x4Eb4445EBc238080307A576Cee6B82baf39D5658',
  [3]: '0x0000000000000000000000000000000000000000'
}
const FACTORY_TEMPLATE_ADDRESSES = {
  [1]: '0x2EC05dbD2e7d6Ee00FAfB3045EaE880F10796f1D',
  [3]: '0x0000000000000000000000000000000000000000'
}

describe('computePairAddress', () => {
  const templateAddress = '0x2EC05dbD2e7d6Ee00FAfB3045EaE880F10796f1D'

  it('should correctly compute the pool address', () => {
    const factoryAddress = '0x4Eb4445EBc238080307A576Cee6B82baf39D5658'
    const tokenA = new Token(1, '0xa6aad04cd9a55881b4d10878fe035004bb36fc60', 18, '00', '00')
    const tokenB = new Token(1, '0xd6c0071b16183c4aa3316616e7b1ca6fc4468855', 18, 'IAM', 'IAM')

    const pairAddress = computePairAddress({ factoryAddress, templateAddress, tokenA, tokenB })

    expect(pairAddress).toEqual('0x23856cCDce686B65fF25e0c84D266aBf3E74693F')
  })
  it('should give same result regardless of token order', () => {
    const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC', 'USD Coin')
    const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'DAI Stablecoin')
    let tokenA = USDC
    let tokenB = DAI
    const resultA = computePairAddress({
      factoryAddress: '0x1111111111111111111111111111111111111111',
      templateAddress,
      tokenA,
      tokenB
    })

    tokenA = DAI
    tokenB = USDC
    const resultB = computePairAddress({
      factoryAddress: '0x1111111111111111111111111111111111111111',
      templateAddress,
      tokenA,
      tokenB
    })

    expect(resultA).toEqual(resultB)
  })
})

describe('Pair', () => {
  const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC', 'USD Coin')
  const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'DAI Stablecoin')

  describe('constructor', () => {
    it('cannot be used for tokens on different chains', () => {
      expect(
        () =>
          new Pair(
            CurrencyAmount.fromRawAmount(USDC, '100'),
            CurrencyAmount.fromRawAmount(WETH9[3], '100'),
            FACTORY_ADDRESSES,
            FACTORY_TEMPLATE_ADDRESSES
          )
      ).toThrow('CHAIN_IDS')
    })
  })

  describe('#getAddress', () => {
    it('returns the correct address', () => {
      expect(Pair.getAddress(USDC, DAI, FACTORY_ADDRESSES, FACTORY_TEMPLATE_ADDRESSES)).toEqual(
        '0x5AdCab8C433647dC34a7eD1E3C8A23E190255D94'
      )
    })
  })

  describe('#token0', () => {
    it('always is the token that sorts before', () => {
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(USDC, '100'),
          CurrencyAmount.fromRawAmount(DAI, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).token0
      ).toEqual(DAI)
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '100'),
          CurrencyAmount.fromRawAmount(USDC, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).token0
      ).toEqual(DAI)
    })
  })
  describe('#token1', () => {
    it('always is the token that sorts after', () => {
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(USDC, '100'),
          CurrencyAmount.fromRawAmount(DAI, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).token1
      ).toEqual(USDC)
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '100'),
          CurrencyAmount.fromRawAmount(USDC, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).token1
      ).toEqual(USDC)
    })
  })
  describe('#reserve0', () => {
    it('always comes from the token that sorts before', () => {
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(USDC, '100'),
          CurrencyAmount.fromRawAmount(DAI, '101'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).reserve0
      ).toEqual(CurrencyAmount.fromRawAmount(DAI, '101'))
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '101'),
          CurrencyAmount.fromRawAmount(USDC, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).reserve0
      ).toEqual(CurrencyAmount.fromRawAmount(DAI, '101'))
    })
  })
  describe('#reserve1', () => {
    it('always comes from the token that sorts after', () => {
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(USDC, '100'),
          CurrencyAmount.fromRawAmount(DAI, '101'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).reserve1
      ).toEqual(CurrencyAmount.fromRawAmount(USDC, '100'))
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '101'),
          CurrencyAmount.fromRawAmount(USDC, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).reserve1
      ).toEqual(CurrencyAmount.fromRawAmount(USDC, '100'))
    })
  })

  describe('#token0Price', () => {
    it('returns price of token0 in terms of token1', () => {
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(USDC, '101'),
          CurrencyAmount.fromRawAmount(DAI, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).token0Price
      ).toEqual(new Price(DAI, USDC, '100', '101'))
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '100'),
          CurrencyAmount.fromRawAmount(USDC, '101'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).token0Price
      ).toEqual(new Price(DAI, USDC, '100', '101'))
    })
  })

  describe('#token1Price', () => {
    it('returns price of token1 in terms of token0', () => {
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(USDC, '101'),
          CurrencyAmount.fromRawAmount(DAI, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).token1Price
      ).toEqual(new Price(USDC, DAI, '101', '100'))
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '100'),
          CurrencyAmount.fromRawAmount(USDC, '101'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).token1Price
      ).toEqual(new Price(USDC, DAI, '101', '100'))
    })
  })

  describe('#priceOf', () => {
    const pair = new Pair(
      CurrencyAmount.fromRawAmount(USDC, '101'),
      CurrencyAmount.fromRawAmount(DAI, '100'),
      FACTORY_ADDRESSES,
      FACTORY_TEMPLATE_ADDRESSES
    )
    it('returns price of token in terms of other token', () => {
      expect(pair.priceOf(DAI)).toEqual(pair.token0Price)
      expect(pair.priceOf(USDC)).toEqual(pair.token1Price)
    })

    it('throws if invalid token', () => {
      expect(() => pair.priceOf(WETH9[1])).toThrow('TOKEN')
    })
  })

  describe('#reserveOf', () => {
    it('returns reserves of the given token', () => {
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(USDC, '100'),
          CurrencyAmount.fromRawAmount(DAI, '101'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).reserveOf(USDC)
      ).toEqual(CurrencyAmount.fromRawAmount(USDC, '100'))
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '101'),
          CurrencyAmount.fromRawAmount(USDC, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).reserveOf(USDC)
      ).toEqual(CurrencyAmount.fromRawAmount(USDC, '100'))
    })

    it('throws if not in the pair', () => {
      expect(() =>
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '101'),
          CurrencyAmount.fromRawAmount(USDC, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).reserveOf(WETH9[1])
      ).toThrow('TOKEN')
    })
  })

  describe('#chainId', () => {
    it('returns the token0 chainId', () => {
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(USDC, '100'),
          CurrencyAmount.fromRawAmount(DAI, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).chainId
      ).toEqual(1)
      expect(
        new Pair(
          CurrencyAmount.fromRawAmount(DAI, '100'),
          CurrencyAmount.fromRawAmount(USDC, '100'),
          FACTORY_ADDRESSES,
          FACTORY_TEMPLATE_ADDRESSES
        ).chainId
      ).toEqual(1)
    })
  })
  describe('#involvesToken', () => {
    expect(
      new Pair(
        CurrencyAmount.fromRawAmount(USDC, '100'),
        CurrencyAmount.fromRawAmount(DAI, '100'),
        FACTORY_ADDRESSES,
        FACTORY_TEMPLATE_ADDRESSES
      ).involvesToken(USDC)
    ).toEqual(true)
    expect(
      new Pair(
        CurrencyAmount.fromRawAmount(USDC, '100'),
        CurrencyAmount.fromRawAmount(DAI, '100'),
        FACTORY_ADDRESSES,
        FACTORY_TEMPLATE_ADDRESSES
      ).involvesToken(DAI)
    ).toEqual(true)
    expect(
      new Pair(
        CurrencyAmount.fromRawAmount(USDC, '100'),
        CurrencyAmount.fromRawAmount(DAI, '100'),
        FACTORY_ADDRESSES,
        FACTORY_TEMPLATE_ADDRESSES
      ).involvesToken(WETH9[1])
    ).toEqual(false)
  })
  describe('miscellaneous', () => {
    it('getLiquidityMinted:0', async () => {
      const tokenA = new Token(3, '0x0000000000000000000000000000000000000001', 18)
      const tokenB = new Token(3, '0x0000000000000000000000000000000000000002', 18)
      const pair = new Pair(
        CurrencyAmount.fromRawAmount(tokenA, '0'),
        CurrencyAmount.fromRawAmount(tokenB, '0'),
        FACTORY_ADDRESSES,
        FACTORY_TEMPLATE_ADDRESSES
      )

      expect(() => {
        pair.getLiquidityMinted(
          CurrencyAmount.fromRawAmount(pair.liquidityToken, '0'),
          CurrencyAmount.fromRawAmount(tokenA, '1000'),
          CurrencyAmount.fromRawAmount(tokenB, '1000')
        )
      }).toThrow(InsufficientInputAmountError)

      expect(() => {
        pair.getLiquidityMinted(
          CurrencyAmount.fromRawAmount(pair.liquidityToken, '0'),
          CurrencyAmount.fromRawAmount(tokenA, '1000000'),
          CurrencyAmount.fromRawAmount(tokenB, '1')
        )
      }).toThrow(InsufficientInputAmountError)

      const liquidity = pair.getLiquidityMinted(
        CurrencyAmount.fromRawAmount(pair.liquidityToken, '0'),
        CurrencyAmount.fromRawAmount(tokenA, '1001'),
        CurrencyAmount.fromRawAmount(tokenB, '1001')
      )

      expect(liquidity.quotient.toString()).toEqual('1')
    })

    it('getLiquidityMinted:!0', async () => {
      const tokenA = new Token(3, '0x0000000000000000000000000000000000000001', 18)
      const tokenB = new Token(3, '0x0000000000000000000000000000000000000002', 18)
      const pair = new Pair(
        CurrencyAmount.fromRawAmount(tokenA, '10000'),
        CurrencyAmount.fromRawAmount(tokenB, '10000'),
        FACTORY_ADDRESSES,
        FACTORY_TEMPLATE_ADDRESSES
      )

      expect(
        pair
          .getLiquidityMinted(
            CurrencyAmount.fromRawAmount(pair.liquidityToken, '10000'),
            CurrencyAmount.fromRawAmount(tokenA, '2000'),
            CurrencyAmount.fromRawAmount(tokenB, '2000')
          )
          .quotient.toString()
      ).toEqual('2000')
    })

    it('getLiquidityValue:!feeOn', async () => {
      const tokenA = new Token(3, '0x0000000000000000000000000000000000000001', 18)
      const tokenB = new Token(3, '0x0000000000000000000000000000000000000002', 18)
      const pair = new Pair(
        CurrencyAmount.fromRawAmount(tokenA, '1000'),
        CurrencyAmount.fromRawAmount(tokenB, '1000'),
        FACTORY_ADDRESSES,
        FACTORY_TEMPLATE_ADDRESSES
      )

      {
        const liquidityValue = pair.getLiquidityValue(
          tokenA,
          CurrencyAmount.fromRawAmount(pair.liquidityToken, '1000'),
          CurrencyAmount.fromRawAmount(pair.liquidityToken, '1000'),
          false
        )
        expect(liquidityValue.currency.equals(tokenA)).toBe(true)
        expect(liquidityValue.quotient.toString()).toBe('1000')
      }

      // 500
      {
        const liquidityValue = pair.getLiquidityValue(
          tokenA,
          CurrencyAmount.fromRawAmount(pair.liquidityToken, '1000'),
          CurrencyAmount.fromRawAmount(pair.liquidityToken, '500'),
          false
        )
        expect(liquidityValue.currency.equals(tokenA)).toBe(true)
        expect(liquidityValue.quotient.toString()).toBe('500')
      }

      // tokenB
      {
        const liquidityValue = pair.getLiquidityValue(
          tokenB,
          CurrencyAmount.fromRawAmount(pair.liquidityToken, '1000'),
          CurrencyAmount.fromRawAmount(pair.liquidityToken, '1000'),
          false
        )
        expect(liquidityValue.currency.equals(tokenB)).toBe(true)
        expect(liquidityValue.quotient.toString()).toBe('1000')
      }
    })

    it('getLiquidityValue:feeOn', async () => {
      const tokenA = new Token(3, '0x0000000000000000000000000000000000000001', 18)
      const tokenB = new Token(3, '0x0000000000000000000000000000000000000002', 18)
      const pair = new Pair(
        CurrencyAmount.fromRawAmount(tokenA, '1000'),
        CurrencyAmount.fromRawAmount(tokenB, '1000'),
        FACTORY_ADDRESSES,
        FACTORY_TEMPLATE_ADDRESSES
      )

      const liquidityValue = pair.getLiquidityValue(
        tokenA,
        CurrencyAmount.fromRawAmount(pair.liquidityToken, '500'),
        CurrencyAmount.fromRawAmount(pair.liquidityToken, '500'),
        true,
        '250000' // 500 ** 2
      )
      expect(liquidityValue.currency.equals(tokenA)).toBe(true)
      expect(liquidityValue.quotient.toString()).toBe('917') // ceiling(1000 - (500 * (1 / 6)))
    })
  })
})

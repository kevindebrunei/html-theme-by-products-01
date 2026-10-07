import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractClubOrTheme,
  resolveUpsellBundle,
  calculateBundlePricing,
} from './upsell.mjs'

const mockProducts = [
  {
    sku: 'SNK-PHI-001',
    handle: 'shoes-nfl-philadelphia-eagles-snk-20260923-xi-010',
    type: 'Shoes',
    price: 89.95,
    title: 'Eagles Sneaker',
    images: ['/products/Shoes/NFL/NFL-%20Philadelphia-Eagles/01.webp']
  },
  {
    sku: 'CAP-PHI-001',
    handle: 'cap-nfl-philadelphia-eagles-cap-20260923-uy-016',
    type: 'Cap',
    price: 39.95,
    title: 'Eagles Cap',
    images: ['/products/Cap/NFL/NFL-%20Philadelphia-Eagles/01.webp']
  },
  {
    sku: 'BP-PHI-001',
    handle: 'backpack-nfl-philadelphia-eagles-bp-20260923-xi-024',
    type: 'Backpack',
    price: 49.95,
    title: 'Eagles Backpack',
    images: ['/products/Backpack/NFL/NFL-%20Philadelphia-Eagles/01.webp']
  },
  {
    sku: 'TUM-BUF-001',
    handle: 'tumbler-40oz-nfl-buffalo-bills-tum-001',
    type: 'Tumbler',
    price: 49.95,
    title: 'Bills Tumbler',
    images: ['/products/Tumbler/NFL/NFL-%20Buffalo-Bills/01.webp']
  },
  {
    sku: 'CAP-DET-001',
    handle: 'cap-nfl-detroit-lions-cap-20260923-uy-021',
    type: 'Cap',
    price: 39.95,
    title: 'Lions Cap',
    images: ['/products/Cap/NFL/NFL-%20Detroit-Lions/01.webp']
  }
]

test('extractClubOrTheme parses club correctly', () => {
  assert.equal(extractClubOrTheme(mockProducts[0]), 'philadelphia-eagles')
  assert.equal(extractClubOrTheme(mockProducts[4]), 'detroit-lions')
})

test('resolveUpsellBundle matches club priority when 2 companions available', () => {
  const bundle = resolveUpsellBundle(mockProducts[0], mockProducts)
  assert.equal(bundle.companions.length, 2)
  const types = bundle.companions.map((c) => c.product.type)
  assert.ok(types.includes('Cap'))
  assert.ok(types.includes('Backpack'))
  assert.equal(bundle.discountPercent, 10)
})

test('calculateBundlePricing applies 10% discount when companions are checked', () => {
  const checked = [
    { price: 89.95 },
    { price: 39.95 },
    { price: 49.95 }
  ]
  const result = calculateBundlePricing(checked, 0.10)
  assert.equal(result.originalTotal, 179.85)
  assert.equal(result.discountedTotal, 161.88)
  assert.equal(result.savingsTotal, 17.97)
  assert.equal(result.isDiscounted, true)
})

test('calculateBundlePricing applies 0% discount when only main item is checked', () => {
  const checked = [{ price: 89.95 }]
  const result = calculateBundlePricing(checked, 0.10)
  assert.equal(result.originalTotal, 89.95)
  assert.equal(result.discountedTotal, 89.95)
  assert.equal(result.savingsTotal, 0)
  assert.equal(result.isDiscounted, false)
})

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const productsPath = join(__dirname, '../../../products/products.json')
const realProducts = JSON.parse(readFileSync(productsPath, 'utf8')).products

test('real catalog: Philadelphia Eagles Shoes bundles Cap and Backpack', () => {
  const eaglesShoes = realProducts.find((p) => p.sku === 'SNK-20260923-XI-010')
  assert.ok(eaglesShoes)
  const bundle = resolveUpsellBundle(eaglesShoes, realProducts)
  assert.equal(bundle.companions.length, 2)
  const companionTypes = bundle.companions.map((c) => c.product.type)
  assert.ok(companionTypes.includes('Cap'))
  assert.ok(companionTypes.includes('Backpack'))
  assert.equal(bundle.ensembleTitle, 'The Philadelphia Eagles Ensemble')
})

test('real catalog: Buffalo Bills Backpack bundles Cap and Tumbler companion', () => {
  const billsBp = realProducts.find((p) => p.sku === 'BP-20260923-XI-020')
  assert.ok(billsBp)
  const bundle = resolveUpsellBundle(billsBp, realProducts)
  assert.equal(bundle.companions.length, 2)
  const companionTypes = bundle.companions.map((c) => c.product.type)
  assert.ok(companionTypes.includes('Cap'))
  assert.ok(companionTypes.includes('Tumbler'))
})

test('real catalog: Detroit Lions Cap falls back to 2 distinct Curated items', () => {
  const lionsCap = realProducts.find((p) => p.sku === 'CAP-20260923-UY-021')
  assert.ok(lionsCap)
  const bundle = resolveUpsellBundle(lionsCap, realProducts)
  assert.equal(bundle.companions.length, 2)
  const companionTypes = bundle.companions.map((c) => c.product.type)
  // Should have Tumbler and Backpack from Curated
  assert.equal(new Set(companionTypes).size, 2)
  assert.ok(!companionTypes.includes('Cap'))
})

test('edge cases: null or empty inputs return null or safe bundle', () => {
  assert.equal(resolveUpsellBundle(null, realProducts), null)
  assert.equal(extractClubOrTheme(null), null)
  const fallback = resolveUpsellBundle(mockProducts[0], [])
  assert.equal(fallback.companions.length, 0)
})


/*
  upsell.mjs — Logic ghép cặp và tính giá bundle upsell cho PDP Goldbourne & Co.
  Module thuần, không chạm DOM, test được bằng node:test.
*/
import { CURATED } from './catalog.mjs'

const CLUB_REGEX = /(?:backpack|cap|shoes|tumbler-40oz)-[a-z0-9]+-([a-z0-9-]+?)-(?:bp|cap|snk|tum|\d)/i

export function extractClubOrTheme(product) {
  if (!product) return null
  const handle = String(product.handle ?? '')
  const match = handle.match(CLUB_REGEX)
  if (match && match[1]) {
    return match[1].replace(/-christmas|-halloween/gi, '').toLowerCase()
  }
  const img = (product.images ?? [])[0] ?? ''
  const parts = img.split('/')
  if (parts.length > 4) {
    return parts[4].toLowerCase().replace(/^[a-z0-9]+-+/i, '').replace(/%20/g, '-').trim()
  }
  return null
}

export function calculateBundlePricing(checkedItems, discountRate = 0.10) {
  const items = checkedItems ?? []
  const originalTotal = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0)

  if (items.length <= 1) {
    const orig = Math.round(originalTotal * 100) / 100
    return {
      originalTotal: orig,
      discountedTotal: orig,
      savingsTotal: 0,
      isDiscounted: false,
    }
  }

  const discountedTotal = items.reduce((sum, it) => {
    const discounted = Math.round((Number(it.price) || 0) * (1 - discountRate) * 100) / 100
    return sum + discounted
  }, 0)

  const orig = Math.round(originalTotal * 100) / 100
  const disc = Math.round(discountedTotal * 100) / 100
  const savings = Math.round((orig - disc) * 100) / 100

  return {
    originalTotal: orig,
    discountedTotal: disc,
    savingsTotal: savings,
    isDiscounted: true,
  }
}

export function resolveUpsellBundle(currentProduct, allProducts = []) {
  if (!currentProduct) return null
  const club = extractClubOrTheme(currentProduct)
  const companions = []
  const pickedSkus = new Set([currentProduct.sku])
  const pickedTypes = new Set([currentProduct.type])

  // Tier 1: Matching Club
  if (club) {
    const clubCandidates = allProducts.filter((p) => {
      if (pickedSkus.has(p.sku) || pickedTypes.has(p.type)) return false
      return extractClubOrTheme(p) === club
    })

    for (const cand of clubCandidates) {
      if (companions.length >= 2) break
      companions.push({
        product: cand,
        role: 'matching-club',
        badge: 'Matching Silhouette',
      })
      pickedSkus.add(cand.sku)
      pickedTypes.add(cand.type)
    }
  }

  // Tier 2: Utility Pair (Backpack + Tumbler)
  if (companions.length < 2) {
    const targetType = currentProduct.type === 'Backpack' ? 'Tumbler' : (currentProduct.type === 'Tumbler' ? 'Backpack' : null)
    if (targetType && !pickedTypes.has(targetType)) {
      const utilCand = allProducts.find((p) => p.type === targetType && !pickedSkus.has(p.sku))
      if (utilCand) {
        companions.push({
          product: utilCand,
          role: 'utility-pair',
          badge: 'Daily Utility Companion',
        })
        pickedSkus.add(utilCand.sku)
        pickedTypes.add(utilCand.type)
      }
    }
  }

  // Tier 3: Curated Vault Fallback
  if (companions.length < 2) {
    const bySku = new Map(allProducts.map((p) => [p.sku, p]))
    for (const sku of CURATED) {
      if (companions.length >= 2) break
      const item = bySku.get(sku)
      if (item && !pickedSkus.has(item.sku) && !pickedTypes.has(item.type)) {
        companions.push({
          product: item,
          role: 'curated-vault',
          badge: 'Curated Complement',
        })
        pickedSkus.add(item.sku)
        pickedTypes.add(item.type)
      }
    }
  }

  // Final fallback if distinct types were exhausted
  if (companions.length < 2) {
    for (const p of allProducts) {
      if (companions.length >= 2) break
      if (!pickedSkus.has(p.sku)) {
        companions.push({
          product: p,
          role: 'curated-vault',
          badge: 'Curated Complement',
        })
        pickedSkus.add(p.sku)
      }
    }
  }

  let ensembleTitle = 'The Complete Ensemble'
  let ensembleSubtitle = 'Architecturally aligned artifacts tailored for unified ritual and elevated presence. Save 10% on the complete selection.'
  if (club) {
    const clubFormatted = club.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    ensembleTitle = `The ${clubFormatted} Ensemble`
    ensembleSubtitle = `Unified matchday regalia cast in gilded relief. Acquire the complete syndicate for a complimentary 10% consignment privilege.`
  }

  return {
    mainProduct: currentProduct,
    companions,
    ensembleTitle,
    ensembleSubtitle,
    discountPercent: 10,
  }
}

import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv, toRecords } from './csv.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..')
const CSV_PATH = join(REPO_ROOT, 'products', 'shopify-products-20260928-1542.csv')
const OUT_PATH = join(REPO_ROOT, 'products', 'products.json')
const SKU_PATTERN = /^(BP|CAP|SNK|TUM)-\d{8}-[A-Z]{2}-\d{3}$/
const CHRISTMAS_WORDS = ['christmas', 'holiday', 'nutcracker', 'winter']

export function deriveSeason(record) {
  if (record.Type !== 'Tumbler') return 'Year-round'
  const blob = `${record['URL handle']} ${record.Title} ${record.Tags}`.toLowerCase()
  return CHRISTMAS_WORDS.some((w) => blob.includes(w)) ? 'Christmas' : 'Halloween'
}

export function deriveLeagueLabel(collection) {
  const league = collection.split(' ').slice(1).join(' ')
  return league === 'Halloween' ? 'No team' : league
}

function parseBody(html) {
  const hookMatch = html.match(/^<p>(.*?)<\/p>/s)
  const hook = hookMatch ? hookMatch[1] : ''
  const sections = []
  const re = /<h3>(.*?)<\/h3>(.*?)(?=<h3>|$)/gs
  let m
  while ((m = re.exec(html)) !== null) {
    sections.push({
      heading: m[1].replace(/&amp;/g, '&').trim(),
      html: m[2].trim(),
    })
  }
  return { hook, sections }
}

function skuFromHandle(handle) {
  const m = handle.match(/((?:bp|cap|snk|tum)-\d{8}-[a-z]{2}-\d{3})$/)
  return m ? m[1].toUpperCase() : null
}

/*
  Trả về path TƯƠNG ĐỐI so với `base`, không phải tuyệt đối — vì giá trị này
  đi thẳng vào thuộc tính src của thẻ img trong trình duyệt.
*/
export function indexSkuDirs(rootDir, base = rootDir) {
  const index = new Map()
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (!statSync(full).isDirectory()) continue
      if (SKU_PATTERN.test(entry)) index.set(entry, relative(base, full).replace(/\\/g, '/'))
      else walk(full)
    }
  }
  walk(rootDir)
  return index
}

export function buildProducts(csvText, skuDirIndex) {
  const records = toRecords(parseCsv(csvText))
  const byHandle = new Map()

  for (const rec of records) {
    const handle = rec['URL handle']
    if (!handle) continue
    if (!byHandle.has(handle)) byHandle.set(handle, { base: null, rows: [] })
    const bucket = byHandle.get(handle)
    if (rec.Title) bucket.base = rec
    bucket.rows.push(rec)
  }

  const products = []
  for (const [handle, { base, rows }] of byHandle) {
    if (!base) continue
    const sku = skuFromHandle(handle)
    const dir = sku ? skuDirIndex.get(sku) : null

    const variants = rows
      .filter((r) => r['Variant Price'])
      .map((r) => ({
        value: r['Option1 Value'] === 'Default Title' ? null : r['Option1 Value'],
        price: Number(r['Variant Price']),
        compareAt: r['Variant Compare At Price'] ? Number(r['Variant Compare At Price']) : null,
      }))

    const imageCount = rows.filter((r) => r['Image Src']).length
    const images = dir
      ? Array.from({ length: imageCount }, (_, i) =>
          encodeURI('/' + join(dir, String(i + 1).padStart(2, '0') + '.webp').replace(/\\/g, '/')))
      : []

    const { hook, sections } = parseBody(base['Body (HTML)'])
    const optionName = base['Option1 Name']

    products.push({
      handle,
      sku,
      title: base.Title,
      seoTitle: base['SEO Title'],
      type: base.Type,
      league: base.Collection.split(' ').slice(1).join(' '),
      leagueLabel: deriveLeagueLabel(base.Collection),
      season: deriveSeason(base),
      price: variants.length ? variants[0].price : null,
      compareAt: variants.length ? variants[0].compareAt : null,
      variantLabel: optionName && optionName !== 'Title' ? optionName : null,
      variants,
      images,
      hook,
      sections,
    })
  }
  return products
}

function main() {
  const csvText = readFileSync(CSV_PATH, 'utf8')
  const index = indexSkuDirs(join(REPO_ROOT, 'products'), REPO_ROOT)
  const products = buildProducts(csvText, index)
  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: products.length,
    products,
  }, null, 2))
  console.log(`Đã ghi ${products.length} sản phẩm vào ${OUT_PATH}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()

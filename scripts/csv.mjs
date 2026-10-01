export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let started = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
      continue
    }
    if (c === '"') { inQuotes = true; started = true }
    else if (c === ',') { row.push(field); field = ''; started = true }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; started = false }
    else if (c !== '\r') { field += c; started = true }
  }
  if (started || field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

export function toRecords(rows) {
  if (rows.length === 0) return []
  const [header, ...body] = rows
  return body.map((cells) => {
    const rec = {}
    header.forEach((key, i) => { rec[key] = cells[i] ?? '' })
    return rec
  })
}

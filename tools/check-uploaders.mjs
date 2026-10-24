#!/usr/bin/env node
// check-uploaders — lock on the two receipt uploaders (24.10; owner's words 23.10 §L18 «one receipt = one record», 24.10 11:39 «рабочий загрузчик один —
// purchasing-app.html»). Run before every push: `node tools/check-uploaders.mjs` → exit 0 «uploaders: locked» or exit 1 with the broken rule in words.
//   purchasing-app.html (the working uploader, office purchasing) and index.html (the earlier path, still used by the Highland Heights director):
//   • several photos ask «Is this one receipt or several?» with the three answers; • one record per receipt (a loop over groups);
//   • the receipt date is never stamped by the browser (no toISOString in the submit path) — the server door stamps the organization's day;
//   • the success text promises the reader «right away … within the hour» (the wake-up lives in the base trigger, not in this page).
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errs = []
const rules = {
  'purchasing-app.html': { submit: /function rcSubmitWith[\s\S]*?function rcShowSuccess/, door: "rpc('submit_receipt_full'", loop: /const groups = how === 'several' \? filePaths\.map\(p => \[p\]\) : \[filePaths\]/ },
  'index.html':          { submit: /async function submitWith[\s\S]*?function showSuccess/, door: '/functions/v1/upload-receipt', loop: /const groups = how === 'several' \? filePaths\.map\(p => \[p\]\) : \[filePaths\]/ },
}
for (const [file, r] of Object.entries(rules)) {
  const s = readFileSync(resolve(root, file), 'utf8')
  const must = (ok, why) => { if (!ok) errs.push(`${file}: ${why}`) }
  must(s.includes('Is this one receipt or several?'), 'the question «Is this one receipt or several?» is missing')
  must(s.includes('One receipt (several pages)') && s.includes('Several receipts — save each separately'), 'the two answers are missing')
  must(s.includes('One receipt = one record on the cost worksheet.'), 'the §L18 sentence under the question is missing')
  const sub = s.match(r.submit)?.[0]
  must(!!sub, 'the submit path was not found (function renamed?)')
  if (sub) {
    must(!/toISOString|receipt_date:\s*(?!null\b)\S/.test(sub), 'the browser stamps the receipt date — the server door must stamp the organization day')
    must(sub.includes(r.door), `the submit path no longer calls its door (${r.door})`)
    must(r.loop.test(sub), 'one record per receipt: the groups loop is missing')
  }
}
if (errs.length) { console.error('uploaders: BROKEN\n - ' + errs.join('\n - ')); process.exit(1) }
console.log('uploaders: locked (2 pages · question · one record per receipt · server day)')

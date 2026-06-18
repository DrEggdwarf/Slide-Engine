// Définit le mot de passe de la régie dans .env (non versionné).
// Usage : npm run password -- "mon-mot-de-passe"
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pw = process.argv.slice(2).join(' ').trim()
if (!pw) {
  console.error('Usage : npm run password -- "ton-mot-de-passe"')
  process.exit(1)
}

const path = fileURLToPath(new URL('../.env', import.meta.url))
const lines = existsSync(path) ? readFileSync(path, 'utf8').split('\n').filter((l) => !l.trim().startsWith('PRESENTER_PASSWORD=')) : []
while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
lines.push(`PRESENTER_PASSWORD="${pw.replace(/"/g, '\\"')}"`)
writeFileSync(path, lines.join('\n') + '\n')
console.log('Mot de passe régie enregistré dans .env (ignoré par git). Relance le serveur pour l\'appliquer.')

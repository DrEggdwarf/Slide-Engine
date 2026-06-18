// Charge .env dans process.env (effet de bord à l'import — sans dépendance).
// À IMPORTER EN PREMIER (avant auth.js) pour que le mot de passe soit pris en compte.
// N'écrase jamais une variable déjà définie → en prod, l'env Kamal a la priorité.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

try {
  const path = fileURLToPath(new URL('../.env', import.meta.url))
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    if (process.env[key] === undefined) process.env[key] = val
  }
} catch { /* pas de .env → on ignore (l'env système suffit) */ }

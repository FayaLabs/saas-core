#!/usr/bin/env node

/**
 * saas-core migration sync
 *
 * Copies core migrations from @fayz/saas-core into the SaaS project's
 * supabase/migrations/ folder (prefixed with 0000x_ to run before project migrations).
 * Then runs `supabase db push` to apply them.
 *
 * Usage in package.json:
 *   "scripts": {
 *     "migrate": "node node_modules/@fayz/saas-core/scripts/migrate.mjs && supabase db push",
 *     "dev": "npm run migrate && vite --port 5182"
 *   }
 *
 * Or for local dev with linked saas-core:
 *   "dev": "node ../saas-core/scripts/migrate.mjs && vite --port 5182"
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cwd = process.cwd()

// Core migrations source (from saas-core package)
const coreMigrationsDir = resolve(__dirname, '..', 'supabase', 'migrations')

// Target: the SaaS project's supabase/migrations folder
const targetDir = resolve(cwd, 'supabase', 'migrations')

if (!existsSync(coreMigrationsDir)) {
  console.log('[migrate] No core migrations found at', coreMigrationsDir)
  process.exit(0)
}

// Ensure target directory exists
mkdirSync(targetDir, { recursive: true })

// Get existing files in target to avoid duplicates
const existingFiles = new Set(readdirSync(targetDir))

// Copy core migrations with a `core_` prefix to distinguish from project migrations
const coreFiles = readdirSync(coreMigrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

let copied = 0
for (const file of coreFiles) {
  const targetName = `core_${file}`

  if (existingFiles.has(targetName)) {
    continue // Already copied
  }

  const src = resolve(coreMigrationsDir, file)
  const dst = resolve(targetDir, targetName)

  copyFileSync(src, dst)
  copied++
  console.log(`[migrate] Copied: ${file} → ${targetName}`)
}

if (copied === 0) {
  console.log('[migrate] Core migrations already synced')
} else {
  console.log(`[migrate] Synced ${copied} core migration(s)`)
}

console.log('[migrate] Run "supabase db push" to apply migrations')

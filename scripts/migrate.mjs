#!/usr/bin/env node

/**
 * saas-core migration sync + push
 *
 * 1. Copies core migrations from saas-core to the SaaS project's supabase/migrations/
 * 2. Runs `supabase db push` using SUPABASE_ACCESS_TOKEN
 *
 * Env:
 *   SUPABASE_ACCESS_TOKEN or SUPABASE_MANAGEMENT_TOKEN (from saas-core/.env)
 *   VITE_SUPABASE_URL (from SaaS project .env — extracts project ref)
 */

import { readFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

const projectDir = process.argv.includes('--project-dir')
  ? resolve(process.argv[process.argv.indexOf('--project-dir') + 1])
  : process.cwd()

// Load envs
loadEnv(resolve(__dirname, '..', '.env'))  // saas-core (for token)
loadEnv(resolve(projectDir, '.env'))        // SaaS project (for VITE_SUPABASE_URL)

// Step 1: Sync core migrations
const coreDir = resolve(__dirname, '..', 'supabase', 'migrations')
const targetDir = resolve(projectDir, 'supabase', 'migrations')

if (existsSync(coreDir)) {
  mkdirSync(targetDir, { recursive: true })

  for (const f of readdirSync(coreDir).filter(f => f.endsWith('.sql')).sort()) {
    const src = resolve(coreDir, f)
    const dst = resolve(targetDir, f)
    const srcContent = readFileSync(src, 'utf-8')
    const dstContent = existsSync(dst) ? readFileSync(dst, 'utf-8') : null

    if (srcContent !== dstContent) {
      copyFileSync(src, dst)
      console.log(`[migrate] ${dstContent === null ? '+' : '~'} ${f}`)
    }
  }
}

// Step 2: supabase db push
const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MANAGEMENT_TOKEN
const url = process.env.VITE_SUPABASE_URL
if (!token || !url) {
  console.log('[migrate] No token or VITE_SUPABASE_URL — skipping push')
  process.exit(0)
}

const ref = url.replace('https://', '').split('.')[0]

// Ensure supabase init + link
if (!existsSync(resolve(projectDir, 'supabase', 'config.toml'))) {
  execSync('npx supabase init', { cwd: projectDir, stdio: 'inherit' })
}

try {
  execSync(`npx supabase link --project-ref ${ref}`, {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  })
} catch {}

try {
  execSync('npx supabase db push', {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  })
} catch (e) {
  console.error('[migrate] db push had issues — some migrations may need repair')
}

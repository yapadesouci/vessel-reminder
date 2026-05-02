#!/usr/bin/env node
import { execSync } from 'child_process'
import { mkdirSync, existsSync, unlinkSync, copyFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'dist')
const outFile = resolve(outDir, 'vessel-reminder.zip')

const sdkDir = resolve(root, 'sdk')
if (!existsSync(sdkDir)) mkdirSync(sdkDir)
copyFileSync(
  resolve(root, 'node_modules/@vessel-aircodr/sdk/dist/bundle.js'),
  resolve(sdkDir, 'index.js')
)

if (!existsSync(outDir)) mkdirSync(outDir)
if (existsSync(outFile)) unlinkSync(outFile)

execSync(`zip -r "${outFile}" manifest.json sdk/ apps/`, { cwd: root, stdio: 'inherit' })
console.log(`\nBuilt: dist/vessel-reminder.zip`)

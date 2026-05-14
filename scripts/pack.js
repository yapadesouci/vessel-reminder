#!/usr/bin/env node
import { execSync } from 'child_process'
import { mkdirSync, existsSync, unlinkSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'dist')
const outFile = resolve(outDir, 'reminder.zip')

if (!existsSync(outDir)) mkdirSync(outDir)
if (existsSync(outFile)) unlinkSync(outFile)

execSync(`zip -r "${outFile}" manifest.json apps/`, { cwd: root, stdio: 'inherit' })
console.log(`\nBuilt: dist/reminder.zip`)

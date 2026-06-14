#!/usr/bin/env node
// Runs `npm install` in every Lovable project under assets/lovable/
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const lovableDir = path.join(__dirname, '../assets/lovable');

if (!fs.existsSync(lovableDir)) {
  console.log('No assets/lovable directory found — skipping.');
  process.exit(0);
}

const projects = fs.readdirSync(lovableDir).filter(e =>
  fs.existsSync(path.join(lovableDir, e, 'package.json'))
);

if (projects.length === 0) {
  console.log('No Lovable projects found.');
  process.exit(0);
}

console.log(`Installing dependencies for ${projects.length} Lovable projects...\n`);
let failed = 0;
for (const proj of projects) {
  const cwd = path.join(lovableDir, proj);
  process.stdout.write(`  → ${proj} ... `);
  try {
    execSync('npm install', { cwd, stdio: 'pipe' });
    console.log('done');
  } catch (e) {
    console.log('FAILED');
    console.error(`     ${e.message.split('\n')[0]}`);
    failed++;
  }
}

console.log(`\nDone. ${projects.length - failed} succeeded, ${failed} failed.`);
if (failed) process.exit(1);

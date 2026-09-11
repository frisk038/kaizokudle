#!/usr/bin/env node
// Reads assets/characters.enriched.json and assets/characters.json,
// scores each character, prints a distribution, and writes a filtered
// assets/characters.filtered.json.
//
// Usage:
//   node scripts/filter-characters.js             (uses default threshold 300)
//   node scripts/filter-characters.js --threshold 500
//   node scripts/filter-characters.js --dry-run   (print stats only, no output file)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INPUT = join(ROOT, 'assets', 'characters.json');
const ENRICHED = join(ROOT, 'assets', 'characters.enriched.json');
const OUTPUT = join(ROOT, 'assets', 'characters.filtered.json');

const args = process.argv.slice(2);
const thresholdArg = args.find((_, i) => args[i - 1] === '--threshold');
const THRESHOLD = thresholdArg ? parseInt(thresholdArg, 10) : 300;
const DRY_RUN = args.includes('--dry-run');

if (!existsSync(ENRICHED)) {
  console.error('Missing assets/characters.enriched.json — run enrich-wiki.js first.');
  process.exit(1);
}

const characters = JSON.parse(readFileSync(INPUT, 'utf8'));
const wikiData = JSON.parse(readFileSync(ENRICHED, 'utf8'));

function score(char) {
  const storyLen = wikiData[char.name] ?? 0;
  const bonusBounty = char.bounty > 0 ? 500 : 0;
  const bonusEpithet = char.epithet ? 300 : 0;
  const optionalFields = ['age', 'height', 'origin', 'devil_fruit', 'haki', 'image_pre', 'affiliation'];
  const bonusData = optionalFields.filter(f => char[f] != null).length * 80;
  return storyLen + bonusBounty + bonusEpithet + bonusData;
}

const scored = characters.map(char => ({
  char,
  storyLen: Math.max(0, wikiData[char.name] ?? 0),
  total: score(char),
}));

// Distribution table
const buckets = [0, 100, 300, 500, 1000, 2000, 5000, 10000, Infinity];
console.log('\n--- Story length distribution (wiki chars) ---');
for (let i = 0; i < buckets.length - 1; i++) {
  const lo = buckets[i];
  const hi = buckets[i + 1];
  const count = scored.filter(s => s.storyLen >= lo && s.storyLen < hi).length;
  const label = hi === Infinity ? `${lo}+` : `${lo}–${hi}`;
  console.log(`  ${label.padEnd(12)} ${count}`);
}

console.log('\n--- Characters kept at different thresholds ---');
for (const t of [100, 200, 300, 500, 800, 1000]) {
  const kept = scored.filter(s => s.total >= t).length;
  const marker = t === THRESHOLD ? ' ← current' : '';
  console.log(`  score >= ${String(t).padEnd(5)} → ${kept} characters${marker}`);
}

const notEnriched = characters.filter(c => wikiData[c.name] == null).length;
if (notEnriched > 0) {
  console.log(`\nWarning: ${notEnriched} characters not yet enriched (run enrich-wiki.js to completion).`);
}

const kept = scored.filter(s => s.total >= THRESHOLD).map(s => s.char);
console.log(`\nApplying threshold ${THRESHOLD}: ${kept.length}/${characters.length} characters kept.`);

// Show a few examples of what gets removed
const removed = scored.filter(s => s.total < THRESHOLD).slice(0, 10);
if (removed.length) {
  console.log('\nSample removed characters:');
  removed.forEach(s => console.log(`  ${s.char.name.padEnd(30)} story=${s.storyLen} total=${s.total}`));
}

// Show a few borderline cases
const borderline = scored
  .filter(s => s.total >= THRESHOLD && s.total < THRESHOLD + 200)
  .slice(0, 10);
if (borderline.length) {
  console.log('\nSample borderline kept characters (just above threshold):');
  borderline.forEach(s => console.log(`  ${s.char.name.padEnd(30)} story=${s.storyLen} total=${s.total}`));
}

if (!DRY_RUN) {
  writeFileSync(OUTPUT, JSON.stringify(kept, null, 2));
  console.log(`\nSaved to ${OUTPUT}`);
  console.log('When happy with the results, replace assets/characters.json with assets/characters.filtered.json.');
} else {
  console.log('\n(dry-run: no file written)');
}

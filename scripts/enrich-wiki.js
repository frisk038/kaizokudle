#!/usr/bin/env node
// Fetches the French One Piece fandom wiki for each character and measures
// the length of their "Histoire" section. Saves incrementally so it can be
// interrupted and resumed.
//
// Usage: node scripts/enrich-wiki.js
// Output: assets/characters.enriched.json

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INPUT = join(ROOT, 'assets', 'characters.json');
const OUTPUT = join(ROOT, 'assets', 'characters.enriched.json');

const DELAY_MS = 400;
const API_BASE = 'https://onepiece.fandom.com/fr/api.php';
const MAJOR_CHAR_FALLBACK = 10000;
const LONG_PAGE_THRESHOLD = 2000;

// Infobox templates that indicate non-character pages (techniques, forms, abilities)
const NON_CHARACTER_TEMPLATES = /\{\{Style box/i;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function extractHistoireLength(wikitext) {
  if (NON_CHARACTER_TEMPLATES.test(wikitext)) return 0;
  const match = wikitext.match(/==\s*histoire\s*==/i);
  if (!match) {
    // Page exists, is a character page, but no Histoire section → major character
    // whose page is structured via templates (Luffy, Nami, etc.)
    return wikitext.length > LONG_PAGE_THRESHOLD ? MAJOR_CHAR_FALLBACK : 0;
  }
  const rest = wikitext.slice(match.index + match[0].length);
  const nextSection = rest.match(/\n==\s*[^=]/);
  const end = nextSection ? nextSection.index : rest.length;
  return rest.slice(0, end).trim().length;
}

// Some characters have names like "Kuzan [Aokiji]" or "Bentham (Bon Clay) [Mr. 2]"
// where the alias/bracket content is the primary wiki page name.
function nameVariants(name) {
  const variants = [name];
  const base = name.replace(/\s*[\[(][^\])]*[\])]/, '').trim();
  const bracketAlias = name.match(/\[([^\]]+)\]/)?.[1];
  const parenAlias = name.match(/\(([^)]+)\)/)?.[1];
  if (base && base !== name) variants.push(base);
  if (bracketAlias) variants.push(bracketAlias);
  if (parenAlias) variants.push(parenAlias);
  return [...new Set(variants)];
}

async function fetchPage(name) {
  const url = `${API_BASE}?action=query&titles=${encodeURIComponent(name)}&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'kaizokudle-enricher/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;
  const rev = page.revisions?.[0];
  return rev?.slots?.main?.['*'] ?? rev?.['*'] ?? null;
}

async function fetchWikiChars(name) {
  for (const variant of nameVariants(name)) {
    const wikitext = await fetchPage(variant);
    if (wikitext) return extractHistoireLength(wikitext);
    await sleep(300);
  }
  return 0;
}

async function main() {
  const characters = JSON.parse(readFileSync(INPUT, 'utf8'));

  const enriched = existsSync(OUTPUT)
    ? JSON.parse(readFileSync(OUTPUT, 'utf8'))
    : {};

  const done = new Set(Object.keys(enriched));
  const remaining = characters.filter(c => !done.has(c.name));

  console.log(`Total: ${characters.length} | Already done: ${done.size} | Remaining: ${remaining.length}`);

  for (let i = 0; i < remaining.length; i++) {
    const char = remaining[i];
    const label = `[${done.size + i + 1}/${characters.length}] ${char.name}`;
    try {
      const chars = await fetchWikiChars(char.name);
      enriched[char.name] = chars;
      process.stdout.write(`${label} → ${chars}\n`);
    } catch (err) {
      enriched[char.name] = -1;
      process.stdout.write(`${label} → ERROR: ${err.message}\n`);
    }

    if ((done.size + i + 1) % 50 === 0) {
      writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2));
    }

    if (i < remaining.length - 1) await sleep(DELAY_MS);
  }

  writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2));
  console.log(`\nDone. Saved to ${OUTPUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });

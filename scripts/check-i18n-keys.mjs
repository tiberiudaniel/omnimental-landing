#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const roPath = path.join(root, 'i18n', 'ro.json');
const enPath = path.join(root, 'i18n', 'en.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function flatten(obj, prefix = '') {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = true;
    }
  });
  return out;
}

function diffKeys(a, b) {
  const onlyInA = [];
  for (const k of Object.keys(a)) {
    if (!(k in b)) onlyInA.push(k);
  }
  return onlyInA.sort();
}

try {
  const ro = readJson(roPath);
  const en = readJson(enPath);
  const roFlat = flatten(ro);
  const enFlat = flatten(en);
  const missingInRo = diffKeys(enFlat, roFlat);
  const missingInEn = diffKeys(roFlat, enFlat);

  if (!missingInRo.length && !missingInEn.length) {
    console.log('i18n OK: ro/en have matching keys.');
    process.exit(0);
  }
  if (missingInRo.length) {
    console.log('Missing in ro.json:');
    missingInRo.forEach((k) => console.log('  -', k));
  }
  if (missingInEn.length) {
    console.log('Missing in en.json:');
    missingInEn.forEach((k) => console.log('  -', k));
  }
  process.exit(1);
} catch (e) {
  console.error('i18n audit failed:', e?.message || e);
  process.exit(2);
}


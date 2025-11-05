#!/usr/bin/env node
/**
 * FlashSearch offline license generator (HMAC-SHA256)
 * Usage:
 *   node scripts/generate-license.js --duration month
 *   node scripts/generate-license.js --duration year --count 3
 */
const crypto = require('crypto');

// MUST match the app's secret in main.js
const LICENSE_SECRET = 'fs_lic_secret_2025_11_v1';

function base64UrlEncode(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createToken(duration) {
  const nowSec = Math.floor(Date.now() / 1000);
  const addDays = duration === 'year' ? 365 : 30;
  const expSec = nowSec + addDays * 24 * 60 * 60;
  const payload = {
    ver: 1,
    issuer: 'FlashSearch',
    plan: 'pro',
    iat: nowSec,
    exp: expSec,
    dur: duration
  };
  const payloadBuf = Buffer.from(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', LICENSE_SECRET).update(payloadBuf).digest();
  return { token: `${base64UrlEncode(payloadBuf)}.${base64UrlEncode(sig)}`, expSec };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { duration: 'month', count: 1 };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if ((a === '--duration' || a === '-d') && args[i + 1]) {
      out.duration = args[i + 1];
      i += 1;
    } else if ((a === '--count' || a === '-c') && args[i + 1]) {
      out.count = Math.max(1, parseInt(args[i + 1], 10) || 1);
      i += 1;
    }
  }
  if (!['month', 'year'].includes(out.duration)) out.duration = 'month';
  return out;
}

function main() {
  const { duration, count } = parseArgs();
  const results = [];
  for (let i = 0; i < count; i += 1) {
    results.push(createToken(duration));
  }
  results.forEach(({ token, expSec }, idx) => {
    const expISO = new Date(expSec * 1000).toISOString();
    process.stdout.write(`License #${idx + 1} (expires ${expISO}):\n${token}\n\n`);
  });
}

main();



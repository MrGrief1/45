#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locales');

// Load all language files
const languages = {};
const stats = {};

['en', 'ru', 'fr', 'de', 'zh'].forEach(lang => {
    const filepath = path.join(localesDir, `${lang}.json`);
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        languages[lang] = JSON.parse(content);
        stats[lang] = Object.keys(languages[lang]).length;
    } catch (e) {
        console.error(`Error loading ${lang}.json:`, e.message);
        process.exit(1);
    }
});

console.log('═'.repeat(80));
console.log('TRANSLATION VERIFICATION REPORT');
console.log('═'.repeat(80));
console.log();

// Check consistency
console.log('📊 File Statistics:');
Object.entries(stats).forEach(([lang, count]) => {
    console.log(`  ${lang.toUpperCase()}: ${count} keys`);
});

const enKeys = new Set(Object.keys(languages.en));
let allConsistent = true;
let issues = [];

['ru', 'fr', 'de', 'zh'].forEach(lang => {
    const langKeys = new Set(Object.keys(languages[lang]));
    const missing = Array.from(enKeys).filter(k => !langKeys.has(k));
    const extra = Array.from(langKeys).filter(k => !enKeys.has(k));
    
    if (missing.length > 0 || extra.length > 0) {
        allConsistent = false;
        if (missing.length > 0) {
            issues.push(`${lang.toUpperCase()}: Missing ${missing.length} keys`);
        }
        if (extra.length > 0) {
            issues.push(`${lang.toUpperCase()}: Extra ${extra.length} keys`);
        }
    }
});

console.log();
if (allConsistent) {
    console.log('✅ All translation files are consistent!');
} else {
    console.log('⚠️  Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
}

console.log();
console.log('═'.repeat(80));
console.log('Verification complete.');
console.log('═'.repeat(80));


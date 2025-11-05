#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locales');

// Load all language files
const languages = {};
['en', 'ru', 'fr', 'de', 'zh'].forEach(lang => {
    const filepath = path.join(localesDir, `${lang}.json`);
    languages[lang] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    console.log(`Loaded ${lang}.json: ${Object.keys(languages[lang]).length} keys`);
});

// Get all unique keys
const allKeys = new Set();
Object.values(languages).forEach(lang => {
    Object.keys(lang).forEach(key => allKeys.add(key));
});

console.log(`\nTotal unique keys: ${allKeys.size}\n`);

// Update each language file
['ru', 'fr', 'de', 'zh'].forEach(lang => {
    const currentLang = languages[lang];
    const en = languages.en;
    
    const missing = Array.from(allKeys).filter(key => !currentLang.hasOwnProperty(key));
    
    if (missing.length > 0) {
        console.log(`Adding ${missing.length} missing keys to ${lang}...`);
        missing.forEach(key => {
            currentLang[key] = en[key];
        });
        
        // Sort and save
        const sorted = {};
        Array.from(allKeys).sort().forEach(key => {
            sorted[key] = currentLang[key];
        });
        
        const filepath = path.join(localesDir, `${lang}.json`);
        fs.writeFileSync(filepath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
        console.log(`  Updated ${lang}.json\n`);
    } else {
        console.log(`${lang}: All keys present\n`);
    }
});

// Also ensure en.json is sorted
const enSorted = {};
Array.from(allKeys).sort().forEach(key => {
    enSorted[key] = languages.en[key];
});
const filepath = path.join(localesDir, 'en.json');
fs.writeFileSync(filepath, JSON.stringify(enSorted, null, 2) + '\n', 'utf-8');

console.log('All translation files synchronized!');


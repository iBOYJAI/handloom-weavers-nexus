/**
 * download-real-saree-images.js
 * Handloom Weavers Nexus — Real Saree Image Downloader
 *
 * Filenames match schema.sql seed data EXACTLY:
 *   Primary : saree-{category}-{id}-primary.jpg
 *   Variant : saree-{category}-{id}-variant-{n}-{color}.jpg
 *
 * Run: node scripts/download-real-saree-images.js
 * Requires: Node.js 18+ (no npm install needed)
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const ROOT_DIR    = path.join(__dirname, '..');
const SAREES_DIR  = path.join(ROOT_DIR, 'uploads', 'sarees');
const STORIES_DIR = path.join(ROOT_DIR, 'uploads', 'stories');
const ASSETS_DIR  = path.join(ROOT_DIR, 'public', 'assets', 'images');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

[SAREES_DIR, STORIES_DIR, ASSETS_DIR, SCRIPTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Category config — primary URLs + variant URLs ───────────────────────────
// Variant color keys MUST match the color names used in SQL seed data exactly
// (red, maroon, gold, blue, green, pink, purple, orange)

const CATEGORIES = [
    {
        slug    : 'kanchipuram-silk',
        startId : 1,
        primary : [
            'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=800&q=85',
            'https://images.unsplash.com/photo-1605023881282-e71f4543b68b?w=800&q=85',
            'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=800&q=85',
            'https://images.unsplash.com/photo-1617552892792-04c8a1c5cfac?w=800&q=85',
            'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=85',
            'https://images.unsplash.com/photo-1623399896374-6fdf00ec12f2?w=800&q=85',
            'https://images.unsplash.com/photo-1616604426203-b5f1fa020bc0?w=800&q=85',
            'https://images.unsplash.com/photo-1605023881282-e71f4543b68b?w=800&q=85',
        ],
        variants : {
            // SQL inserts variant-1-red, variant-2-maroon, variant-3-gold for saree 1
            1 : { red: 'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=800&q=85',
                  maroon: 'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=800&q=85',
                  gold: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=85' },
            // SQL inserts variant-1-blue, variant-2-green for saree 2
            2 : { blue: 'https://images.unsplash.com/photo-1605023881282-e71f4543b68b?w=800&q=85',
                  green: 'https://images.unsplash.com/photo-1623399896374-6fdf00ec12f2?w=800&q=85' },
            // SQL inserts variant-1-pink, variant-2-purple, variant-3-orange for saree 3
            3 : { pink: 'https://images.unsplash.com/photo-1617552892792-04c8a1c5cfac?w=800&q=85',
                  purple: 'https://images.unsplash.com/photo-1616604426203-b5f1fa020bc0?w=800&q=85',
                  orange: 'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=800&q=85' },
        },
    },
    {
        slug    : 'banarasi',
        startId : 9,
        primary : [
            'https://images.unsplash.com/photo-1623399896374-6fdf00ec12f2?w=800&q=85',
            'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=85',
            'https://images.unsplash.com/photo-1616604426203-b5f1fa020bc0?w=800&q=85',
            'https://images.unsplash.com/photo-1617552892792-04c8a1c5cfac?w=800&q=85',
            'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=800&q=85',
            'https://images.unsplash.com/photo-1605023881282-e71f4543b68b?w=800&q=85',
            'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=800&q=85',
            'https://images.unsplash.com/photo-1611898872015-0571a9e38375?w=800&q=85',
        ],
        variants : {},
    },
    {
        slug    : 'tussar-silk',
        startId : 17,
        primary : [
            'https://images.unsplash.com/photo-1611898872015-0571a9e38375?w=800&q=85',
            'https://images.unsplash.com/photo-1601467605946-bc2d24a4a5ba?w=800&q=85',
            'https://images.unsplash.com/photo-1604176424472-17cd4d9f9c2d?w=800&q=85',
            'https://images.unsplash.com/photo-1591130222373-8a7b0e59faf4?w=800&q=85',
            'https://images.unsplash.com/photo-1598963779090-cf2e69a82c32?w=800&q=85',
            'https://images.unsplash.com/photo-1607991658750-1a14c78a6777?w=800&q=85',
            'https://images.unsplash.com/photo-1617552892792-04c8a1c5cfac?w=800&q=85',
            'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=800&q=85',
        ],
        variants : {},
    },
    {
        slug    : 'chettinadu-cotton',
        startId : 25,
        primary : [
            'https://images.unsplash.com/photo-1598963779090-cf2e69a82c32?w=800&q=85',
            'https://images.unsplash.com/photo-1607991658750-1a14c78a6777?w=800&q=85',
            'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=800&q=85',
            'https://images.unsplash.com/photo-1601514374024-7d5c7979f76d?w=800&q=85',
            'https://images.unsplash.com/photo-1604176424472-17cd4d9f9c2d?w=800&q=85',
            'https://images.unsplash.com/photo-1611898872015-0571a9e38375?w=800&q=85',
            'https://images.unsplash.com/photo-1591130222373-8a7b0e59faf4?w=800&q=85',
            'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=800&q=85',
        ],
        variants : {},
    },
    {
        slug    : 'half-sarees',
        startId : 33,
        primary : [
            'https://images.unsplash.com/photo-1620813297980-c6ea44c4d2d4?w=800&q=85',
            'https://images.unsplash.com/photo-1610473961543-3dc4408427d9?w=800&q=85',
            'https://images.unsplash.com/photo-1607131859604-21e74e5df8e7?w=800&q=85',
            'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=800&q=85',
            'https://images.unsplash.com/photo-1616604426203-b5f1fa020bc0?w=800&q=85',
            'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=85',
            'https://images.unsplash.com/photo-1623399896374-6fdf00ec12f2?w=800&q=85',
            'https://images.unsplash.com/photo-1617552892792-04c8a1c5cfac?w=800&q=85',
        ],
        variants : {},
    },
    {
        slug    : 'tissue-sarees',
        startId : 41,
        primary : [
            'https://images.unsplash.com/photo-1617552892792-04c8a1c5cfac?w=800&q=85',
            'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=800&q=85',
            'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=85',
            'https://images.unsplash.com/photo-1605023881282-e71f4543b68b?w=800&q=85',
            'https://images.unsplash.com/photo-1623399896374-6fdf00ec12f2?w=800&q=85',
            'https://images.unsplash.com/photo-1616604426203-b5f1fa020bc0?w=800&q=85',
            'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=800&q=85',
            'https://images.unsplash.com/photo-1598963779090-cf2e69a82c32?w=800&q=85',
        ],
        variants : {},
    },
];

const UI_IMAGES = [
    { filename: 'hero-banner.jpg',          url: 'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=1200&q=85' },
    { filename: 'weaver-story-bg.jpg',      url: 'https://images.unsplash.com/photo-1604176424472-17cd4d9f9c2d?w=800&q=85'  },
    { filename: 'avatar-placeholder.jpg',   url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'  },
    { filename: 'weaver-avatar.jpg',        url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=200&q=80'  },
    { filename: 'admin-avatar.jpg',         url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'  },
    { filename: 'category-kanchipuram.jpg', url: 'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=400&q=85'  },
    { filename: 'category-banarasi.jpg',    url: 'https://images.unsplash.com/photo-1623399896374-6fdf00ec12f2?w=400&q=85'  },
    { filename: 'weaving-process.jpg',      url: 'https://images.unsplash.com/photo-1604176424472-17cd4d9f9c2d?w=800&q=85'  },
    { filename: 'no-image.jpg',             url: 'https://images.unsplash.com/photo-1598963779090-cf2e69a82c32?w=400&q=85'  },
    { filename: 'offline-banner.jpg',       url: 'https://images.unsplash.com/photo-1611898872015-0571a9e38375?w=800&q=85'  },
];

const STORY_IMAGES = [
    { filename: 'story-1.jpg', url: 'https://images.unsplash.com/photo-1604176424472-17cd4d9f9c2d?w=600&q=85' },
    { filename: 'story-2.jpg', url: 'https://images.unsplash.com/photo-1611898872015-0571a9e38375?w=600&q=85' },
    { filename: 'story-3.jpg', url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=600&q=85' },
    { filename: 'story-4.jpg', url: 'https://images.unsplash.com/photo-1601467605946-bc2d24a4a5ba?w=600&q=85' },
    { filename: 'story-5.jpg', url: 'https://images.unsplash.com/photo-1598963779090-cf2e69a82c32?w=600&q=85' },
    { filename: 'story-6.jpg', url: 'https://images.unsplash.com/photo-1617552892792-04c8a1c5cfac?w=600&q=85' },
];

const FALLBACKS = [
    'https://images.unsplash.com/photo-1610189352649-56e6e692e020?w=800&q=85',
    'https://images.unsplash.com/photo-1583391733956-6c78276477e3?w=800&q=85',
    'https://images.unsplash.com/photo-1605023881282-e71f4543b68b?w=800&q=85',
    'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=85',
];

// ─── Download engine ──────────────────────────────────────────────────────────

const TIMEOUT_MS    = 25000;
const RETRY_LIMIT   = 3;
const REQUEST_DELAY = 400;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        const req = proto.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 HandloomWeaversNexus/1.0', 'Accept': 'image/*' },
            timeout: TIMEOUT_MS,
        }, res => {
            if ([301,302,307,308].includes(res.statusCode)) {
                const loc = res.headers.location;
                if (!loc) { reject(new Error('Redirect missing location')); return; }
                downloadFile(loc, destPath).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
            const ct = res.headers['content-type'] || '';
            if (!ct.startsWith('image/')) { reject(new Error(`Not image: ${ct}`)); return; }
            const stream = fs.createWriteStream(destPath);
            res.pipe(stream);
            stream.on('finish', () => {
                stream.close();
                const size = fs.statSync(destPath).size;
                if (size < 4096) { fs.unlinkSync(destPath); reject(new Error(`Too small: ${size}b`)); return; }
                resolve(size);
            });
            stream.on('error', err => { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); reject(err); });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function tryDownload(primaryUrl, destPath) {
    const urls = [primaryUrl, ...FALLBACKS];
    for (const url of urls) {
        for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
            try {
                const bytes = await downloadFile(url, destPath);
                return { ok: true, bytes, fallback: url !== primaryUrl };
            } catch { if (attempt < RETRY_LIMIT) await sleep(REQUEST_DELAY * attempt); }
        }
    }
    return { ok: false };
}

function svgFallback(slug, id) {
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#C0392B"/><rect x="0" y="0" width="800" height="8" fill="#B8960C"/><rect x="0" y="992" width="800" height="8" fill="#B8960C"/><text x="400" y="470" text-anchor="middle" font-size="90" opacity="0.35">&#x1F3FA;</text><text x="400" y="560" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="#FFFFFF">${slug}</text><text x="400" y="608" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#FFFFFF" opacity="0.6">Saree #${String(id).padStart(3,'0')}</text><text x="400" y="70" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#FFFFFF" opacity="0.3" letter-spacing="3">HANDLOOM WEAVERS NEXUS</text></svg>`;
}

const exists = p => fs.existsSync(p) && fs.statSync(p).size > 4096;

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    let ok = 0, fail = 0, fb = 0, skip = 0;

    console.log('\n🌐  Handloom Weavers Nexus — Real Image Downloader');
    console.log('='.repeat(58));
    console.log('📌  Filenames match schema.sql seed data EXACTLY.');
    console.log('📸  Unsplash (free, no API key)\n');

    // 1. Primary images
    console.log('-- SAREE PRIMARY IMAGES -----------------------------------\n');
    for (const cat of CATEGORIES) {
        console.log(`📂  ${cat.slug}  (IDs ${cat.startId}–${cat.startId + cat.primary.length - 1})`);
        for (let i = 0; i < cat.primary.length; i++) {
            const id   = cat.startId + i;
            const file = `saree-${cat.slug}-${id}-primary.jpg`;   // ← matches SQL exactly
            const dest = path.join(SAREES_DIR, file);
            process.stdout.write(`  ${file.padEnd(52)} `);
            if (exists(dest)) { console.log('skip'); skip++; continue; }
            const r = await tryDownload(cat.primary[i], dest);
            if (r.ok) { console.log(`ok  ${Math.round(r.bytes/1024)} KB${r.fallback ? ' (fb)' : ''}`); if (r.fallback) fb++; ok++; }
            else { console.log('FAIL → svg'); fs.writeFileSync(dest.replace('.jpg','-ph.svg'), svgFallback(cat.slug,id)); fail++; }
            await sleep(REQUEST_DELAY);
        }
        console.log('');
    }

    // 2. Variant images
    console.log('-- SAREE VARIANT IMAGES -----------------------------------\n');
    for (const cat of CATEGORIES) {
        if (!cat.variants || !Object.keys(cat.variants).length) continue;
        for (const [idStr, colorMap] of Object.entries(cat.variants)) {
            const sareeId = parseInt(idStr);
            let vNum = 1;
            for (const [colorName, url] of Object.entries(colorMap)) {
                const file = `saree-${cat.slug}-${sareeId}-variant-${vNum}-${colorName}.jpg`; // ← matches SQL exactly
                const dest = path.join(SAREES_DIR, file);
                process.stdout.write(`  ${file.padEnd(62)} `);
                if (exists(dest)) { console.log('skip'); skip++; vNum++; continue; }
                const r = await tryDownload(url, dest);
                if (r.ok) { console.log(`ok  ${Math.round(r.bytes/1024)} KB`); ok++; }
                else { console.log('FAIL'); fail++; }
                await sleep(REQUEST_DELAY);
                vNum++;
            }
        }
    }

    // 3. Story images
    console.log('\n-- WEAVER STORY IMAGES ------------------------------------\n');
    for (const img of STORY_IMAGES) {
        const dest = path.join(STORIES_DIR, img.filename);
        process.stdout.write(`  ${img.filename.padEnd(15)} `);
        if (exists(dest)) { console.log('skip'); skip++; continue; }
        const r = await tryDownload(img.url, dest);
        r.ok ? (console.log(`ok  ${Math.round(r.bytes/1024)} KB`), ok++) : (console.log('FAIL'), fail++);
        await sleep(REQUEST_DELAY);
    }

    // 4. UI images
    console.log('\n-- UI IMAGES ----------------------------------------------\n');
    for (const img of UI_IMAGES) {
        const dest = path.join(ASSETS_DIR, img.filename);
        process.stdout.write(`  ${img.filename.padEnd(30)} `);
        if (exists(dest)) { console.log('skip'); skip++; continue; }
        const r = await tryDownload(img.url, dest);
        r.ok ? (console.log(`ok  ${Math.round(r.bytes/1024)} KB`), ok++) : (console.log('FAIL'), fail++);
        await sleep(REQUEST_DELAY);
    }

    // Summary
    console.log('\n' + '='.repeat(58));
    console.log('SUMMARY');
    console.log('='.repeat(58));
    console.log(`OK       : ${ok}`);
    console.log(`Skipped  : ${skip}  (already downloaded)`);
    console.log(`Fallback : ${fb}`);
    console.log(`Failed   : ${fail}`);
    console.log('\nFolders:');
    console.log('  uploads/sarees/             <- saree images');
    console.log('  uploads/stories/            <- story images');
    console.log('  public/assets/images/       <- UI images');
    if (fail > 0) console.log(`\nWARNING: ${fail} images failed. Re-run script to retry.`);
    else          console.log('\nAll done! SQL seed paths now match local files exactly.');
}

if (require.main === module) {
    main().then(() => process.exit(0)).catch(e => { console.error('Fatal:', e.message); process.exit(1); });
}

module.exports = { main };
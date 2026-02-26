import fs from 'fs';

const legacyRBTxt = fs.readFileSync('legacy/Blazor/PMD.SaveEditor.Web/Resources/en/RBItems.txt', 'utf8');
const skyEnTxt = fs.readFileSync('public/resources/en/SkyItems.txt', 'utf8');

const langs = ['en', 'it', 'fr', 'de', 'es'];

// Load Sky items for all langs to use as a dictionary
const skyDict = {};
for (const lang of langs) {
    skyDict[lang] = {};
    const txt = fs.readFileSync(`public/resources/${lang}/SkyItems.txt`, 'utf8');
    for (const line of txt.split('\n')) {
        const [idStr, ...rest] = line.split('=');
        if (idStr && rest.length) {
            skyDict[lang][idStr.trim()] = rest.join('=').trim().replace('\r', '');
        }
    }
}

// Map English Sky names to Sky IDs
const nameToSkyId = {};
for (const [id, name] of Object.entries(skyDict['en'])) {
    // some manual fallbacks if names slightly differ
    let normalized = name.toLowerCase().replace(/ \d+$/, '').trim(); // Remove " 6" etc.
    nameToSkyId[normalized] = id;
}
nameToSkyId['none'] = 0;
nameToSkyId['nothing'] = 0;
nameToSkyId['gravelerock'] = 7; // Sky has Gravelerock as 7
nameToSkyId['geo pebble'] = 8;
nameToSkyId['oran berry'] = 70;
nameToSkyId['apple'] = 109;

// Parse legacy RB items
const rbEnItems = [];
for (const line of legacyRBTxt.split('\n')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const id = parseInt(parts[0]);
        const name = parts.slice(1).join('=').trim().replace('\r', '');
        rbEnItems.push({ id, name });
    }
}

// Generate new RBItems.txt for all langs
for (const lang of langs) {
    let out = '';
    for (const item of rbEnItems) {
        let norm = item.name.toLowerCase().trim();
        let skyId = nameToSkyId[norm];

        let translatedName = item.name; // fallback to eng
        if (skyId !== undefined && skyDict[lang][skyId]) {
            translatedName = skyDict[lang][skyId];
        } else {
            // Check direct match
            let found = Object.keys(skyDict['en']).find(k => skyDict['en'][k].toLowerCase() === norm);
            if (found) {
                translatedName = skyDict[lang][found];
            }
        }

        // Manual override for 'Nothing'
        if (item.id === 0) {
            if (lang === 'en') translatedName = 'Nothing';
            if (lang === 'it') translatedName = '-';
            if (lang === 'fr') translatedName = '-';
            if (lang === 'es') translatedName = '-';
            if (lang === 'de') translatedName = '-';
        }

        out += `${item.id}=${translatedName}\n`;
    }

    fs.writeFileSync(`public/resources/${lang}/RBItems.txt`, out);
}
console.log("Successfully rebuilt RBItems.txt for all languages.");


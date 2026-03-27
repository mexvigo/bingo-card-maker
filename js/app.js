/* ── 100 Most Common English Words (stop words) ── */
const STOP_WORDS = new Set([
    'the','be','to','of','and','a','in','that','have','i',
    'it','for','not','on','with','he','as','you','do','at',
    'this','but','his','by','from','they','we','her','she','or',
    'an','will','my','one','all','would','there','their','what','so',
    'up','out','if','about','who','get','which','go','me','when',
    'make','can','like','time','no','just','him','know','take','people',
    'into','year','your','good','some','could','them','see','other','than',
    'then','now','look','only','come','its','over','think','also','back',
    'after','use','two','how','our','work','first','well','way','even',
    'new','want','because','any','these','give','day','most','us','is',
    'are','was','were','been','being','has','had','did','does','am',
    'may','might','shall','should','must','need','dare','ought','used','say',
]);

/* ── Common First Names ─────────────────────────── */
const COMMON_NAMES = new Set([
    'james','mary','john','patricia','robert','jennifer','michael','linda',
    'david','elizabeth','william','barbara','richard','susan','joseph','jessica',
    'thomas','sarah','charles','karen','christopher','lisa','daniel','nancy',
    'matthew','betty','anthony','margaret','mark','sandra','donald','ashley',
    'steven','kimberly','paul','emily','andrew','donna','joshua','michelle',
    'kenneth','dorothy','kevin','carol','brian','amanda','george','melissa',
    'timothy','deborah','ronald','stephanie','edward','rebecca','jason','sharon',
    'jeffrey','laura','ryan','cynthia','jacob','kathleen','gary','amy',
    'nicholas','angela','eric','shirley','jonathan','anna','stephen','brenda',
    'larry','pamela','justin','emma','scott','nicole','brandon','helen',
    'benjamin','samantha','samuel','katherine','raymond','christine','gregory','debra',
    'frank','rachel','alexander','carolyn','patrick','janet','jack','catherine',
    'dennis','maria','jerry','heather','tyler','diane','aaron','ruth',
    'jose','julie','adam','olivia','nathan','joyce','henry','virginia',
    'peter','victoria','zachary','kelly','douglas','lauren','harold','christina',
    'alex','joan','phil','evelyn','bob','joe','mike','tom','dan','ben','matt',
    'chris','nick','steve','jeff','jake','luke','sean','shane','seth','cole',
    'kate','anne','jane','beth','meg','jen','jess','steph','sam','kim','sue',
]);

/* ── DOM refs ───────────────────────────────────── */
const sourceText    = document.getElementById('source-text');
const cardSizeSel   = document.getElementById('card-size');
const phraseLenSel  = document.getElementById('phrase-length');
const generateBtn   = document.getElementById('generate-btn');
const clearBtn      = document.getElementById('clear-btn');
const shuffleBtn    = document.getElementById('shuffle-btn');
const printBtn      = document.getElementById('print-btn');
const excludedInput = document.getElementById('excluded-words');
const outputSection = document.getElementById('output-section');
const freqSection   = document.getElementById('freq-section');
const bingoCardEl   = document.getElementById('bingo-card');
const freqListEl    = document.getElementById('freq-list');

let currentWords = [];   // words currently on the card
let allRanked    = [];   // full ranked list for reshuffling
let excludedWords = new Set();  // user-excluded words

/* ── Event listeners ────────────────────────────── */
generateBtn.addEventListener('click', generate);
clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    excludedInput.value = '';
    excludedWords.clear();
    outputSection.style.display = 'none';
    freqSection.style.display = 'none';
});
/* ── Drag & Drop file support ──────────────────── */
const dropZone    = document.getElementById('drop-zone');
const dropOverlay = document.getElementById('drop-overlay');
let dragCounter = 0;

dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) { dragCounter = 0; dropZone.classList.remove('drag-over'); }
});
dropZone.addEventListener('dragover', (e) => e.preventDefault());
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('drag-over');
    handleDroppedFiles(e.dataTransfer.files);
});

async function handleDroppedFiles(fileList) {
    const textExts = /\.(txt|csv|md|rtf|log|json|xml|html|htm|tsv|text)$/i;
    const files = [...fileList].filter(f => f.type.startsWith('text/') || textExts.test(f.name));
    if (files.length === 0) {
        alert('No supported text files found. Drag .txt, .csv, .md, .rtf, or similar text files.');
        return;
    }
    const texts = await Promise.all(files.map(f => f.text()));
    const combined = texts.join('\n\n');
    sourceText.value = sourceText.value
        ? sourceText.value + '\n\n' + combined
        : combined;
}shuffleBtn.addEventListener('click', () => {
    if (allRanked.length) {
        const filtered = filterExcluded(allRanked);
        renderCard(pickWords(filtered));
    }
});
printBtn.addEventListener('click', () => window.print());

/* ── Main generate logic ────────────────────────── */
function generate() {
    const text = sourceText.value.trim();
    if (!text) return;

    syncExcludedFromInput();

    const maxN = parseInt(phraseLenSel.value, 10);
    const ranked = analyzeText(text, maxN);
    allRanked = ranked;

    if (ranked.length === 0) {
        alert('No meaningful words found. Try pasting more text.');
        return;
    }

    const filtered = filterExcluded(ranked);
    renderFrequencyList(ranked);
    renderCard(pickWords(filtered));

    outputSection.style.display = '';
    freqSection.style.display   = '';
    outputSection.scrollIntoView({ behavior: 'smooth' });
}

/* ── Exclusion helpers ──────────────────────────── */
function syncExcludedFromInput() {
    const manual = excludedInput.value
        .split(',')
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0);
    manual.forEach(w => excludedWords.add(w));
}

function updateExcludedInput() {
    excludedInput.value = [...excludedWords].join(', ');
}

function filterExcluded(ranked) {
    return ranked.filter(r => !excludedWords.has(r.word));
}

function toggleExclude(word) {
    if (excludedWords.has(word)) {
        excludedWords.delete(word);
    } else {
        excludedWords.add(word);
    }
    updateExcludedInput();
    // Re-render card with updated exclusions
    if (allRanked.length) {
        const filtered = filterExcluded(allRanked);
        renderFrequencyList(allRanked);
        renderCard(pickWords(filtered));
    }
}

/* ── Text analysis ──────────────────────────────── */
function analyzeText(text, maxN) {
    // Normalize
    const clean = text.toLowerCase().replace(/['']/g, "'").replace(/[^a-z0-9' \n]/g, ' ');
    const words = clean.split(/\s+/).filter(w => w.length > 0);

    const freq = new Map();

    // Count n-grams from 1..maxN
    for (let n = 1; n <= maxN; n++) {
        for (let i = 0; i <= words.length - n; i++) {
            const gram = words.slice(i, i + n);
            if (n === 1) {
                if (STOP_WORDS.has(gram[0])) continue;
                if (COMMON_NAMES.has(gram[0])) continue;    // skip common names
                if (gram[0].length < 2) continue;           // skip single chars
                if (/\d/.test(gram[0])) continue;           // skip words containing numbers
            } else {
                // skip multi-word phrases containing ANY stop word
                if (gram.some(w => STOP_WORDS.has(w))) continue;
                // skip if any word is a common name
                if (gram.some(w => COMMON_NAMES.has(w))) continue;
                // skip phrases containing numbers
                if (gram.some(w => /\d/.test(w))) continue;
            }
            const key = gram.join(' ');
            freq.set(key, (freq.get(key) || 0) + 1);
        }
    }

    // Remove multi-word phrases that only appear once (they're noise)
    for (const [key, count] of freq) {
        if (key.includes(' ') && count < 2) freq.delete(key);
    }

    // Sort by frequency descending, then alphabetically
    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([word, count]) => ({ word, count }));
}

/* ── Pick words for the card ────────────────────── */
function pickWords(ranked) {
    const size = parseInt(cardSizeSel.value, 10);
    const total = size * size;
    const needed = total - 1;          // minus the FREE space

    // Shuffle among top candidates so each card is different
    const pool = ranked.slice(0, Math.max(needed * 3, 60));
    shuffleArray(pool);
    currentWords = pool.slice(0, needed).map(r => r.word);

    // If we don't have enough, pad with what's available
    while (currentWords.length < needed && currentWords.length < ranked.length) {
        const next = ranked[currentWords.length];
        if (next && !currentWords.includes(next.word)) currentWords.push(next.word);
    }

    return currentWords;
}

/* ── Render bingo card ──────────────────────────── */
function renderCard(words) {
    const size = parseInt(cardSizeSel.value, 10);
    bingoCardEl.className = `bingo-card size-${size}`;
    bingoCardEl.innerHTML = '';

    const total = size * size;
    const center = Math.floor(total / 2);

    let wi = 0;
    for (let i = 0; i < total; i++) {
        const cell = document.createElement('div');
        cell.classList.add('bingo-cell');

        if (i === center) {
            cell.textContent = 'FREE';
            cell.classList.add('free', 'marked');
        } else {
            cell.textContent = wi < words.length ? words[wi] : '—';
            wi++;
        }

        cell.addEventListener('click', () => cell.classList.toggle('marked'));
        bingoCardEl.appendChild(cell);
    }
}

/* ── Render frequency sidebar ───────────────────── */
function renderFrequencyList(ranked) {
    freqListEl.innerHTML = '';
    const show = ranked.slice(0, 50);
    show.forEach(({ word, count }) => {
        const el = document.createElement('span');
        el.className = 'freq-item' + (excludedWords.has(word) ? ' excluded' : '');
        el.innerHTML = `<span class="count">${count}</span> ${escapeHtml(word)}`;
        el.title = excludedWords.has(word) ? 'Click to include' : 'Click to exclude';
        el.addEventListener('click', () => toggleExclude(word));
        freqListEl.appendChild(el);
    });
}

/* ── Helpers ─────────────────────────────────────── */
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

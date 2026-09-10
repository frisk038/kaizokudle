let characters = [];
let targetCharacter = null;
let guessCount = 0;
let gameOver = false;

const inputEl        = document.getElementById('character-input');
const autocompleteEl = document.getElementById('autocomplete-list');
const tableBody      = document.getElementById('guesses-body');
const tableWrapper   = document.getElementById('table-wrapper');
const guessesMeta    = document.getElementById('guesses-meta');
const notifArea      = document.getElementById('notification-area');
const pips           = document.querySelectorAll('.pip');

async function init() {
    try {
        const response = await fetch('./assets/characters.json');
        characters = await response.json();
        targetCharacter = characters[Math.floor(Math.random() * characters.length)];
        console.log("Target:", targetCharacter.name);
    } catch (err) {
        console.error("Failed to load characters", err);
    }
}

inputEl.addEventListener('input', function () {
    const val = this.value.trim();
    closeAllLists();
    if (!val) return;

    const filtered = characters.filter(char => {
        const nameMatch    = char.name    && char.name.toLowerCase().includes(val.toLowerCase());
        const epithetMatch = char.epithet && char.epithet.toLowerCase().includes(val.toLowerCase());
        return nameMatch || epithetMatch;
    }).slice(0, 10);

    filtered.forEach(char => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';

        const nameEl = document.createElement('span');
        nameEl.className = 'item-name';
        nameEl.textContent = char.name;
        item.appendChild(nameEl);

        if (char.epithet) {
            const epEl = document.createElement('span');
            epEl.className = 'item-epithet';
            epEl.textContent = `"${char.epithet}"`;
            item.appendChild(epEl);
        }

        item.addEventListener('click', () => {
            inputEl.value = '';
            closeAllLists();
            makeGuess(char);
        });

        autocompleteEl.appendChild(item);
    });
});

function closeAllLists() {
    autocompleteEl.innerHTML = '';
}

document.addEventListener('click', e => {
    if (e.target !== inputEl) closeAllLists();
});

function formatBounty(b) {
    if (!b) return '-';
    const n = typeof b === 'number' ? b : parseInt(String(b).replace(/[^0-9]/g, ''));
    if (isNaN(n)) return '-';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + 'M';
    if (n >= 1_000)         return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
}

function formatHeight(h) {
    if (!h) return '?';
    if (typeof h === 'number') {
        const m  = Math.floor(h / 100);
        const cm = (h % 100).toString().padStart(2, '0');
        return `${m}m${cm}`;
    }
    return h;
}

function formatGender(g) {
    if (!g) return '?';
    const l = g.toLowerCase();
    if (l.startsWith('m')) return 'M';
    if (l.startsWith('f')) return 'F';
    return g;
}

function formatAffiliation(a) {
    if (!a) return '-';
    const l = a.toLowerCase();
    if (l.includes('pirate'))       return 'Pir';
    if (l.includes('gouvernement') || l.includes('government')) return 'Gov';
    if (l.includes('revolutionary')) return 'Reb';
    if (l.includes('civil'))        return 'Civ';
    return a.slice(0, 3);
}

function formatFruit(f) {
    if (!f) return '-';
    return f.split(' ')[0];
}

function formatHaki(arr) {
    if (!arr || arr.length === 0) return '-';
    const emojis = { Conquerors: '👑', Armament: '⚔️', Observation: '👁️' };
    return arr.map(h => emojis[h] || '?').join('');
}

function formatArc(arc) {
    if (!arc) return '?';
    return arc.replace('Chapter ', 'Ch.');
}

function compareNumeric(gVal, tVal, formatFn) {
    const formatted = formatFn ? formatFn(gVal) : (gVal || '?');
    if (!gVal || !tVal) return { text: formatted, arrow: '' };

    let gNum = gVal;
    let tNum = tVal;

    if (typeof gVal === 'string' && gVal.includes('Chapter')) {
        gNum = parseInt(gVal.replace(/\D/g, '')) || 0;
        tNum = parseInt(tVal.replace(/\D/g, '')) || 0;
    }

    if (gNum === tNum) return { text: formatted, arrow: '' };
    return { text: formatted, arrow: gNum > tNum ? '↓' : '↑' };
}

function makeCell(text, isCorrect, arrow) {
    const td = document.createElement('td');
    td.className = isCorrect ? 'correct' : 'incorrect';

    const inner = document.createElement('span');
    inner.className = 'cell-inner';
    inner.textContent = text;

    if (arrow) {
        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'arrow';
        arrowSpan.textContent = arrow;
        inner.appendChild(arrowSpan);
    }

    td.appendChild(inner);
    return td;
}

function makeGuess(char) {
    if (gameOver) return;

    tableWrapper.classList.remove('hidden');
    guessesMeta.classList.remove('hidden');

    const tr = document.createElement('tr');

    const bountyRes  = compareNumeric(char.bounty,            targetCharacter.bounty,            formatBounty);
    const heightRes  = compareNumeric(char.height,            targetCharacter.height,             formatHeight);
    const arcRes     = compareNumeric(char.first_appearance_arc, targetCharacter.first_appearance_arc, formatArc);

    const cols = [
        makeCell(char.name,                                char.name === targetCharacter.name),
        makeCell(formatGender(char.gender),                formatGender(char.gender) === formatGender(targetCharacter.gender)),
        makeCell(formatAffiliation(char.affiliation1),     (char.affiliation1 || '') === (targetCharacter.affiliation1 || '')),
        makeCell(formatFruit(char.devil_fruit),            (char.devil_fruit || '') === (targetCharacter.devil_fruit || '')),
        makeCell(formatHaki(char.haki),                    formatHaki(char.haki) === formatHaki(targetCharacter.haki)),
        makeCell(bountyRes.text,                           char.bounty === targetCharacter.bounty, bountyRes.arrow),
        makeCell(char.height === targetCharacter.height ? '✓' : (heightRes.arrow || '?'), char.height === targetCharacter.height),
        makeCell(char.first_appearance_arc === targetCharacter.first_appearance_arc ? '✓' : (arcRes.arrow || '?'), char.first_appearance_arc === targetCharacter.first_appearance_arc),
    ];

    cols.forEach(td => tr.appendChild(td));
    tableBody.insertBefore(tr, tableBody.firstChild);

    if (char.name === targetCharacter.name) {
        gameOver = true;
        markPip(guessCount, true);
        guessCount++;
        updateCounter();
        inputEl.disabled = true;
        showNotification('win', `🏴‍☠️ That's <span class="notif-char">${targetCharacter.name}</span>! Found in ${guessCount} guess${guessCount === 1 ? '' : 'es'}!`);
    } else {
        markPip(guessCount, false);
        guessCount++;
        updateCounter();
        if (guessCount >= 10) {
            gameOver = true;
            inputEl.disabled = true;
            showNotification('lose', `The character was <span class="notif-char">${targetCharacter.name}</span>${targetCharacter.epithet ? ` — "${targetCharacter.epithet}"` : ''}`);
        }
    }
}

function markPip(index, win) {
    const pip = pips[index];
    if (!pip) return;
    pip.classList.add(win ? 'win' : 'used');
}

function updateCounter() {}

function showNotification(type, html) {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.innerHTML = html;
    notifArea.innerHTML = '';
    notifArea.appendChild(div);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

init();

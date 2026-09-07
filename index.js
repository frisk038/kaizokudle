let characters = [];
let targetCharacter = null;
let guessCount = 0;
let gameOver = false;

const inputEl        = document.getElementById('character-input');
const autocompleteEl = document.getElementById('autocomplete-list');
const tableBody      = document.getElementById('guesses-body');
const tableWrapper   = document.getElementById('table-wrapper');
const guessesMeta    = document.getElementById('guesses-meta');
const guessCounter   = document.getElementById('guess-counter');
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
    if (!b) return 'None';
    if (typeof b === 'number') return b.toLocaleString();
    return b;
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
    if (l.startsWith('m')) return 'Male';
    if (l.startsWith('f')) return 'Female';
    return g;
}

function formatHaki(arr) {
    if (!arr || arr.length === 0) return 'None';
    const emojis = { Conquerors: '👑', Armament: '⚔️', Observation: '👁️' };
    return arr.map(h => `${emojis[h] || ''}${h}`).join(', ');
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
    const arcRes     = compareNumeric(char.first_appearance_arc, targetCharacter.first_appearance_arc, x => x);

    const cols = [
        makeCell(char.name,                               char.name === targetCharacter.name),
        makeCell(formatGender(char.gender),               formatGender(char.gender) === formatGender(targetCharacter.gender)),
        makeCell(char.affiliation1 || 'None',             (char.affiliation1 || 'None') === (targetCharacter.affiliation1 || 'None')),
        makeCell(char.devil_fruit  || 'None',             (char.devil_fruit  || 'None') === (targetCharacter.devil_fruit  || 'None')),
        makeCell(formatHaki(char.haki),                   formatHaki(char.haki) === formatHaki(targetCharacter.haki)),
        makeCell(bountyRes.text,                          char.bounty === targetCharacter.bounty, bountyRes.arrow),
        makeCell(heightRes.text,                          char.height === targetCharacter.height, heightRes.arrow),
        makeCell(arcRes.text || '?',                      char.first_appearance_arc === targetCharacter.first_appearance_arc, arcRes.arrow),
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

function updateCounter() {
    guessCounter.textContent = `${guessCount} / 10`;
}

function showNotification(type, html) {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.innerHTML = html;
    notifArea.innerHTML = '';
    notifArea.appendChild(div);
}

init();

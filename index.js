let characters = [];
let allCharacters = [];
let targetCharacter = null;
let guessCount = 0;
let gameOver = false;

const ARCS = [
    { name: 'Romance Dawn',        start: 1,    end: 7    },
    { name: 'Orange Town',         start: 8,    end: 21   },
    { name: 'Syrup Village',       start: 22,   end: 41   },
    { name: 'Baratie',             start: 42,   end: 68   },
    { name: 'Arlong Park',         start: 69,   end: 95   },
    { name: 'Loguetown',           start: 96,   end: 100  },
    { name: 'Reverse Mountain',    start: 101,  end: 105  },
    { name: 'Whisky Peak',         start: 106,  end: 114  },
    { name: 'Little Garden',       start: 115,  end: 129  },
    { name: 'Drum Island',         start: 130,  end: 154  },
    { name: 'Arabasta',            start: 155,  end: 217  },
    { name: 'Jaya',                start: 218,  end: 236  },
    { name: 'Skypiea',             start: 237,  end: 302  },
    { name: 'Long Ring L. Land',   start: 303,  end: 321  },
    { name: 'Water 7',             start: 322,  end: 374  },
    { name: 'Enies Lobby',         start: 375,  end: 430  },
    { name: 'Post-Enies Lobby',    start: 431,  end: 441  },
    { name: 'Thriller Bark',       start: 442,  end: 489  },
    { name: 'Sabaody',             start: 490,  end: 513  },
    { name: 'Amazon Lily',         start: 514,  end: 524  },
    { name: 'Impel Down',          start: 525,  end: 549  },
    { name: 'Marineford',          start: 550,  end: 580  },
    { name: 'Post-War',            start: 581,  end: 597  },
    { name: 'Return to Sabaody',   start: 598,  end: 602  },
    { name: 'Fish-Man Island',     start: 603,  end: 653  },
    { name: 'Punk Hazard',         start: 654,  end: 699  },
    { name: 'Dressrosa',           start: 700,  end: 801  },
    { name: 'Zou',                 start: 802,  end: 824  },
    { name: 'Whole Cake Island',   start: 825,  end: 902  },
    { name: 'Levely',              start: 903,  end: 908  },
    { name: 'Wano Country',        start: 909,  end: 1057 },
    { name: 'Egghead',             start: 1058, end: 1125 },
    { name: 'Elbaph',              start: 1126, end: 9999 },
];

function getArcInfo(chapterStr) {
    if (!chapterStr) return null;
    const num = parseInt(String(chapterStr).replace(/\D/g, ''));
    if (isNaN(num)) return null;
    const idx = ARCS.findIndex(a => num >= a.start && num <= a.end);
    return idx === -1 ? null : { name: ARCS[idx].name, index: idx };
}

const inputEl        = document.getElementById('character-input');
const autocompleteEl = document.getElementById('autocomplete-list');
const tableBody      = document.getElementById('guesses-body');
const tableWrapper   = document.getElementById('table-wrapper');
const guessesMeta    = document.getElementById('guesses-meta');
const notifArea      = document.getElementById('notification-area');
const pips           = document.querySelectorAll('.pip');

async function init() {
    try {
        const [filteredRes, allRes] = await Promise.all([
            fetch('./assets/characters.filtered.json'),
            fetch('./assets/characters.json'),
        ]);
        characters    = await filteredRes.json();
        allCharacters = await allRes.json();
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

    const filtered = allCharacters.filter(char => {
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

function formatArc(chapterStr) {
    if (!chapterStr) return '?';
    const info = getArcInfo(chapterStr);
    return info ? info.name : chapterStr.replace('Chapter ', 'Ch.');
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

    const bountyRes  = compareNumeric(char.bounty, targetCharacter.bounty, formatBounty);
    const heightRes  = compareNumeric(char.height, targetCharacter.height, formatHeight);

    const gArc = getArcInfo(char.first_appearance_arc);
    const tArc = getArcInfo(targetCharacter.first_appearance_arc);
    const arcMatch = gArc && tArc && gArc.index === tArc.index;
    const arcArrow = (!arcMatch && gArc && tArc) ? (gArc.index > tArc.index ? '↓' : '↑') : '';
    const arcText  = gArc ? gArc.name : formatArc(char.first_appearance_arc);

    const cols = [
        makeCell(char.name,                                char.name === targetCharacter.name),
        makeCell(formatGender(char.gender),                formatGender(char.gender) === formatGender(targetCharacter.gender)),
        makeCell(formatAffiliation(char.affiliation1),     (char.affiliation1 || '') === (targetCharacter.affiliation1 || '')),
        makeCell(formatFruit(char.devil_fruit),            (char.devil_fruit || '') === (targetCharacter.devil_fruit || '')),
        makeCell(formatHaki(char.haki),                    formatHaki(char.haki) === formatHaki(targetCharacter.haki)),
        makeCell(bountyRes.text,                           char.bounty === targetCharacter.bounty, bountyRes.arrow),
        makeCell(char.height === targetCharacter.height ? '✓' : (heightRes.arrow || '?'), char.height === targetCharacter.height),
        makeCell(arcMatch ? '✓' : (arcArrow || '?'), arcMatch),
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

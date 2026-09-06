let characters = [];
let targetCharacter = null;

const inputEl = document.getElementById('character-input');
const autocompleteListEl = document.getElementById('autocomplete-list');
const tableBody = document.getElementById('guesses-body');
const tableHeader = document.getElementById('table-header');

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

inputEl.addEventListener('input', function() {
    const val = this.value;
    closeAllLists();
    if (!val) { return false; }
    
    const filtered = characters.filter(char => {
        const nameMatch = char.name && char.name.toLowerCase().includes(val.toLowerCase());
        const epithetMatch = char.epithet && char.epithet.toLowerCase().includes(val.toLowerCase());
        return nameMatch || epithetMatch;
    }).slice(0, 10);

    filtered.forEach(char => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.textContent = char.name + (char.epithet ? ` ("${char.epithet}")` : '');
        
        item.addEventListener("click", function() {
            inputEl.value = "";
            closeAllLists();
            makeGuess(char);
        });
        autocompleteListEl.appendChild(item);
    });
});

function closeAllLists() {
    while (autocompleteListEl.firstChild) {
        autocompleteListEl.removeChild(autocompleteListEl.firstChild);
    }
}

document.addEventListener("click", function (e) {
    if (e.target !== inputEl) {
        closeAllLists();
    }
});

function formatArray(arr) {
    if (!arr) return "-";
    if (Array.isArray(arr)) return arr.join(", ");
    return arr;
}

function makeGuess(char) {
    tableHeader.style.display = 'table-row';
    
    const tr = document.createElement('tr');
    
    // Formatting Helpers
    const formatBounty = (b) => {
        if (!b) return "None";
        if (typeof b === "number") return b.toLocaleString();
        return b;
    };

    const formatHeight = (h) => {
        if (!h) return "Unknown";
        if (typeof h === "number") {
            const m = Math.floor(h / 100);
            const cm = (h % 100).toString().padStart(2, '0');
            return `${m}m${cm}`;
        }
        return h;
    };

    const formatDF = (df) => df ? df : "None";
    const formatGender = (g) => g ? (g.toLowerCase().startsWith('m') ? 'M' : (g.toLowerCase().startsWith('f') ? 'F' : g)) : "Unknown";

    const compareNumeric = (gVal, tVal, formatFn) => {
        const formatted = formatFn ? formatFn(gVal) : (gVal || "Unknown");
        if (!gVal || !tVal) return formatted;
        
        let gNum = gVal;
        let tNum = tVal;
        
        // Parse Chapter numbers
        if (typeof gVal === 'string' && gVal.includes('Chapter')) {
            gNum = parseInt(gVal.replace(/\D/g, '')) || 0;
            tNum = parseInt(tVal.replace(/\D/g, '')) || 0;
        }

        if (gNum === tNum) return formatted;
        return gNum > tNum ? `${formatted} ↓` : `${formatted} ↑`;
    };

    const formatHaki = (hakiArray) => {
        if (!hakiArray || hakiArray.length === 0) return "None";
        const hakiEmojis = {
            "Conquerors": "👑",
            "Armament": "⚔️",
            "Observation": "👁️"
        };
        return hakiArray.map(h => `${hakiEmojis[h] || ''} ${h}`.trim()).join(", ");
    };

    const cols = [
        { guess: char.name, target: targetCharacter.name },
        { guess: formatGender(char.gender), target: formatGender(targetCharacter.gender) },
        { guess: char.affiliation || "None", target: targetCharacter.affiliation || "None" },
        { guess: formatDF(char.devil_fruit), target: formatDF(targetCharacter.devil_fruit) },
        { guess: formatHaki(char.haki), target: formatHaki(targetCharacter.haki) },
        { guess: formatBounty(char.bounty), target: formatBounty(targetCharacter.bounty) },
        { html: compareNumeric(char.height, targetCharacter.height, formatHeight), isMatch: char.height === targetCharacter.height },
        { html: compareNumeric(char.first_appearance_arc, targetCharacter.first_appearance_arc, x => x), isMatch: char.first_appearance_arc === targetCharacter.first_appearance_arc }
    ];

    cols.forEach(colData => {
        const td = document.createElement('td');
        
        if (colData.html !== undefined) {
            td.textContent = colData.html;
            td.className = colData.isMatch ? 'correct' : 'incorrect';
        } else {
            const gVal = colData.guess;
            const tVal = colData.target;
            
            td.textContent = gVal;
            if (gVal === tVal) {
                td.className = 'correct';
            } else {
                td.className = 'incorrect';
            }
        }
        
        tr.appendChild(td);
    });

    tableBody.insertBefore(tr, tableBody.firstChild);
    
    if (char.name === targetCharacter.name) {
        alert("You found the character!");
    }
}

init();

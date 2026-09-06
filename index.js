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
    
    // Name, Gender, Affiliation, Devil Fruit, Haki Type, Bounty, Height, First Appeared Arc
    const cols = [
        { guess: char.name, target: targetCharacter.name },
        { guess: char.gender, target: targetCharacter.gender },
        { guess: char.affiliation, target: targetCharacter.affiliation },
        { guess: char.devil_fruit, target: targetCharacter.devil_fruit },
        { guess: formatArray(char.haki), target: formatArray(targetCharacter.haki) },
        { guess: char.bounty, target: targetCharacter.bounty },
        { guess: char.height, target: targetCharacter.height },
        { guess: char.first_appearance_arc, target: targetCharacter.first_appearance_arc }
    ];

    cols.forEach(colData => {
        const td = document.createElement('td');
        const gVal = colData.guess || "-";
        const tVal = colData.target || "-";
        
        td.textContent = gVal;
        
        if (gVal === tVal) {
            td.className = 'correct';
        } else {
            td.className = 'incorrect';
        }
        
        tr.appendChild(td);
    });

    tableBody.insertBefore(tr, tableBody.firstChild);
    
    if (char.name === targetCharacter.name) {
        alert("You found the character!");
    }
}

init();

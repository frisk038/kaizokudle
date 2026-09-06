const fs = require('fs');

const data = JSON.parse(fs.readFileSync('assets/characters.json', 'utf8'));

const pirateKeywords = /\b(pirate|pirates|yonko|warlord|shichibukai|bandit|cross guild|kuja|thief|thieves|baroque works|beasts|straw hat|heart|kid|roger|rocks|spade|buggy|donquixote|big mom|blackbeard|whitebeard|red hair|sun pirates|arima|beast pirates|foxy|thriller bark|kid pirates)\b/i;
const govKeywords = /\b(marine|marines|world government|cipher pol|cp0|cp1|cp2|cp3|cp4|cp5|cp6|cp7|cp8|cp9|impel down|navy|admiral|enies lobby|gorosei|celestial dragon|world noble|god's knight)\b/i;
const revKeywords = /\b(revolutionary army|revolutionaries|revolutionary|dragon's army)\b/i;

let pCount = 0, gCount = 0, cCount = 0, rCount = 0;

data.forEach(char => {
    let textToSearch = (char.affiliation || '') + ' ' + (char.description || '');
    
    if (revKeywords.test(textToSearch)) {
        char.affiliation1 = 'Revolutionary Army';
        rCount++;
    } else if (govKeywords.test(textToSearch)) {
        char.affiliation1 = 'Gouvernement';
        gCount++;
    } else if (pirateKeywords.test(textToSearch)) {
        char.affiliation1 = 'Pirate';
        pCount++;
    } else {
        char.affiliation1 = 'Civil';
        cCount++;
    }
});

fs.writeFileSync('assets/characters.json', JSON.stringify(data, null, 2));
console.log(`Processed! Pirates: ${pCount}, Gouvernement: ${gCount}, Revs: ${rCount}, Civil: ${cCount}`);

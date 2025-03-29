// app.js
let history = [];
let currentRow = Array(5).fill(null).map((_, i) => ({
    letter: '',
    status: 'gray',
    position: i
}));
let gameWon = false;

// ================== UI Functions ================== //
function createRows() {
    const container = document.getElementById('wordInput');
    container.innerHTML = '';

    // Storia
    history.forEach(entry => {
        const row = document.createElement('div');
        row.className = 'history-row';
        entry.forEach((cell, i) => {
            const box = document.createElement('div');
            box.className = `letter-box ${cell.status}`;
            box.textContent = cell.letter.toUpperCase();
            row.appendChild(box);
        });
        container.appendChild(row);
    });

    // Riga corrente (solo se non vinto)
    if (!gameWon) {
        const currentRowDiv = document.createElement('div');
        currentRowDiv.className = 'current-row';
        currentRow.forEach((cell, i) => {
            const box = document.createElement('div');
            box.className = `letter-box ${cell.status}`;
            box.contentEditable = true;
            box.dataset.position = i;
            box.textContent = cell.letter.toUpperCase();
            
            box.addEventListener('input', handleLetterInput);
            box.addEventListener('click', handleColorCycle);
            box.addEventListener('keydown', handleKeyDown);
            
            currentRowDiv.appendChild(box);
        });
        container.appendChild(currentRowDiv);
        
        // Focus sulla prima casella se vuota
        if (currentRow[0].letter === '') {
            const firstBox = document.querySelector('[data-position="0"]');
            if (firstBox) {
                firstBox.focus();
                placeCaretAtEnd(firstBox);
            }
        }
    }
}

function placeCaretAtEnd(element) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

function handleKeyDown(event) {
    const box = event.target;
    const pos = parseInt(box.dataset.position);

    if (event.key === 'Backspace') {
        // Se la casella è vuota o il cursore è all'inizio
        if (box.textContent === '' || isCaretAtStart(box)) {
            event.preventDefault();
            if (pos > 0) {
                const prevBox = document.querySelector(`[data-position="${pos - 1}"]`);
                if (prevBox) {
                    prevBox.focus();
                    placeCaretAtEnd(prevBox);
                }
            }
        }
    }
    // Blocca il movimento del cursore con le frecce
    else if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }
    // Gestione del tasto Enter
    else if (event.key === 'Enter') {
        event.preventDefault();  // Impedisce il salto di riga

        // Triggera il click sul tasto "Resolve"
        const resolveButton = document.getElementById('resolveButton');
        if (resolveButton) {
            resolveButton.click();
        }
    }
}


function isCaretAtStart(element) {
    const sel = window.getSelection();
    if (sel.rangeCount === 0) return true;
    const range = sel.getRangeAt(0);
    return range.startOffset === 0 && range.endOffset === 0;
}

function showVictoryMessage() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="victory-message">
            🎉 Vittoria in ${history.length} tentativi! 🎉
            <button onclick="handleRestart()">Rigioca</button>
        </div>
    `;
}

function handleRestart() {
    history = [];
    currentRow = Array(5).fill(null).map((_, i) => ({
        letter: '',
        status: 'gray',
        position: i
    }));
    gameWon = false;
    createRows();
    document.getElementById('results').innerHTML = '';
}

function handleRefresh() {
    history = [];
    currentRow = Array(5).fill(null).map((_, i) => ({
        letter: '',
        status: 'gray',
        position: i
    }));
    gameWon = false;
    createRows();
    document.getElementById('results').innerHTML = '';
    document.getElementById('noSuggestionsMessage').style.display = 'none'; // Nasconde il messaggio di "Non hai più suggerimenti"
    document.getElementById('resolveButton').style.display = 'block'; // Mostra di nuovo il tasto "Resolve"
}

function letterFreq(parole_possibili) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    let freq = {};

    // Inizializza l'oggetto delle frequenze
    for (let c of alphabet) {
        freq[c] = [0, 0, 0, 0, 0]; // Frequenza per ogni posizione
    }

    // Calcola la frequenza di ogni lettera nelle 5 posizioni
    for (let word of parole_possibili) {
        for (let i = 0; i < word.length; i++) {
            let letter = word[i];
            freq[letter][i] += 1;
        }
    }

    return freq;
}

function wordScore(parole_possibili, frequencies) {
    let scores = {};
    let max_freq = [0, 0, 0, 0, 0];

    // Trova la frequenza massima per ogni posizione
    for (let letter in frequencies) {
        for (let i = 0; i < 5; i++) {
            max_freq[i] = Math.max(max_freq[i], frequencies[letter][i]);
        }
    }

    // Calcola il punteggio di ogni parola
    for (let word of parole_possibili) {
        let score = 1;

        for (let i = 0; i < 5; i++) {
            let letter = word[i];
            score *= 1 + Math.pow(frequencies[letter][i] - max_freq[i], 2);
        }

        scores[word] = score;
    }

    return scores;
}

function bestWords(parole_possibili, frequencies) {
    let scores = wordScore(parole_possibili, frequencies);
    let sorted_words = parole_possibili.sort((a, b) => scores[a] - scores[b]);
    return sorted_words;
}

function getSuggestions(parole_possibili, result, guess) {
    if (!result) {
        console.error("Errore: result non è definito");
        return { bestSuggestions: [], reverseSuggestions: [] };
    }

    const frequencies = letterFreq(parole_possibili);
    const bestSuggestions = bestWords(parole_possibili, frequencies);
    const reverseSuggestions = reverse_finder(result, guess, parole_possibili); // Parole reverse
    return { bestSuggestions, reverseSuggestions };
}


// ================== Game Logic ================== //
function checkWinCondition() {
    const lastAttempt = history[history.length - 1];
    return lastAttempt?.every(cell => cell.status === 'green');
}

// ================== Main Handler ================== //

function handleSubmit() {
    if (gameWon) return;

    if (currentRow.some(c => !c.letter)) {
        alert('Completa tutte le caselle!');
        return;
    }

    history.push([...currentRow.map(c => ({ ...c }))]);

    // Controlla vittoria
    if (checkWinCondition()) {
        gameWon = true;
        showVictoryMessage();
        createRows(); // Rimuove la riga corrente
        return;
    }

    currentRow.forEach(c => { c.letter = ''; c.status = 'gray' });
    createRows();

    const lastAttempt = history[history.length - 1] || [];
    const result = lastAttempt.map(c => c.status);  // Array di stati (es. ["gray", "yellow", "green", "gray", "gray"])
    const guess = lastAttempt.map(c => c.letter).join('');  // Stringa della parola tentata
    const possibleWords = filterWords();
    const { bestSuggestions, reverseSuggestions } = getSuggestions(possibleWords, result, guess);
    const resultsDiv = document.getElementById('results');

    // Controllo se ci sono suggerimenti
    if (bestSuggestions.length > 0) {
        const shownWords = bestSuggestions.slice(0, 3);
        const remainingWords = bestSuggestions.slice(3);

        const reverseWordsShown = reverseSuggestions.slice(0, 3);
        const reverseWordsRemaining = reverseSuggestions.slice(3);

        resultsDiv.innerHTML = `
            <div class="suggestions">
                <h3>Suggerimenti (${possibleWords.length}):</h3>
                ${shownWords.map(w => `<div class="word">${w}</div>`).join('')}
                ${remainingWords.length > 0 ? ` 
                    <button id="show-more" class="show-more">Mostra altri</button>
                    <div id="more-suggestions" class="more-suggestions">
                        ${remainingWords.map(w => `<div class="word">${w}</div>`).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="reverse-words">
                <h3>Parole Reverse (per eliminare opzioni):</h3>
                ${reverseWordsShown.map(w => `<div class="word">${w}</div>`).join('')}
                ${reverseWordsRemaining.length > 0 ? ` 
                    <button id="show-more-reverse" class="show-more">Mostra altre parole reverse</button>
                    <div id="more-reverse-suggestions" class="more-suggestions">
                        ${reverseWordsRemaining.map(w => `<div class="word">${w}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Aggiungi listener per il bottone "Mostra altri"
        const showMoreButton = document.getElementById('show-more');
        if (showMoreButton) {
            showMoreButton.addEventListener('click', () => {
                document.getElementById('more-suggestions').style.display = 'block';
                showMoreButton.style.display = 'none';
            });
        }

        const showMoreReverseButton = document.getElementById('show-more-reverse');
        if (showMoreReverseButton) {
            showMoreReverseButton.addEventListener('click', () => {
                document.getElementById('more-reverse-suggestions').style.display = 'block';
                showMoreReverseButton.style.display = 'none';
            });
        }
    } else {
        resultsDiv.innerHTML = '<p>Nessun suggerimento disponibile.</p>';
    }
}



// Funzione per posizionare il cursore all'inizio
function placeCaretAtStart(element) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(element, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function handleLetterInput(event) {
    const box = event.target;
    const pos = parseInt(box.dataset.position);
    const letter = event.data ? event.data.toLowerCase() : '';
    
    if (letter) {
        box.textContent = letter.toUpperCase();
        currentRow[pos].letter = letter;
        
        // Sposta il focus alla casella successiva solo se non è l'ultima
        if (pos < 4) {
            const nextBox = document.querySelector(`[data-position="${pos + 1}"]`);
            if (nextBox) {
                nextBox.focus();
                placeCaretAtEnd(nextBox);
            }
        }
        else {
            // Per l'ultima casella, mantieni il focus ma posiziona il cursore a destra
            placeCaretAtEnd(box);
        }
    } else {
        currentRow[pos].letter = '';
    }
}

function handleColorCycle(event) {
    const box = event.target;
    const pos = parseInt(box.dataset.position);
    if (!currentRow[pos].letter) return;

    const statusOrder = ['gray', 'yellow', 'green'];
    const newStatus = statusOrder[(statusOrder.indexOf(currentRow[pos].status) + 1) % 3];
    currentRow[pos].status = newStatus;
    box.className = `letter-box ${newStatus} visible-box`;
}

// ================== Core Logic ================== //
function filterWords() {
    return history.reduce((words, entry) => {
        return words.filter(word => {
            // 1. Lettere sbagliate
            const badLetters = entry.filter(c => c.status === 'gray').map(c => c.letter);
            const goodLetters = entry.filter(c => c.status !== 'gray').map(c => c.letter);

            // 2. Controllo posizioni corrette
            const correctPositions = entry
                .filter(c => c.status === 'green')
                .every(c => word[c.position] === c.letter);

            // 3. Lettere presenti ma in posizione sbagliata
            const yellowChecks = entry
                .filter(c => c.status === 'yellow')
                .every(c => word.includes(c.letter) && word[c.position] !== c.letter);

            return !badLetters.some(b => word.includes(b)) && correctPositions && yellowChecks;
        });
    }, WORD_LIST);
}

function getBestWords(wordList) {
    if(wordList.length === 0) return [];
    return wordList.slice(0, 3); // Semplice per esempio
}

// Funzione per trovare lettere sbagliate
function badLetters(result, guess) {
    let bad_letters = [];
    for (let i = 0; i < 5; i++) {
        if (result[i] === "s") {
            bad_letters.push(guess[i]);
        }
    }
    return bad_letters;
}

// Funzione per trovare lettere parziali
function partialLetters(result, guess) {
    let partial_letters = [];
    for (let i = 0; i < 5; i++) {
        if (result[i] === "g") {
            partial_letters.push([guess[i], i]);
        }
    }
    return partial_letters;
}

// Funzione per trovare lettere completamente corrette
function correctLetters(result, guess) {
    let correct_letters = [];
    for (let i = 0; i < 5; i++) {
        if (result[i] === "v") {
            correct_letters.push([guess[i], i]);
        }
    }
    return correct_letters;
}

function reverseWords(parole_possibili, frequencies) {
    // Ordina le parole in base alla loro "utilità" nel processo di eliminazione
    let scores = {};

    parole_possibili.forEach(word => {
        let score = 0;

        // Incrementa il punteggio per ogni lettera che appare frequentemente in posizioni importanti
        for (let i = 0; i < word.length; i++) {
            let letter = word[i];
            score += frequencies[letter][i]; // Maggiore è la frequenza, maggiore è il punteggio
        }

        scores[word] = score;
    });

    // Ordina le parole per punteggio (decrescente)
    let sortedWords = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);

    return sortedWords;
}

// Funzione per eliminare parole sbagliate
function reverse_finder(result, guess, parole_possibili) {
    let lettere_ricercate = new Set();
    
    // Trova le posizioni "gray" e raccogli lettere distinte da parole_possibili
    for (let i = 0; i < result.length; i++) {
        if (result[i] === "gray") {
            parole_possibili.forEach(word => {
                lettere_ricercate.add(word[i]);
            });
        }
    }

    // Converte in array per manipolazione più semplice
    lettere_ricercate = Array.from(lettere_ricercate);
    //console.log(lettere_ricercate)
    
    // Filtra parole contenenti il maggior numero di lettere ricercate
    let parole_filtrate = WORD_LIST.map(word => {
        let score = 0;
        lettere_ricercate.forEach(lettera => {
            if (word.includes(lettera)) {
                score++;
            }
        });
        return { word, score };
    });

    // Ordina per numero di lettere ricercate presenti
    parole_filtrate.sort((a, b) => b.score - a.score);
    
    // Ritorna solo le parole ordinate
    return parole_filtrate.map(entry => entry.word);
}

// Inizializzazione
createRows();
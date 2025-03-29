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

    const possibleWords = filterWords();
    const resultsDiv = document.getElementById('results');
    const resolveButton = document.getElementById('resolveButton'); // Aggiungi questa linea per prendere il tasto
    const noSuggestionsMessage = document.getElementById('noSuggestionsMessage');
    
    if (possibleWords.length === 0) {
        resolveButton.style.display = 'none'; // Nasconde il tasto se non ci sono suggerimenti
        noSuggestionsMessage.style.display = 'block'; // Mostra il messaggio "Non hai più suggerimenti"
    } else {
        resolveButton.style.display = 'block'; // Mostra il tasto se ci sono suggerimenti
        noSuggestionsMessage.style.display = 'none'; // Nasconde il messaggio
    }

    resultsDiv.innerHTML = `
        <div class="suggestions">
            <h3>Suggerimenti (${possibleWords.length}):</h3>
            ${possibleWords.slice(0, 3).map(w => `<div class="word">${w}</div>`).join('')}
        </div>
    `;
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

// Inizializzazione
createRows();
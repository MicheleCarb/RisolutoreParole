// Constants
const STATUS_ORDER = ['gray', 'yellow', 'green'];
const WORD_LENGTH = 5;

// State
const state = {
  history: [],
  currentRow: Array(WORD_LENGTH).fill().map((_, i) => ({
    letter: '',
    status: 'gray',
    position: i
  })),
  gameWon: false,
  suggestions: {
    best: [],
    reverse: []
  }
};

// DOM Elements
const elements = {
  wordInput: document.getElementById('wordInput'),
  results: document.getElementById('results'),
  resolveButton: document.getElementById('resolveButton'),
  refreshButton: document.getElementById('refreshButton'),
  noSuggestionsMessage: document.getElementById('noSuggestionsMessage')
};

// ================== UI Functions ================== //
const renderGame = () => {
    elements.wordInput.innerHTML = '';
  
    // Render history
    state.history.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'history-row';
      entry.forEach((cell) => {
        row.appendChild(createLetterBox(cell, false));
      });
      elements.wordInput.appendChild(row);
    });
  
    // Render current row if game not won
    if (!state.gameWon) {
      const currentRowDiv = document.createElement('div');
      currentRowDiv.className = 'current-row';
      state.currentRow.forEach((cell) => {
        currentRowDiv.appendChild(createLetterBox(cell, true));
      });
      elements.wordInput.appendChild(currentRowDiv);
  
      // Set the focus to the first editable box of the current row
      setTimeout(() => {
        const firstEditableBox = currentRowDiv.querySelector('.editable');
        if (firstEditableBox) {
          firstEditableBox.focus();
          placeCaretAtEnd(firstEditableBox);  // Ensure caret is at the end of the first box
        }
      }, 0);
    }
  };
  
  

const createLetterBox = (cell, isEditable) => {
  const box = document.createElement('div');
  box.className = `letter-box ${cell.status} ${isEditable ? 'editable' : ''}`;
  box.textContent = cell.letter.toUpperCase();
  box.dataset.position = cell.position;

  if (isEditable) {
    box.contentEditable = true;
    //console.log("Listener attivo su:", box.dataset.position);
    box.addEventListener('input', handleLetterInput);
    box.addEventListener('click', handleColorCycle);
    box.addEventListener('keydown', handleKeyDown);
  }

  return box;
};

const showVictoryMessage = () => {
  elements.results.innerHTML = `
    <div class="victory-message">
      <h3>🎉 Vittoria in ${state.history.length} tentativi! 🎉</h3>
      <button class="btn" onclick="resetGame()">Gioca ancora</button>
    </div>
  `;
};

// Helper function to place caret at end of contentEditable element
const placeCaretAtEnd = (element) => {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

const showSuggestions = (possibleWords, bestSuggestions, reverseSuggestions) => {
  const shownWords = bestSuggestions.slice(0, 3);
  const remainingWords = bestSuggestions.slice(3);
  const reverseShown = reverseSuggestions.slice(0, 3);
  const reverseMore = reverseSuggestions.slice(3, 21);
  const reverseRemaining = reverseSuggestions.slice(21);

  elements.results.innerHTML = `
    <div class="suggestions-container">
      <div class="suggestions">
        <div style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px;">
          <h3 style="margin: 0;">Migliori suggerimenti (${possibleWords.length}):</h3>
          <span id="suggestionsHelp" class="help-icon" style=style="cursor: pointer; font-size: 1em; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; margin-left: 2px;">❓</span>
        </div>
        <div class="words-grid">
          ${shownWords.map(w => `<div class="word">${w}</div>`).join('')}
        </div>
        ${remainingWords.length > 0 ? `
          <button id="show-more" class="btn btn-secondary">Show All</button>
          <div id="more-suggestions" class="words-grid hidden">
            ${remainingWords.map(w => `<div class="word">${w}</div>`).join('')}
          </div>
        ` : ''}
      </div>

      ${possibleWords.length >= 3 ? `
      <div class="reverse-suggestions">
      <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
        <h3 style="margin: 0; line-height: 1;">Parole per escludere più soluzioni:</h3>
        <span id="reverseHelp" class="help-icon" style="cursor: pointer; font-size: 1em; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; margin-left: 2px;">❓</span>
      </div>
      <div class="words-grid">
          ${reverseShown.map(w => `<div class="word">${w}</div>`).join('')}
        </div>
        ${reverseMore.length > 0 ? `
          <button id="show-more-reverse" class="btn btn-secondary">Show More</button>
          <div id="more-reverse-suggestions" class="words-grid hidden">
            ${reverseMore.map(w => `<div class="word">${w}</div>`).join('')}
          </div>
          ${reverseRemaining.length > 0 ? `
            <button id="show-all-reverse" class="btn btn-secondary hidden">Show All</button>
            <div id="all-reverse-suggestions" class="words-grid hidden">
              ${reverseRemaining.map(w => `<div class="word">${w}</div>`).join('')}
            </div>
          ` : ''}
        ` : ''}
      </div>
      ` : ''}
    </div>

    <!-- Help Dialogs -->
    <div id="suggestionsHelpDialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; max-width: 400px;">
      <h3>Come funzionano i suggerimenti</h3>
      <ul style="margin: 10px 0 20px 20px;">
        <li style="margin-bottom: 8px;">🔍 <strong>La prima parola</strong> ha la più alta probabilità di essere quella corretta</li>
        <li style="margin-bottom: 8px;">📊 Ma tutte le parole elencate sono <strong>possibili soluzioni</strong></li>
        <li style="margin-bottom: 8px;">🎯 L'ordine si basa su quante lettere in comune hanno con le parole possibili rimanenti</li>
      </ul>
      <button id="closeSuggestionsHelp" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">Ho capito!</button>
    </div>

    <div id="reverseHelpDialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; max-width: 400px;">
      <h3>Suggerimenti per escludere soluzioni</h3>
      <ul style="margin: 10px 0 20px 20px;">
        <li style="margin-bottom: 8px;">🔎 <strong>Queste parole</strong> aiutano a eliminare più possibilità</li>
        <li style="margin-bottom: 8px;">⚡ Ideali quando ci sono ancora molte opzioni possibili</li>
        <li style="margin-bottom: 8px;">🎲 Contengono lettere che dividono a metà le parole rimanenti</li>
        <li style="margin-bottom: 8px;">💡 Utili per fare progressi quando sei lontano dalla soluzione</li>
      </ul>
      <button id="closeReverseHelp" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">Ho capito!</button>
    </div>

    <div id="helpOverlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999;"></div>
  `;

  // Event listeners per i dialoghi di aiuto
  document.getElementById('suggestionsHelp')?.addEventListener('click', () => {
    document.getElementById('suggestionsHelpDialog').style.display = 'block';
    document.getElementById('helpOverlay').style.display = 'block';
  });

  document.getElementById('reverseHelp')?.addEventListener('click', () => {
    document.getElementById('reverseHelpDialog').style.display = 'block';
    document.getElementById('helpOverlay').style.display = 'block';
  });

  document.getElementById('closeSuggestionsHelp')?.addEventListener('click', () => {
    document.getElementById('suggestionsHelpDialog').style.display = 'none';
    document.getElementById('helpOverlay').style.display = 'none';
  });

  document.getElementById('closeReverseHelp')?.addEventListener('click', () => {
    document.getElementById('reverseHelpDialog').style.display = 'none';
    document.getElementById('helpOverlay').style.display = 'none';
  });

  document.getElementById('helpOverlay')?.addEventListener('click', () => {
    document.getElementById('suggestionsHelpDialog').style.display = 'none';
    document.getElementById('reverseHelpDialog').style.display = 'none';
    document.getElementById('helpOverlay').style.display = 'none';
  });

  // Add event listeners for show more buttons
  document.getElementById('show-more')?.addEventListener('click', () => {
    document.getElementById('more-suggestions').classList.remove('hidden');
    document.getElementById('show-more').classList.add('hidden');
  });

  document.getElementById('show-more-reverse')?.addEventListener('click', () => {
    document.getElementById('more-reverse-suggestions').classList.remove('hidden');
    document.getElementById('show-more-reverse').classList.add('hidden');
    document.getElementById('show-all-reverse').classList.remove('hidden');
  });

  document.getElementById('show-all-reverse')?.addEventListener('click', () => {
    document.getElementById('all-reverse-suggestions').classList.remove('hidden');
    document.getElementById('show-all-reverse').classList.add('hidden');
  });
};

// ================== Event Handlers ================== //
const handleLetterInput = (event) => {
    const box = event.target;
    const pos = parseInt(box.dataset.position);
    const letter = event.data ? event.data.toLowerCase() : '';

    //console.log(box, pos, letter);

    if (letter && /^[a-z]$/.test(letter)) {
        state.currentRow[pos].letter = letter;
        box.textContent = letter.toUpperCase();

        // Spostare il focus alla casella successiva se esiste
        const currentRowDiv = box.closest('.current-row'); // Find the parent row
        const nextBox = currentRowDiv.querySelector(`[data-position="${pos + 1}"]:not([contenteditable="false"])`); // Ensure focus goes to the next editable box in the current row

        //console.log(nextBox);

        // Se siamo nell'ultima casella, metti il focus alla fine
        if (pos === WORD_LENGTH - 1) {
            setTimeout(() => {
                placeCaretAtEnd(box); // Posiziona il cursore alla fine dell'ultima casella
            }, 0);
        } else if (nextBox) {
            nextBox.focus();
            setTimeout(() => {
                placeCaretAtEnd(nextBox); // Posiziona il cursore alla fine della casella successiva
            }, 0);
        } else {
            console.warn("Attenzione: nessuna casella trovata per il focus!");
        }
    }
};





const handleColorCycle = (event) => {
  const box = event.target;
  const pos = parseInt(box.dataset.position);
  
  if (!state.currentRow[pos].letter) return;

  const currentStatus = state.currentRow[pos].status;
  const newStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(currentStatus) + 1) % STATUS_ORDER.length];

  state.currentRow[pos].status = newStatus;
  box.className = `letter-box ${newStatus} editable`;
};

const handleKeyDown = (event) => {
    const box = event.target;
    const pos = parseInt(box.dataset.position);
  
    if (event.key === 'Backspace') {
      if (box.textContent === '' || isCaretAtStart(box)) {
        event.preventDefault();
        if (pos > 0) {
          const currentRowDiv = box.closest('.current-row'); // Find the parent row
          const prevBox = currentRowDiv.querySelector(`[data-position="${pos - 1}"]:not([contenteditable="false"])`);
          //const nextBox = currentRowDiv.querySelector(`[data-position="${pos + 1}"]:not([contenteditable="false"])`); // Ensure focus goes to the next editable box in the current row
          if (prevBox) {
            prevBox.focus();
            placeCaretAtEnd(prevBox);
          }
        }
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };
  
  // Helper to check caret position
  const isCaretAtStart = (element) => {
    const sel = window.getSelection();
    if (sel.rangeCount === 0) return true;
    const range = sel.getRangeAt(0);
    return range.startOffset === 0 && range.endOffset === 0;
  };

  const handleSubmit = () => {
    if (state.gameWon) return;
  
    if (state.currentRow.some(cell => !cell.letter)) {
      alert("Please complete all letters!");
      return;
    }
  
    state.history.push([...state.currentRow.map(cell => ({ ...cell }))]);
  
    if (state.history[state.history.length - 1].every(cell => cell.status === "green")) {
      state.gameWon = true;
      showVictoryMessage();
      renderGame();
      return;
    }
  
    state.currentRow.forEach(cell => {
      cell.letter = "";
      cell.status = "gray";
    });
  
    const possibleWords = filterWords();
  
    if (possibleWords.length === 0) {
      elements.noSuggestionsMessage.style.display = "block";
      elements.resolveButton.style.display = "none";
      return;
    }
  
    const uniqueWords = [...new Set(possibleWords)];
    const bestSuggestions = getBestSuggestions(uniqueWords);
    const bestResult = getBestResult(); // Ottenere la migliore parola conosciuta
    const reverseSuggestions = getReverseSuggestions(bestResult, uniqueWords); // Passiamo bestResult
  
    showSuggestions(uniqueWords, bestSuggestions, reverseSuggestions);
    renderGame();
  
    setTimeout(() => {
      const firstBox = document.querySelector(".editable");
      if (firstBox) {
        firstBox.focus();
        placeCaretAtEnd(firstBox);
      }
    }, 0);
  };
  
  
  
const resetGame = () => {
  state.history = [];
  state.currentRow = Array(WORD_LENGTH).fill().map((_, i) => ({
    letter: '',
    status: 'gray',
    position: i
  }));
  state.gameWon = false;
  elements.results.innerHTML = '';
  elements.noSuggestionsMessage.style.display = 'none';
  elements.resolveButton.style.display = 'block';
  renderGame();
};

// ================== Core Logic ================== //
const filterWords = () => {
  return state.history.reduce((words, entry) => {
    return words.filter(word => {
      const debugWord = "carco"; // Modifica per testare altre parole problematiche
      const debugState = false && (word === debugWord);
      if (debugState) console.log(`\nAnalizzando parola: ${word}`);

      // Troviamo tutte le lettere grigie e la loro posizione
      const invalidPositions = entry
        .filter(c => c.status === 'gray')
        .map(c => ({ letter: c.letter, position: c.position }));
      if (debugState) console.log(`Lettere grigie in posizioni specifiche:`, invalidPositions);

      // Controllo per lettere grigie nelle posizioni specifiche
      const hasInvalidPosition = invalidPositions.some(({ letter, position }) => word[position] === letter);

      // Contiamo quante volte una lettera appare come verde, gialla e grigia in posizioni uniche
      const letterOccurrences = {};
      state.history.flat().forEach(c => {
        if (!letterOccurrences[c.letter]) {
          letterOccurrences[c.letter] = { green: new Set(), yellow: 0, gray: 0 };
        }
        if (c.status === 'green') {
          letterOccurrences[c.letter].green.add(c.position);
        } else {
          letterOccurrences[c.letter][c.status]++;
        }
      });
      if (debugState) console.log(`Conteggio lettere nella storia:`, letterOccurrences);

      // Troviamo lettere grigie che devono essere completamente escluse
      const badLetters = entry
        .filter(c => c.status === 'gray')
        .map(c => c.letter)
        .filter(letter => letterOccurrences[letter].green.size === 0 && letterOccurrences[letter].yellow === 0);
      if (debugState)  console.log(`Lettere da escludere completamente:`, badLetters);

      const hasBadLetters = badLetters.some(b => word.includes(b));

      const correctPositions = entry
        .filter(c => c.status === 'green')
        .every(c => word[c.position] === c.letter);

      const yellowChecks = entry
        .filter(c => c.status === 'yellow')
        .every(c => word.includes(c.letter) && word[c.position] !== c.letter);

      // Controlliamo il numero massimo di occorrenze delle lettere verdi (usando le posizioni uniche)
      const hasExcessLetters = Object.keys(letterOccurrences).some(letter => {
        const countInWord = word.split('').filter(l => l === letter).length;
        const maxAllowed = letterOccurrences[letter].green.size > 0 ? letterOccurrences[letter].green.size : Infinity; // Se non c'è un limite, usa Infinity
        const excess = letterOccurrences[letter].gray > 0 && countInWord > maxAllowed;
        if (excess) {
          if (debugState) console.log(`Parola ${word} ha troppe occorrenze di ${letter}: ${countInWord} rispetto al massimo ${maxAllowed}`);
        }
        return excess;
      });

      const isValid = !hasBadLetters && !hasInvalidPosition && correctPositions && yellowChecks && !hasExcessLetters;
      if (debugState && !isValid) {
        if (debugState) console.log(`Escludo parola: ${word}`);
      }
      return isValid;
    });
  }, WORD_LIST);
};







const getBestSuggestions = (possibleWords) => {

  const frequencies = calculateLetterFrequencies(possibleWords);
  return possibleWords.sort((a, b) => calculateWordScore(b, frequencies) - calculateWordScore(a, frequencies));
};

const getReverseSuggestions = (bestResult, possibleWords) => {
  const lettersToCheck = new Set();
  const greenPositions = new Map();
  const grayPositions = new Set();
  const letterCounts = new Map(); // Conta quante volte ogni lettera è verde
  let debug = false;
  if(debug) console.log("Best Result:", bestResult);

  // Ottieni la lunghezza della parola (tutte le parole hanno la stessa lunghezza)
  const wordLength = possibleWords[0].length;

  // Analizza il bestResult per trovare le posizioni grigie e verdi
  bestResult.split("").forEach((char, i) => {
    if (char === "_") {
      possibleWords.forEach(word => lettersToCheck.add(word[i]));
      grayPositions.add(i);
    } else {
      greenPositions.set(i, char);
      letterCounts.set(char, (letterCounts.get(char) || 0) + 1);
    }
  });

  // Passo 1: Determinare le lettere "fisse" per inferenza (ma senza segnarle come verdi)
  for (let pos = 0; pos < wordLength; pos++) { // Usa la lunghezza della prima parola
    const firstChar = possibleWords[0][pos];
    const isFixed = possibleWords.every(word => word[pos] === firstChar); // La lettera è uguale in tutte le parole in quella posizione
    if (isFixed) {
      // Se è fissa, non la segniamo come verde, ma la escludiamo da lettersToCheck
      lettersToCheck.delete(firstChar); 
      if(debug) console.log(`La lettera ${firstChar} è stata esclusa da lettersToCheck perché è fissa in posizione ${pos}`);
    }
  }

  if(debug) console.log("Lettere da verificare:", Array.from(lettersToCheck).join(", "));
  if(debug) console.log("Posizioni verdi:", greenPositions);
  if(debug) console.log("Posizioni grigie:", Array.from(grayPositions).join(", "));

  return WORD_LIST
    .map(word => {
      let score = 0;
      let usedPositions = new Set();
      let extraLetterCount = new Map(); // Tiene traccia di quante volte ogni lettera appare
      let debugInfo = [`Parola: ${word}`]; // Per memorizzare i dettagli del punteggio

      // Priorità 1: Contiene le lettere da cercare
      Array.from(lettersToCheck).forEach(letter => {
        if (word.includes(letter)) {
          score += 2;
          if(debug) debugInfo.push(`+2: Contiene la lettera cercata ${letter}`);
        }
      });

      // Priorità 2: Evita lettere verdi nelle posizioni grigie
      let isInvalid = false;
      greenPositions.forEach((letter, pos) => {
        if (grayPositions.has(pos) && word[pos] === letter) {
          isInvalid = true;
          if(debug) debugInfo.push(`- Scartata: La lettera verde ${letter} è in posizione grigia ${pos}`);
        }
      });

      // Priorità 3: Posiziona le lettere da cercare nelle posizioni grigie
      grayPositions.forEach(pos => {
        if (lettersToCheck.has(word[pos])) {
          score += 3;
          usedPositions.add(pos);
          if(debug) debugInfo.push(`+3: La lettera ${word[pos]} è in una posizione grigia utile (${pos})`);
        }
      });

      // Priorità 4: Se una lettera è verde in più posizioni, proviamo a metterla altrove
      greenPositions.forEach((letter, pos) => {
        const requiredExtra = (letterCounts.get(letter) || 0) + 1;
        extraLetterCount.set(letter, (extraLetterCount.get(letter) || 0) + (word.split(letter).length - 1));
      
        if (lettersToCheck.has(letter) && extraLetterCount.get(letter) >= requiredExtra) {
          score += 4; // Premiamo parole che ripetono una lettera verde in una nuova posizione SOLO se la lettera è cercata
          if(debug) debugInfo.push(`+4: La lettera verde ${letter} è stata posizionata in un'altra posizione`);
        }
      });

      // Priorità 5: Se una lettera cercata è posizionata in una posizione già verde
      greenPositions.forEach((_, pos) => {
        lettersToCheck.forEach(letter => {
          if (word[pos] === letter) {
            score += 1;
            if(debug) debugInfo.push(`+1: La lettera ${letter} è stata posizionata in una posizione verde ${pos}`);
          }
        });
      });

      if (score === 0 || isInvalid) {
        return null; // Scartiamo le parole senza punti o non valide
      }

      if(debug) console.log(debugInfo.join("\n"));

      return { word, score };
    })
    .filter(entry => entry !== null) // Rimuove parole con punteggio nullo o scartate
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.word);
};






const calculateLetterFrequencies = (words) => {
  const frequencies = {};
  
  // Initialize frequencies
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c => {
    frequencies[c] = Array(WORD_LENGTH).fill(0);
  });

  // Calculate frequencies
  words.forEach(word => {
    word.split('').forEach((letter, i) => {
      frequencies[letter][i]++;
    });
  });

  return frequencies;
};

const calculateWordScore = (word, frequencies) => {
  const uniqueLetters = new Set(word); // Consideriamo solo lettere uniche nella parola
  return Array.from(uniqueLetters).reduce((score, letter) => {
    return score + frequencies[letter]; // Sommiamo la frequenza solo una volta per ogni lettera unica
  }, 0);
};

const getBestResult = () => {
  let bestResult = Array(WORD_LENGTH).fill("_"); // Stringa iniziale con "_"

  state.history.forEach(entry => {
    entry.forEach((cell, i) => {
      if (cell.status === "green") {
        bestResult[i] = cell.letter; // Sovrascrive solo le posizioni conosciute
      }
    });
  });

  return bestResult.join("");
};


// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Help dialog functionality
  document.getElementById('helpIcon')?.addEventListener('click', () => {
    document.getElementById('helpDialog').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
  });

  document.getElementById('closeHelp')?.addEventListener('click', () => {
    document.getElementById('helpDialog').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
  });

  // Close dialog when clicking outside
  document.getElementById('overlay')?.addEventListener('click', () => {
    document.getElementById('helpDialog').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
  });

  document.getElementById('findHelpIcon')?.addEventListener('click', () => {
    document.getElementById('findHelpDialog').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
  });
  
  document.getElementById('closeFindHelp')?.addEventListener('click', () => {
    document.getElementById('findHelpDialog').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
  });
  renderGame();
  
  // Search functionality
  document.getElementById('resolveButtonFind').addEventListener('click', () => {
    const letters = document.getElementById('wordInputFind').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('resultsFind');
    
    if (!letters) {
      resultsDiv.innerHTML = '<p>Please enter some letters</p>';
      return;
    }
    
    const foundWords = WORD_LIST.filter(word => 
      letters.split('').every(letter => word.includes(letter))
    );
    
    resultsDiv.innerHTML = foundWords.length 
      ? `<div class="words-grid">${foundWords.map(w => `<div class="word">${w}</div>`).join('')}</div>`
      : '<p>No words found</p>';
  });
});
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
    console.log("Listener attivo su:", box.dataset.position);
    box.addEventListener('input', handleLetterInput);
    box.addEventListener('click', handleColorCycle);
    box.addEventListener('keydown', handleKeyDown);
  }

  return box;
};

const showVictoryMessage = () => {
  elements.results.innerHTML = `
    <div class="victory-message">
      <h3>🎉 Victory in ${state.history.length} attempts! 🎉</h3>
      <button class="btn" onclick="resetGame()">Play Again</button>
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
  const reverseRemaining = reverseSuggestions.slice(3);

  elements.results.innerHTML = `
    <div class="suggestions-container">
      <div class="suggestions">
        <h3>Best Suggestions (${possibleWords.length}):</h3>
        <div class="words-grid">
          ${shownWords.map(w => `<div class="word">${w}</div>`).join('')}
        </div>
        ${remainingWords.length > 0 ? `
          <button id="show-more" class="btn btn-secondary">Show More</button>
          <div id="more-suggestions" class="words-grid hidden">
            ${remainingWords.map(w => `<div class="word">${w}</div>`).join('')}
          </div>
        ` : ''}
      </div>

      <div class="reverse-suggestions">
        <h3>Elimination Words:</h3>
        <div class="words-grid">
          ${reverseShown.map(w => `<div class="word">${w}</div>`).join('')}
        </div>
        ${reverseRemaining.length > 0 ? `
          <button id="show-more-reverse" class="btn btn-secondary">Show More</button>
          <div id="more-reverse-suggestions" class="words-grid hidden">
            ${reverseRemaining.map(w => `<div class="word">${w}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Add event listeners for show more buttons
  document.getElementById('show-more')?.addEventListener('click', () => {
    document.getElementById('more-suggestions').classList.remove('hidden');
    document.getElementById('show-more').classList.add('hidden');
  });

  document.getElementById('show-more-reverse')?.addEventListener('click', () => {
    document.getElementById('more-reverse-suggestions').classList.remove('hidden');
    document.getElementById('show-more-reverse').classList.add('hidden');
  });
};

// ================== Event Handlers ================== //
const handleLetterInput = (event) => {
    const box = event.target;
    const pos = parseInt(box.dataset.position);
    const letter = event.data ? event.data.toLowerCase() : '';

    console.log(box, pos, letter);

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

// Validate current row
if (state.currentRow.some(cell => !cell.letter)) {
    alert('Please complete all letters!');
    return;
}

// Add to history
state.history.push([...state.currentRow.map(cell => ({ ...cell }))]);

// Check win condition
if (state.history[state.history.length - 1].every(cell => cell.status === 'green')) {
    state.gameWon = true;
    showVictoryMessage();
    renderGame();
    return;
}

// Reset current row
state.currentRow.forEach(cell => {
    cell.letter = '';
    cell.status = 'gray';
});

// Get suggestions
const lastAttempt = state.history[state.history.length - 1];
const result = lastAttempt.map(cell => cell.status);
const guess = lastAttempt.map(cell => cell.letter).join('');

const possibleWords = filterWords();

if (possibleWords.length === 0) {
    elements.noSuggestionsMessage.style.display = 'block';
    elements.resolveButton.style.display = 'none';
    return;
}

const bestSuggestions = getBestSuggestions(possibleWords);
const reverseSuggestions = getReverseSuggestions(result, guess, possibleWords);

showSuggestions(possibleWords, bestSuggestions, reverseSuggestions);

// Render the game (updating the UI)
renderGame();

// Set the focus to the first editable box of the new row
setTimeout(() => {
    const firstBox = document.querySelector('.editable');
    if (firstBox) {
    firstBox.focus();
    placeCaretAtEnd(firstBox);  // Ensure caret is at the end of the first box
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
      const badLetters = entry.filter(c => c.status === 'gray').map(c => c.letter);
      const hasBadLetters = badLetters.some(b => word.includes(b));
      
      const correctPositions = entry
        .filter(c => c.status === 'green')
        .every(c => word[c.position] === c.letter);
      
      const yellowChecks = entry
        .filter(c => c.status === 'yellow')
        .every(c => word.includes(c.letter) && word[c.position] !== c.letter);
      
      return !hasBadLetters && correctPositions && yellowChecks;
    });
  }, WORD_LIST);
};

const getBestSuggestions = (possibleWords) => {
  const frequencies = calculateLetterFrequencies(possibleWords);
  return possibleWords.sort((a, b) => calculateWordScore(b, frequencies) - calculateWordScore(a, frequencies));
};

const getReverseSuggestions = (result, guess, possibleWords) => {
  const lettersToCheck = new Set();
  
  result.forEach((status, i) => {
    if (status === 'gray') {
      possibleWords.forEach(word => lettersToCheck.add(word[i]));
    }
  });

  return WORD_LIST
    .map(word => ({
      word,
      score: Array.from(lettersToCheck).filter(letter => word.includes(letter)).length
    }))
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
  return word.split('').reduce((score, letter, i) => {
    return score + frequencies[letter][i];
  }, 0);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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
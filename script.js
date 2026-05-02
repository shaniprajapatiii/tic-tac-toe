document.addEventListener('DOMContentLoaded', () => {
   const WIN_COMBOS = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
   ];

   // Added a reference to the main board element for potential future use (e.g., adding animations, handling global events, etc.)
   const boardEl = document.getElementById('board');  
   // Added a container element for displaying player names and scores
   const scoreBoard = document.getElementById('scoreBoard');
   const cells = Array.from(document.querySelectorAll('.cell'));
   // Added a modal element for entering player names at the start of the game
   const nameModal = document.getElementById('nameModal');
   // Added a form element to handle player name submissions in the modal
   const namesForm = document.getElementById('namesForm');
   // Added input fields for player names in the modal
   const inputX = document.getElementById('inputX');
   const inputO = document.getElementById('inputO');
   // Added a button to skip entering names and use defaults
   const skipNames = document.getElementById('skipNames');
   // Added an element to display the current game status (e.g., whose turn it is, who won, etc.)
   const statusEl = document.getElementById('status');
   // Added a button to start a new game
   const newGameBtn = document.getElementById('newGameBtn');
   // Added a button to undo the last move
   const undoBtn = document.getElementById('undoBtn');
   // Added a button to reset scores
   const resetScoresBtn = document.getElementById('resetScoresBtn');
   // Elements for displaying player names and scores
   const nameXEl = document.getElementById('nameX');
   const nameOEl = document.getElementById('nameO');
   // Added an element to display the score for player X
   const scoreXEl = document.getElementById('scoreX');
   // Added an element to display the score for player O
   const scoreOEl = document.getElementById('scoreO');
   // Added an element to display the number of draws
   const scoreDrawEl = document.getElementById('scoreDraw');

   const STORAGE_KEYS = {
      players: 'tictactoe_players_v2',
      scores: 'tictactoe_scores_v2'
   };

   let players = { X: 'Player 1', O: 'Player 2' };
   let scores = { X: 0, O: 0, D: 0 };
   let board = Array(9).fill(null);
   let history = [];
   let current = 'X';
   let gameActive = false;
   let nextStarter = 'X';
   let autoRestartTimer = null;

   // Safely parses JSON from localStorage, returning a fallback value if parsing fails or if the value is not present
   function safeParse(value, fallback) {
      try {
         return value ? JSON.parse(value) : fallback;
      } catch {
         return fallback;
      }
   }

   // Loads the player names and scores from localStorage, applying defaults if the data is missing or malformed
   function loadState() {
      const savedPlayers = safeParse(localStorage.getItem(STORAGE_KEYS.players), null);
      const savedScores = safeParse(localStorage.getItem(STORAGE_KEYS.scores), null);

      if (savedPlayers && typeof savedPlayers === 'object') {
         players.X = typeof savedPlayers.X === 'string' && savedPlayers.X.trim() ? savedPlayers.X.trim() : players.X;
         players.O = typeof savedPlayers.O === 'string' && savedPlayers.O.trim() ? savedPlayers.O.trim() : players.O;
      }

      if (savedScores && typeof savedScores === 'object') {
         scores.X = Number.isFinite(savedScores.X) ? savedScores.X : scores.X;
         scores.O = Number.isFinite(savedScores.O) ? savedScores.O : scores.O;
         scores.D = Number.isFinite(savedScores.D) ? savedScores.D : scores.D;
      }
   }

   function saveState() {
      localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players));
      localStorage.setItem(STORAGE_KEYS.scores, JSON.stringify(scores));
   }

   // Opens the modal dialog for entering player names, pre-filling with existing names if available
   function openModal() {
      nameModal.style.display = 'flex';
      nameModal.setAttribute('aria-hidden', 'false');
      inputX.value = players.X === 'Player 1' ? '' : players.X;
      inputO.value = players.O === 'Player 2' ? '' : players.O;
      inputX.focus();
   }

   function closeModal() {
      nameModal.style.display = 'none';
      nameModal.setAttribute('aria-hidden', 'true');
   }

   function setStatus(message) {
      statusEl.textContent = message;
   }

   // Updates the UI elements for player names and scores based on the current state
   function updateScoreUI() {
      nameXEl.textContent = players.X;
      nameOEl.textContent = players.O;
      scoreXEl.textContent = String(scores.X);
      scoreOEl.textContent = String(scores.O);
      scoreDrawEl.textContent = String(scores.D);
   }

   function clearRestartTimer() {
      if (autoRestartTimer) {
         window.clearTimeout(autoRestartTimer);
         autoRestartTimer = null;
      }
   }

   // Renders the board based on the current state of the `board` array
   function renderBoard() {
      cells.forEach((cell, index) => {
         const value = board[index];
         cell.textContent = value || '';
         cell.classList.remove('x', 'o', 'win');
         if (value) cell.classList.add(value.toLowerCase());
         cell.disabled = !gameActive || Boolean(value);
      });
   }

   // Resets the board and starts a new match with the specified starter (or the next starter by default)
   function startNewMatch(starter = nextStarter) {
      clearRestartTimer();
      board = Array(9).fill(null);
      history = [];
      current = starter;
      gameActive = true;
      nextStarter = starter;
      setStatus(`${players[current]}'s turn (${current})`);
      renderBoard();
   }

   // Checks for a winner or a draw and returns the result
   function checkWinner() {
      for (const combo of WIN_COMBOS) {
         const [a, b, c] = combo;
         if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], combo };
         }
      }

      if (board.every(Boolean)) {
         return { winner: 'draw' };
      }

      return null;
   }

   // Highlights the winning cells based on the winning combination
   function highlightWinningCells(combo) {
      combo.forEach((index) => cells[index].classList.add('win'));
   }

   // Handles the end of a match, updates scores, and sets up the next match
   function finishMatch(result) {
      gameActive = false;

      if (result.winner === 'draw') {
         scores.D += 1;
         nextStarter = nextStarter === 'X' ? 'O' : 'X';
         setStatus(`Draw match. Next round starts with ${players[nextStarter]}.`);
      } else {
         scores[result.winner] += 1;
         nextStarter = result.winner;
         highlightWinningCells(result.combo);
         setStatus(`${players[result.winner]} won. Next round starts with the same player.`);
      }

      saveState();
      updateScoreUI();
      renderBoard();

      autoRestartTimer = window.setTimeout(() => {
         startNewMatch(nextStarter);
      }, 1800);
   }

   // Handles a player's move when they click on a cell
   function handleMove(index) {
      if (!gameActive || board[index]) return;

      board[index] = current;
      history.push(index);

      const result = checkWinner();
      if (result) {
         finishMatch(result);
         return;
      }

      current = current === 'X' ? 'O' : 'X';
      setStatus(`${players[current]}'s turn (${current})`);
      renderBoard();
   }

   // Allows players to undo their last move, reverting the game state accordingly
   function undoMove() {
      if (!gameActive || history.length === 0) return;

      const lastIndex = history.pop();
      board[lastIndex] = null;
      current = current === 'X' ? 'O' : 'X';
      setStatus(`${players[current]}'s turn (${current})`);
      renderBoard();
   }

   function resetScores() {
      scores = { X: 0, O: 0, D: 0 };
      saveState();
      updateScoreUI();
      setStatus('Scores reset. Start a new match anytime.');
   }

   function setPlayersFromForm() {
      const nextX = inputX.value.trim();
      const nextO = inputO.value.trim();
      players.X = nextX || 'Player 1';
      players.O = nextO || 'Player 2';
      saveState();
      updateScoreUI();
   }

   // Set up event listeners for cells, form submission, and buttons
   cells.forEach((cell, index) => {
      cell.addEventListener('click', () => handleMove(index));
      cell.addEventListener('keydown', (event) => {
         if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleMove(index);
         }
      });
   });

   namesForm.addEventListener('submit', (event) => {
      event.preventDefault();
      setPlayersFromForm();
      closeModal();
      startNewMatch('X');
   });

   skipNames.addEventListener('click', () => {
      players = { X: 'Player 1', O: 'Player 2' };
      saveState();
      updateScoreUI();
      closeModal();
      startNewMatch('X');
   });

   newGameBtn.addEventListener('click', () => {
      openModal();
   });

   undoBtn.addEventListener('click', undoMove);
   resetScoresBtn.addEventListener('click', resetScores);

   loadState();
   updateScoreUI();
   renderBoard();

   if (players.X === 'Player 1' && players.O === 'Player 2' && scores.X === 0 && scores.O === 0 && scores.D === 0) {
      openModal();
      setStatus('Enter player names to begin.');
   } else {
      setStatus(`${players[current]}'s turn (${current})`);
      gameActive = true;
   }
});

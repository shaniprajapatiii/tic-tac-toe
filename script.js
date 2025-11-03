const board = document.getElementById("board");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restart");

let currentPlayer = "X";
let gameActive = true;
let gameState = ["", "", "", "", "", "", "", "", ""];

// Create 9 cells dynamically
for (let i = 0; i < 9; i++) {
   const cell = document.createElement("div");
   cell.classList.add("cell");
   cell.dataset.index = i;
   board.appendChild(cell);
}

const cells = document.querySelectorAll(".cell");

const winningConditions = [
   [0, 1, 2],
   [3, 4, 5],
   [6, 7, 8],
   [0, 3, 6],
   [1, 4, 7],
   [2, 5, 8],
   [0, 4, 8],
   [2, 4, 6],
];

function handleCellClick(e) {
   const cell = e.target;
   const index = cell.dataset.index;

   if (gameState[index] !== "" || !gameActive) return;

   gameState[index] = currentPlayer;
   cell.textContent = currentPlayer;
   cell.classList.add(currentPlayer.toLowerCase());

   checkWinner();
}

function checkWinner() {
   let roundWon = false;

   for (let condition of winningConditions) {
      const [a, b, c] = condition;
      if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
         roundWon = true;
         highlightWinningCells(condition);
         break;
      }
   }

   if (roundWon) {
      statusText.textContent = `🎉 Player ${currentPlayer} wins!`;
      gameActive = false;
      return;
   }

   if (!gameState.includes("")) {
      statusText.textContent = "It's a draw! 😅";
      gameActive = false;
      return;
   }

   currentPlayer = currentPlayer === "X" ? "O" : "X";
   statusText.textContent = `Player ${currentPlayer}'s turn`;
}

function highlightWinningCells(indices) {
   indices.forEach((i) => {
      cells[i].style.boxShadow = "0 0 30px #00ff99, inset 0 0 20px #00ff99";
      cells[i].style.transform = "scale(1.1)";
   });
}

restartBtn.addEventListener("click", () => {
   gameState = ["", "", "", "", "", "", "", "", ""];
   currentPlayer = "X";
   gameActive = true;
   statusText.textContent = "Player X's turn";
   cells.forEach((cell) => {
      cell.textContent = "";
      cell.classList.remove("x", "o");
      cell.style.boxShadow = "";
      cell.style.transform = "";
   });
});

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));

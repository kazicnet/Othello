# CLAUDE.md

This file provides guidance to AI assistants working on this codebase.

## Project Overview

This is a browser-based Othello (Reversi) game where a human player competes against a computer AI. The entire game runs client-side with no backend, no build step, and no dependencies.

The README describes "a computer othello player based on DNNs" — the current implementation uses a minimax algorithm with alpha-beta pruning, not a deep neural network.

## Repository Structure

```
Othello/
├── index.html   # HTML skeleton and UI controls
├── app.js       # All game logic and AI (382 lines)
├── styles.css   # Styling and layout (104 lines)
├── README.md    # User-facing documentation
├── LICENSE      # Apache 2.0
└── .gitignore   # Python-focused exclusions (legacy)
```

There is no build system, package manager, or backend. All code runs directly in the browser.

## Running the Game

```bash
python -m http.server 4173
# Then open http://127.0.0.1:4173
```

Any static file server works. The port is configurable.

## Architecture

### `index.html`

Provides the page structure:
- Difficulty selector: Easy / Normal / Hard
- Color selector: Black (moves first) / White (moves second)
- Status display: current turn, score, messages
- 8×8 board grid container

All text is in Japanese (UI language).

### `app.js`

All logic is wrapped in a single IIFE (Immediately Invoked Function Expression) to avoid polluting the global scope.

**Constants:**
```js
BOARD_SIZE = 8
EMPTY = 0, BLACK = 1, WHITE = -1
DIRECTIONS = [[−1,−1],[−1,0],…]  // 8 directions for board traversal
```

**Game state** is a plain object holding:
- `board` — 2D array `board[row][col]`, values are `EMPTY`, `BLACK`, or `WHITE`
- `currentPlayer` — whose turn it is
- `humanColor` — the color the human player chose
- `gameEnded` — boolean flag
- `aiThinking` — prevents input during AI calculation

**Key functions:**

| Function | Purpose |
|---|---|
| `createInitialBoard()` | Returns 8×8 array with standard starting position |
| `getFlipsForMove(board, row, col, player)` | Returns array of `[r,c]` positions that flip if `player` plays at `(row,col)` |
| `getValidMoves(board, player)` | Returns array of `{row, col, flips}` objects |
| `applyMove(board, move, player)` | Returns new board with move applied (immutable) |
| `countStones(board)` | Returns `{black, white}` counts |
| `evaluateBoard(board, player)` | Heuristic score for minimax |
| `minimax(board, depth, alpha, beta, maximizing, player)` | Alpha-beta pruning search |
| `getAiMove(board, player, difficulty)` | Selects AI move based on difficulty |
| `render()` | Full re-render of board and status from current state |

**AI difficulty:**
- **Easy:** Random move from valid moves
- **Normal:** Greedy — picks move with highest `evaluateBoard` score (depth 1)
- **Hard:** Minimax with alpha-beta pruning; depth 6 when ≤34 empty squares remain, depth 4 otherwise

**Evaluation function** (`evaluateBoard`) combines:
1. Positional weights — corners are highly valued; cells adjacent to corners are penalized
2. Mobility — difference in number of valid moves
3. Stone count difference

Formula: `positional + mobility*8 + stoneDiff*2`

**Game flow:**
1. Human clicks a valid cell → `applyMove` → check for pass or game-end → AI turn via `setTimeout`
2. AI calls `getAiMove` → `applyMove` → check for pass or game-end → human's turn
3. Pass occurs when a player has no valid moves but the game is not over
4. Game ends when neither player can move or the board is full

### `styles.css`

- Dark theme: `#1f2430` background, `#0b6f3c` board green
- CSS Grid for the 8×8 board
- Responsive sizing via `min(95vw, 720px)` container
- Stone colors: Black `#111`, White `#f1f1f1`
- Valid move hints shown as semi-transparent white dots

## Code Conventions

**JavaScript:**
- Constants: `UPPER_SNAKE_CASE`
- Variables and functions: `camelCase`
- Board coordinates: `row` before `col`, 0-indexed
- `applyMove` is pure (returns a new board); do not mutate state directly
- All DOM updates go through `render()`; never update the DOM piecemeal elsewhere

**HTML/CSS:**
- UI labels remain in Japanese to match the project's language choice
- Avoid adding `id` attributes to board cells; cells are addressed by position via the grid

## Testing

There is no automated test suite. Manual testing:
1. Start the server and open the game in a browser
2. Verify all three difficulty levels
3. Verify both color choices (Black moves first, White moves second)
4. Check edge cases: forced pass, board-full draw, corner captures

If adding tests, Jest or Vitest are natural choices for vanilla JS. Export functions from `app.js` or refactor to ES modules first.

## Common Tasks

**Change AI search depth:**
Find `getAiMove` in `app.js` and adjust the `depth` arguments passed to `minimax`.

**Add a new difficulty level:**
Add an `<option>` to the difficulty `<select>` in `index.html`, then handle the new value in `getAiMove`.

**Modify the evaluation function:**
Edit `evaluateBoard` in `app.js`. The positional weight table (`weights`) is a flat 64-element array in row-major order.

**Change the color scheme:**
Edit CSS custom properties and color values in `styles.css`. The board color is `#0b6f3c`, the background is `#1f2430`.

## Git Workflow

- The main branch is `master`
- Feature branches follow the pattern `claude/<description>-<session-id>`
- Push with: `git push -u origin <branch-name>`
- Commits use signed commits (configured in `.git/config`)

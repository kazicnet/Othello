# Othello
A computer othello player based on DNNs.

## Play in browser

This repository now includes a standalone browser Othello game (`index.html`, `styles.css`, `app.js`).

### Requirements
- Python 3 (for simple local static hosting)
  - Alternative: any static file server is fine.

### Quick start
1. Move to the repository root:
   ```bash
   cd /workspace/Othello
   ```
2. Start a local static server:
   ```bash
   python -m http.server 4173
   ```
3. Open this URL in your browser:
   - `http://127.0.0.1:4173`

### How to play
- Choose difficulty: `Easy` / `Normal` / `Hard`.
- Choose your color:
  - `黒（先手）` (Black, first)
  - `白（後手）` (White, second)
- Click **新しいゲーム** to reset.
- Legal moves are shown as highlighted dots on the board.
- If you have no legal moves, your turn is automatically passed.
- Game ends when:
  - both players cannot move, or
  - the board is full.

### Notes
- No backend is required; everything runs in the browser.
- If the selected port is already in use, change the port (e.g. `8000`) and open that URL.

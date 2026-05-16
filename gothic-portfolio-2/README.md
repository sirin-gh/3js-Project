vim src/loader.js
    ```
    *   Press `i` to start typing (Insert mode).
    *   Press `Esc`, then type `:wq` and hit `Enter` to save and exit.

---

### 2. Using "Open" Commands (Launch your GUI editor)
If you just want to open the file in your favorite editor from the terminal:

*   **VS Code:**
    ```bash
    code src/loader.js
    ```
*   **Sublime Text:**
    ```bash
    subl src/loader.js
    ```

---

### 3. Quick Terminal Operations (No Editor)
If you just need to rename files or move things around to match your new "Non-Gothic" vibe:

*   **Rename a file:**
    ```bash
    mv src/gothic_styles.css src/style.css
    ```
*   **Search and Replace text across all files:**
    If you want to replace the word "Gothic" with "Portfolio" in every file in your project:
    
```bash
    grep -rl "Gothic" . | xargs sed -i 's/Gothic/Portfolio/g'
    ```
    *(Note: On Mac, use `sed -i '' 's/Gothic/Portfolio/g'`)*

*   **Append a line to a file:**
    ```bash
    echo "/* New Style Added */" >> src/style.css
    ```

---

### 🛠 Practical Tip for your 3js Project
Since you are using **Vite**, keep your terminal divided. Keep one tab running `npm run dev` so you can see the changes live, and use a second tab (or a split pane) to run `micro` or `nano` to edit the files. The browser will auto-refresh every time you save in the terminal!
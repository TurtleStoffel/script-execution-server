const express = require('express');
const cors = require('cors');
const path = require('path');
const { startScriptHandler } = require('./handlers/start-script');
const { deleteWorktreeHandler } = require('./handlers/delete-worktree');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration: Root directory where all code repositories are located
const ROOT_CODE_DIR = path.join(process.env.HOME, 'coding');

app.use(cors()); // Allow all origins
app.use(express.json());

// Endpoints
app.post('/start-script', (req, res) => startScriptHandler(req, res, ROOT_CODE_DIR));
app.delete('/worktree/:worktree', (req, res) => deleteWorktreeHandler(req, res, ROOT_CODE_DIR));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

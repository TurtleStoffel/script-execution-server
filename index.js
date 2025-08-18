const express = require('express');
const cors = require('cors'); // Import cors middleware
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins
app.use(express.json());

// POST /start-script
app.post('/start-script', (req, res) => {
  const { argument } = req.body;
  if (typeof argument !== 'string') {
    return res.status(400).json({ error: 'Argument must be a string.' });
  }

  // Run code-insiders chat <argument> in ../llm-writing-assistant-worktree
  const child = spawn('code-insiders', ['chat', argument], {
    cwd: '../llm-writing-assistant-worktree',
    shell: true // Use shell for Windows compatibility
  });

  let output = '';
  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.stderr.on('data', (data) => {
    output += data.toString();
  });

  child.on('error', (err) => {
    return res.status(500).json({ error: 'Failed to start process', details: err.message });
  });

  child.on('close', (code) => {
    res.json({ output: output.trim(), exitCode: code });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

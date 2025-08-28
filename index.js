const express = require('express');
const cors = require('cors'); // Import cors middleware
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins
app.use(express.json());

app.post('/start-script', (req, res) => {
  const { argument } = req.body;
  if (typeof argument !== 'string') {
    return res.status(400).json({ error: 'Argument must be a string.' });
  }

  console.log(`Starting claude with argument: "${argument}"`);
  console.log(`Working directory: ../llm-writing-assistant-worktree`);

  // Direct call to claude -p
  const child = spawn('claude', ['-p', argument], {
    cwd: '../llm-writing-assistant-worktree',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  child.on('error', (err) => {
    console.error('Process error:', err);
    return res.status(500).json({ error: 'Failed to start claude', details: err.message });
  });

  child.on('close', (code) => {
    console.log(`Claude process exited with code: ${code}`);
    res.json({
      message: 'Claude process completed',
      exitCode: code,
      command: `claude -p "${argument}"`,
      stdout: stdout,
      stderr: stderr
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

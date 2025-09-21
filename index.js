const express = require('express');
const cors = require('cors'); // Import cors middleware
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins
app.use(express.json());

app.post('/start-script', (req, res) => {
  const { argument, workingDirectory, worktree } = req.body;
  if (typeof argument !== 'string') {
    return res.status(400).json({ error: 'Argument must be a string.' });
  }
  if (typeof workingDirectory !== 'string') {
    return res.status(400).json({ error: 'Working directory must be a string.' });
  }

  let targetWorkingDir = path.resolve(`../${workingDirectory}`);

  // Check if the working directory exists
  if (!fs.existsSync(targetWorkingDir)) {
    return res.status(400).json({ error: `Working directory does not exist: ${targetWorkingDir}` });
  }

  // If worktree is specified, create it and use it as the working directory
  if (worktree && typeof worktree === 'string') {
    const worktreeDir = path.resolve(`../${workingDirectory}-worktrees/${worktree}`);

    // Run script to create worktree
    const createWorktreeScript = path.join(__dirname, 'create-worktree.sh');
    const { execSync } = require('child_process');

    try {
      execSync(`bash "${createWorktreeScript}" "${workingDirectory}" "${worktree}"`, {
        cwd: __dirname,
        stdio: 'inherit'
      });
      targetWorkingDir = worktreeDir;
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to create worktree',
        details: error.message
      });
    }
  }

  console.log(`Opening new CLI window with claude argument: "${argument}"`);
  console.log(`Working directory: ${targetWorkingDir}`);

  // Open new CLI window with bash command
  const bashCommand = `claude "${argument}"`;
  const child = spawn('cmd', ['/c', 'start', '', 'C:\\Program Files\\Git\\bin\\bash.exe', '-c', bashCommand], {
    cwd: targetWorkingDir,
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
      command: `claude "${argument}"`,
      stdout: stdout,
      stderr: stderr
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

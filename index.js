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

  console.log(`Opening new terminal window with claude argument: "${argument}"`);
  console.log(`Working directory: ${targetWorkingDir}`);

  // Open new terminal window and run claude in it
  const script = `tell application "Terminal"
    do script "cd '${targetWorkingDir.replace(/'/g, "'\\''")}' && claude '${argument.replace(/'/g, "'\\''")}'\"
    activate
  end tell`;

  const child = spawn('osascript', ['-e', script], {
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

app.delete('/worktree/:worktree', (req, res) => {
  const { worktree } = req.params;
  const { workingDirectory } = req.body;
  
  if (!worktree || typeof worktree !== 'string') {
    return res.status(400).json({ error: 'Worktree name must be provided as a URL parameter.' });
  }
  
  if (!workingDirectory || typeof workingDirectory !== 'string') {
    return res.status(400).json({ error: 'Working directory must be provided in request body.' });
  }

  const targetWorkingDir = path.resolve(`../${workingDirectory}`);

  // Check if the working directory exists
  if (!fs.existsSync(targetWorkingDir)) {
    return res.status(400).json({ error: `Working directory does not exist: ${targetWorkingDir}` });
  }

  // Run script to remove worktree
  const removeWorktreeScript = path.join(__dirname, 'remove-worktree.sh');
  const { execSync } = require('child_process');

  try {
    execSync(`bash "${removeWorktreeScript}" "${workingDirectory}" "${worktree}"`, {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    res.json({
      message: 'Worktree removed successfully',
      worktree: worktree,
      workingDirectory: workingDirectory
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to remove worktree',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

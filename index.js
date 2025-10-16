const express = require('express');
const cors = require('cors'); // Import cors middleware
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration: Root directory where all code repositories are located
const ROOT_CODE_DIR = path.join(process.env.HOME, 'coding');

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

  let targetWorkingDir = path.resolve(ROOT_CODE_DIR, workingDirectory);

  // Check if the working directory exists
  if (!fs.existsSync(targetWorkingDir)) {
    return res.status(400).json({ error: `Working directory does not exist: ${targetWorkingDir}` });
  }

  // If worktree is specified, create it and use it as the working directory
  if (worktree && typeof worktree === 'string') {
    const worktreeDir = path.resolve(ROOT_CODE_DIR, `${workingDirectory}-worktrees`, worktree);

    // Run script to create worktree
    const createWorktreeScript = path.join(__dirname, 'create-worktree.sh');
    const { execSync } = require('child_process');

    try {
      execSync(`bash "${createWorktreeScript}" "${targetWorkingDir}" "${worktreeDir}"`, {
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

  // Modify argument if worktree is used - add commit and PR instructions
  let finalArgument = argument;
  if (worktree) {
    finalArgument = `${argument}. When you are done, create a commit and push it to the remote using the gh CLI. If there is no PR yet, create a PR to the main branch too.`;
  }

  console.log(`Opening new terminal window with claude argument: "${finalArgument}"`);
  console.log(`Working directory: ${targetWorkingDir}`);

  // Open new terminal window and run claude in it
  const script = `tell application "Terminal"
    do script "cd '${targetWorkingDir.replace(/'/g, "'\\''")}' && claude '${finalArgument.replace(/'/g, "'\\''")}'\"
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

  const targetWorkingDir = path.resolve(ROOT_CODE_DIR, workingDirectory);
  const worktreeDir = path.resolve(ROOT_CODE_DIR, `${workingDirectory}-worktrees`, worktree);

  // Check if the working directory exists
  if (!fs.existsSync(targetWorkingDir)) {
    return res.status(400).json({ error: `Working directory does not exist: ${targetWorkingDir}` });
  }

  // Run script to remove worktree
  const removeWorktreeScript = path.join(__dirname, 'remove-worktree.sh');
  const { execSync } = require('child_process');

  try {
    execSync(`bash "${removeWorktreeScript}" "${targetWorkingDir}" "${worktreeDir}"`, {
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

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Handler for the /start-script endpoint
 * Starts Claude in a new terminal window with the specified arguments
 */
async function startScriptHandler(req, res, rootCodeDir) {
  const { argument, workingDirectory, worktree } = req.body;

  // Validation
  if (typeof argument !== 'string') {
    return res.status(400).json({ error: 'Argument must be a string.' });
  }
  if (typeof workingDirectory !== 'string') {
    return res.status(400).json({ error: 'Working directory must be a string.' });
  }

  let targetWorkingDir = path.resolve(rootCodeDir, workingDirectory);

  // Check if the working directory exists
  if (!fs.existsSync(targetWorkingDir)) {
    return res.status(400).json({ error: `Working directory does not exist: ${targetWorkingDir}` });
  }

  // If worktree is specified, create it and use it as the working directory
  if (worktree && typeof worktree === 'string') {
    const worktreeDir = path.resolve(rootCodeDir, `${workingDirectory}-worktrees`, worktree);

    // Run script to create worktree
    const createWorktreeScript = path.join(__dirname, '..', 'create-worktree.sh');

    try {
      execSync(`bash "${createWorktreeScript}" "${targetWorkingDir}" "${worktreeDir}"`, {
        cwd: path.join(__dirname, '..'),
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
}

module.exports = { startScriptHandler };

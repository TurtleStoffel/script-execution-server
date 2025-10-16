const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Handler for the DELETE /worktree/:worktree endpoint
 * Removes a git worktree
 */
function deleteWorktreeHandler(req, res) {
  const { worktree } = req.params;
  const { workingDirectory } = req.body;

  // Validation
  if (!worktree || typeof worktree !== 'string') {
    return res.status(400).json({ error: 'Worktree name must be provided as a URL parameter.' });
  }

  if (!workingDirectory || typeof workingDirectory !== 'string') {
    return res.status(400).json({ error: 'Working directory must be provided in request body.' });
  }

  const targetWorkingDir = path.resolve(config.ROOT_CODE_DIR, workingDirectory);
  const worktreeDir = path.resolve(config.ROOT_CODE_DIR, `${workingDirectory}-worktrees`, worktree);

  // Check if the working directory exists
  if (!fs.existsSync(targetWorkingDir)) {
    return res.status(400).json({ error: `Working directory does not exist: ${targetWorkingDir}` });
  }

  // Run script to remove worktree
  const removeWorktreeScript = path.join(__dirname, '..', 'remove-worktree.sh');

  try {
    execSync(`bash "${removeWorktreeScript}" "${targetWorkingDir}" "${worktreeDir}"`, {
      cwd: path.join(__dirname, '..'),
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
}

module.exports = { deleteWorktreeHandler };

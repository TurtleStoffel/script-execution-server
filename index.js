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

  console.log(`Starting claude with argument: "${argument}"`);
  console.log(`Working directory: ../llm-writing-assistant-worktree`);

  // Open new command prompt window with bash running claude command
  const child = spawn('cmd', [
    '/c', 'start', 'cmd', '/k', 
    `bash -c "cd ../llm-writing-assistant-worktree && claude '${argument}'; read -p 'Press Enter to close...'"`
  ], {
    detached: true,
    stdio: 'ignore'
  });

  console.log(`Terminal opened with PID: ${child.pid}`);

  child.unref(); // Allow parent process to exit independently

  child.on('error', (err) => {
    console.error('Process error:', err);
    return res.status(500).json({ error: 'Failed to start terminal', details: err.message });
  });

  child.on('spawn', () => {
    console.log('Terminal spawned successfully');
  });

  // Respond immediately since process is detached
  res.json({ 
    message: 'Claude session started in new Windows Terminal',
    pid: child.pid,
    command: `claude "${argument}"`
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

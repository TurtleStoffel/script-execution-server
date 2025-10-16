const express = require('express');
const cors = require('cors');
const config = require('./config');
const { startScriptHandler } = require('./handlers/start-script');
const { deleteWorktreeHandler } = require('./handlers/delete-worktree');

const app = express();

app.use(cors()); // Allow all origins
app.use(express.json());

// Endpoints
app.post('/start-script', startScriptHandler);
app.delete('/worktree/:worktree', deleteWorktreeHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

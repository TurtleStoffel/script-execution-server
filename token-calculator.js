const fs = require('fs');

/**
 * Calculate token usage from a Claude Code project history file
 * @param {string} filePath - Path to the .jsonl history file
 * @returns {Object} Token usage statistics
 */
function calculateTokenUsage(filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read the JSONL file
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  // Initialize counters
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let cacheCreationTokens = 0;
  let cacheReadTokens = 0;
  let ephemeral5mTokens = 0;
  let ephemeral1hTokens = 0;
  let messageCount = 0;

  // Process each line
  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);

      // Only process assistant messages with usage data
      if (entry.type === 'assistant' && entry.message && entry.message.usage) {
        const usage = entry.message.usage;
        messageCount++;

        // Add up the tokens
        totalInputTokens += usage.input_tokens || 0;
        totalOutputTokens += usage.output_tokens || 0;
        cacheCreationTokens += usage.cache_creation_input_tokens || 0;
        cacheReadTokens += usage.cache_read_input_tokens || 0;

        // Handle cache_creation object if it exists
        if (usage.cache_creation) {
          ephemeral5mTokens += usage.cache_creation.ephemeral_5m_input_tokens || 0;
          ephemeral1hTokens += usage.cache_creation.ephemeral_1h_input_tokens || 0;
        }
      }
    } catch (error) {
      console.error(`Warning: Failed to parse line: ${error.message}`);
    }
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    ephemeral5mTokens,
    ephemeral1hTokens,
    messageCount,
    totalTokens: totalInputTokens + totalOutputTokens,
  };
}

module.exports = { calculateTokenUsage };

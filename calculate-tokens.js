#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Calculate token usage from a Claude Code project history file
 * Usage: node calculate-tokens.js <path-to-history-file.jsonl>
 */

function calculateTokenUsage(filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
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

function formatNumber(num) {
  return num.toLocaleString();
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node calculate-tokens.js <path-to-history-file.jsonl>');
    console.error('');
    console.error('Example:');
    console.error('  node calculate-tokens.js ~/.claude/projects/-Users-stefan-coding/session-id.jsonl');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  console.log(`\nAnalyzing: ${filePath}\n`);

  const stats = calculateTokenUsage(filePath);

  console.log('='.repeat(60));
  console.log('TOKEN USAGE SUMMARY');
  console.log('='.repeat(60));
  console.log();
  console.log('Messages processed:', formatNumber(stats.messageCount));
  console.log();
  console.log('Token Breakdown:');
  console.log('-'.repeat(60));
  console.log(`  Input tokens:              ${formatNumber(stats.totalInputTokens)}`);
  console.log(`  Output tokens:             ${formatNumber(stats.totalOutputTokens)}`);
  console.log(`  Cache creation tokens:     ${formatNumber(stats.cacheCreationTokens)}`);
  console.log(`  Cache read tokens:         ${formatNumber(stats.cacheReadTokens)}`);

  if (stats.ephemeral5mTokens > 0 || stats.ephemeral1hTokens > 0) {
    console.log();
    console.log('Cache Creation Details:');
    console.log('-'.repeat(60));
    console.log(`  Ephemeral 5m tokens:       ${formatNumber(stats.ephemeral5mTokens)}`);
    console.log(`  Ephemeral 1h tokens:       ${formatNumber(stats.ephemeral1hTokens)}`);
  }

  console.log();
  console.log('='.repeat(60));
  console.log(`TOTAL TOKENS:                ${formatNumber(stats.totalTokens)}`);
  console.log('='.repeat(60));
  console.log();
}

// Run the script
main();

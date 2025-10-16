#!/usr/bin/env node

const path = require('path');
const { calculateTokenUsage } = require('./token-calculator');

/**
 * CLI script to calculate token usage from a Claude Code project history file
 * Usage: node calculate-tokens.js <path-to-history-file.jsonl>
 */

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

  let stats;
  try {
    stats = calculateTokenUsage(filePath);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

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

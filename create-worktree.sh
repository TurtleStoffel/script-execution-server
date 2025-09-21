#!/bin/bash

# create-worktree.sh
# Creates a git worktree for the specified repository

# Arguments:
# $1 - working directory name (relative to parent directory)
# $2 - worktree name

if [ $# -ne 2 ]; then
    echo "Usage: $0 <working-directory> <worktree-name>"
    exit 1
fi

WORKING_DIR="$1"
WORKTREE_NAME="$2"

# Path to the source repository
SOURCE_REPO="../$WORKING_DIR"

# Path where worktrees will be created
WORKTREES_BASE="../$WORKING_DIR-worktrees"
WORKTREE_PATH="$WORKTREES_BASE/$WORKTREE_NAME"

# Check if source repository exists
if [ ! -d "$SOURCE_REPO" ]; then
    echo "Error: Source repository does not exist: $SOURCE_REPO"
    exit 1
fi

# Check if source is a git repository
if [ ! -d "$SOURCE_REPO/.git" ]; then
    echo "Error: Source directory is not a git repository: $SOURCE_REPO"
    exit 1
fi

# Create worktrees base directory if it doesn't exist
if [ ! -d "$WORKTREES_BASE" ]; then
    echo "Creating worktrees base directory: $WORKTREES_BASE"
    mkdir -p "$WORKTREES_BASE"
fi

# Check if worktree already exists
if [ -d "$WORKTREE_PATH" ]; then
    echo "Worktree already exists: $WORKTREE_PATH"
    echo "Using existing worktree"
    exit 0
fi

echo "Creating worktree: $WORKTREE_PATH"
echo "Source repository: $SOURCE_REPO"

# Navigate to source repository and create worktree
cd "$SOURCE_REPO" || exit 1

# Create worktree from current branch
git worktree add "$WORKTREE_PATH"

if [ $? -eq 0 ]; then
    echo "Successfully created worktree: $WORKTREE_PATH"
else
    echo "Failed to create worktree"
    exit 1
fi
#!/bin/bash

# remove-worktree.sh
# Removes a git worktree for the specified repository

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

# Path where worktrees are located
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

# Check if worktree exists
if [ ! -d "$WORKTREE_PATH" ]; then
    echo "Error: Worktree does not exist: $WORKTREE_PATH"
    exit 1
fi

echo "Removing worktree: $WORKTREE_PATH"
echo "Source repository: $SOURCE_REPO"

# Navigate to source repository and remove worktree
cd "$SOURCE_REPO" || exit 1

# Remove worktree
git worktree remove "$WORKTREE_PATH"

if [ $? -eq 0 ]; then
    echo "Successfully removed worktree: $WORKTREE_PATH"
    
    # Clean up empty worktrees base directory if it's empty
    if [ -d "$WORKTREES_BASE" ] && [ -z "$(ls -A "$WORKTREES_BASE")" ]; then
        echo "Removing empty worktrees directory: $WORKTREES_BASE"
        rmdir "$WORKTREES_BASE"
    fi
else
    echo "Failed to remove worktree"
    exit 1
fi
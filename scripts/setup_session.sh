#!/bin/bash
# Othello プロジェクト - セッション初期化スクリプト
# デスクトップ版・Web版 Claude Code 共通で実行されます

set -e

IS_REMOTE="${CLAUDE_CODE_REMOTE:-false}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# 環境変数の永続化
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=development' >> "$CLAUDE_ENV_FILE"
fi

# Web環境（リモート）専用のセットアップ
if [ "$IS_REMOTE" = "true" ]; then
  # package.json が存在し、node_modules が未インストールの場合
  if [ -f "$PROJECT_DIR/package.json" ] && [ ! -d "$PROJECT_DIR/node_modules" ]; then
    cd "$PROJECT_DIR"
    npm install --silent 2>/dev/null || true
  fi
fi

exit 0

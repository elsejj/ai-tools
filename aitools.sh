#!/usr/bin/env bash

# 切换到脚本所在目录（兼容符号链接）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Electron 可执行文件相对路径
EXEC="./node_modules/electron/dist/electron"

# 如果文件不存在，提示并退出
if [ ! -f "$EXEC" ]; then
	echo "Error: $EXEC not found in $SCRIPT_DIR" >&2
	exit 2
fi

# 尝试确保可执行权限（若失败也继续尝试运行）
if [ ! -x "$EXEC" ]; then
	chmod +x "$EXEC" 2>/dev/null || true
fi

# 用 exec 替换当前进程，传入 --no-sandbox
"$EXEC" --no-sandbox out/main/index.js


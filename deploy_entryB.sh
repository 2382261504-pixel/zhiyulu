#!/usr/bin/env bash
# 知识星球·知遇录 —— 部署到入口 B（CloudBase /zhiyulu）
# 用法（Git Bash）： cd 到 zhiyulu 目录后执行  bash deploy_entryB.sh
#
# 铁律（来自项目记忆，勿改）：
#  - tcb 必须用 node.exe 以 Windows 绝对路径调 node_modules/@cloudbase/cli/bin/tcb，
#    不可直接跑 tcb.cmd / 413字节 wrapper（Git Bash 下会报 No such file）。
#  - 干净暂存目录只含 index/poster/go/_root_redirect/cloudbaserc/.gitignore + assets，
#    剔除 .git / zhiyu-api / _publish / tools / output。
#  - 事后用 mv 归集暂存目录，勿用 rm。
set -e

ZHIYULU="$(cd "$(dirname "$0")" && pwd)"
ZHIYULU_W="$(cygpath -w "$ZHIYULU" 2>/dev/null || echo "$ZHIYULU")"
NODE13="C:/Users/解晨飞/.workbuddy/binaries/node/versions/22.22.2-3/node.exe"
TCB="C:/Users/解晨飞/.workbuddy/binaries/node/cli-connector-packages/node_modules/@cloudbase/cli/bin/tcb"
ENTRY="https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu"

echo "=== [1/5] 语法校验 ==="
"$NODE13" --check "$ZHIYULU_W/assets/js/app.js" && echo "APP_OK"
"$NODE13" --check "$ZHIYULU_W/assets/js/lixuan.js" && echo "LIXUAN_OK"

echo "=== [2/5] 干净暂存目录 ==="
cd "$ZHIYULU"
rm -rf _stg && mkdir _stg
cp index.html poster.html go.html _root_redirect.html cloudbaserc.json .gitignore _stg/ 2>/dev/null || true
cp -r assets _stg/
echo "app.js bytes: $(wc -c < _stg/assets/js/app.js)"

echo "=== [3/5] tcb hosting deploy -> /zhiyulu ==="
cd _stg
"$NODE13" "$TCB" hosting deploy . /zhiyulu --yes

echo "=== [4/5] 校验线上版本号 ==="
curl -s -H "Cache-Control: no-cache" "$ENTRY/index.html" | grep -o "app.js?v=[0-9]*" | head -1

echo "=== [5/5] mv 归档暂存目录 (勿用 rm) ==="
cd "$ZHIYULU"
TS=$(date +%Y%m%d%H%M%S)
mv _stg "output/_stg_entryB_$TS" && echo "归档 -> output/_stg_entryB_$TS"

echo "=== 完成 ==="

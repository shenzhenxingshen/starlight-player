set -euo pipefail

REPO_URL="https://github.com/shenzhenxingshen/starlight-player.git"

echo "== 0) 基础配置（只需一次） =="
git config --global credential.helper osxkeychain
# 如未配置过用户名邮箱，取消下面两行注释并改成你的
# git config --global user.name "你的GitHub用户名"
# git config --global user.email "你的GitHub邮箱"

echo "== 1) 备份当前分支（防误操作） =="
BACKUP_BRANCH="backup/pre-github-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
echo "backup branch => $BACKUP_BRANCH"

echo "== 2) 补充 .gitignore（幂等追加） =="
cat >> .gitignore <<'EOF'

# --- publish hygiene ---
.env
.env.*
!.env.example
android/local.properties
build.log
*.idsig
*.backup
*.bak
.joycode/
migrated_prompt_history/
temp_icon/
EOF

echo "== 3) 清理不应入库文件（仅从Git索引移除，不删本地） =="
git rm -r --cached --ignore-unmatch node_modules dist dist-ssr
git rm -r --cached --ignore-unmatch android/build android/.gradle android/app/build android/app/release
git rm -r --cached --ignore-unmatch .joycode migrated_prompt_history temp_icon
git rm --cached --ignore-unmatch my-release-key.jks android/local.properties build.log

find . -type f \( \
  -name "*.apk" -o -name "*.aab" -o -name "*.idsig" -o \
  -name "*.jks" -o -name "*.keystore" -o \
  -name "*.bak" -o -name "*.backup" \
\) -print0 | xargs -0 -I{} git rm --cached --ignore-unmatch "{}" || true

echo "== 4) 提交清理变更 =="
git add -A
git commit -m "chore: prepare public release v0.1.0" || echo "No changes to commit"

echo "== 5) 确保在 main 分支 =="
CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  git checkout -B main
fi

echo "== 6) 绑定远程并推送 main =="
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git remote -v
git push -u origin main

echo "== 7) 创建 release-v0.1.0 并推送 =="
git checkout -b release-v0.1.0
git push -u origin release-v0.1.0

echo "== 8) 打 v0.1.0 tag 并推送 =="
git tag -a v0.1.0 -m "星光播放器 v0.1.0"
git push origin v0.1.0

echo "== 9) 创建 develop-v0.2.0 并推送 =="
git checkout main
git checkout -b develop-v0.2.0
git push -u origin develop-v0.2.0

echo "== 完成 =="
git branch -a
git tag -n

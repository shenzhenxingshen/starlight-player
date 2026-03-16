# 念佛机应用离线化执行清单

## 📋 执行前检查

- [ ] 确保有稳定的网络连接（下载约153MB资源）
- [ ] 确保有足够的磁盘空间（至少200MB）
- [ ] 确保已安装Node.js（v16+）和npm
- [ ] 确保已安装curl命令

## 🚀 执行步骤

### 步骤1: 下载资源（预计5-10分钟）

```bash
cd /Users/litao.2025/Downloads/nianfoji-v20260309-v1
bash scripts/offline-migration.sh
```

**检查点**:
- [ ] 字体文件已下载（6个woff2文件，约2MB）
- [ ] 封面图片已下载（1个gif文件，约500KB）
- [ ] 音频文件已下载（21个mp3文件，约150MB）
- [ ] Tailwind CSS依赖已安装

### 步骤2: 生成配置文件（预计1分钟）

```bash
node scripts/generate-configs.js
```

**检查点**:
- [ ] tailwind.config.js 已生成
- [ ] src/index.css 已生成
- [ ] constants.tsx 已修改（备份为.backup）
- [ ] index.html 已修改（备份为.backup）
- [ ] index.tsx 已修改

### 步骤3: 安装依赖（预计2-3分钟）

```bash
npm install
```

**检查点**:
- [ ] node_modules 目录已创建
- [ ] package-lock.json 已生成
- [ ] 无错误信息

### 步骤4: 构建应用（预计1-2分钟）

```bash
npm run build
```

**检查点**:
- [ ] dist 目录已创建
- [ ] dist/index.html 存在
- [ ] dist/assets 目录存在
- [ ] dist/fonts 目录存在
- [ ] 无构建错误

### 步骤5: 预览测试（预计5分钟）

```bash
npm run preview
```

**检查点**:
- [ ] 浏览器自动打开 http://localhost:4173
- [ ] 页面样式正常显示
- [ ] 字体正确加载
- [ ] 图标正常显示
- [ ] 封面图片正常显示
- [ ] 音频可以正常播放
- [ ] 歌词同步显示正常

### 步骤6: 离线测试（预计3分钟）

1. 在浏览器中打开应用
2. 等待所有资源加载完成
3. 打开开发者工具（F12）
4. 切换到 Application > Service Workers
5. 确认 Service Worker 已激活
6. **断开网络连接**
7. 刷新页面

**检查点**:
- [ ] 页面仍然可以正常加载
- [ ] 所有功能正常工作
- [ ] 音频可以正常播放
- [ ] 无网络请求失败

## ✅ 完成验证

### 浏览器开发者工具检查

1. **Network 标签**
   - [ ] 所有资源状态为 200 或 304
   - [ ] 无 404 错误
   - [ ] 无外部CDN请求

2. **Application 标签**
   - [ ] Service Worker 状态为 "activated"
   - [ ] Cache Storage 包含两个缓存:
     - [ ] zen-chant-v11-offline
     - [ ] zen-chant-audio-offline

3. **Console 标签**
   - [ ] 无错误信息
   - [ ] 无警告信息（或仅有非关键警告）

### 功能测试

- [ ] 播放器可以正常播放音频
- [ ] 可以切换不同曲目
- [ ] 歌词同步显示正确
- [ ] 播放进度条可以拖动
- [ ] 音量控制正常
- [ ] 播放列表显示正常
- [ ] 设置页面功能正常

### 离线功能测试

- [ ] 断网后刷新页面仍可正常使用
- [ ] 断网后可以播放已缓存的音频
- [ ] 断网后所有UI功能正常

## 🎉 完成！

如果所有检查点都已勾选，恭喜您！念佛机应用已成功离线化。

## 🔧 问题排查

### 如果遇到问题

1. **资源下载失败**
   ```bash
   # 重新运行下载脚本
   bash scripts/offline-migration.sh
   ```

2. **构建失败**
   ```bash
   # 清理并重新安装
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Service Worker不工作**
   - 清除浏览器缓存
   - 使用隐身模式测试
   - 确保使用 localhost 或 HTTPS

4. **音频无法播放**
   - 检查音频文件是否完整下载
   - 检查浏览器控制台错误信息
   - 尝试不同的浏览器

## 📞 获取帮助

- 查看 `OFFLINE_MIGRATION_REPORT.md` 了解技术细节
- 查看 `QUICK_START.md` 了解详细步骤
- 查看 `README_OFFLINE.md` 了解项目总结

---

**执行时间**: ___________  
**执行人**: ___________  
**完成状态**: [ ] 成功 [ ] 失败  
**备注**: ___________

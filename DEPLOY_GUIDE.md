# 知遇录首页简介更新 - 完整部署指南

## 部署状态
- ✅ 本地文件已更新（2026-09-13 21:12）
- ❌ 线上部署尚未完成

## 更新内容回顾
新首页简介文案：
```
<section class="hero">
  <h1>知遇录</h1>
  <p class="hero-positioning muted">知遇录记得你走过的每一步，陪你成为一个更好的人。</p>
  <p class="hero-sub">长在知乎生态的「个人成长操作系统」</p>
  <p class="hero-desc">把知乎上真实走过的路，重新组织成你自己的下一步：看清自己、借前人校准方向、把方法炼成自己的、把成长写成生命之书。</p>
  <div class="cta"><a href="#self"><button>从「认识自己」开始 →</button></a></div>
</section>
```

## 本地文件状态
- `assets/js/app.js`: 已更新（包含新文案）
- `index.html`: 已更新（版本号为 2026091321）
- `cloudbaserc.json`: 存在（环境配置正确）

## 立即部署步骤

### 方法1：使用npm全局安装的TCB CLI
```bash
# 1. 安装TCB CLI（如果尚未安装）
npm install -g @cloudbase/cli

# 2. 登录腾讯云开发
tcb login

# 3. 切换到项目目录
cd "D:/WPS/843531481/WPS云盘/工作项目/知乎黑客松比赛/zhiyulu"

# 4. 执行部署
tcb hosting deploy . /zhiyulu --yes
```

### 方法2：使用npx（无需全局安装）
```bash
# 1. 切换到项目目录
cd "D:/WPS/843531481/WPS云盘/工作项目/知乎黑客松比赛/zhiyulu"

# 2. 使用npx执行部署
npx @cloudbase/cli hosting deploy . /zhiyulu --yes
```

### 方法3：使用简化的npx命令
```bash
# 1. 切换到项目目录
cd "D:/WPS/843531481/WPS云盘/工作项目/知乎黑客松比赛/zhiyulu"

# 2. 执行部署
npx tcb hosting deploy . /zhiyulu --yes
```

## 验证部署成功
部署完成后，访问以下URL验证：
https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/

检查首页是否显示新文案：
- "知遇录记得你走过的每一步，陪你成为一个更好的人。"
- "长在知乎生态的「个人成长操作系统」"
- "把知乎上真实走过的路，重新组织成你自己的下一步..."

## 故障排除

### 如果提示未登录
```bash
tcb login
```

### 如果提示环境不存在
检查 cloudbaserc.json 文件中的 envId 是否正确

### 如果部署失败
1. 检查网络连接
2. 确认有部署权限
3. 查看错误信息并解决相应问题

## 紧急回滚方案
如果新版本有问题，可以通过以下方式回滚：
1. 恢复旧版本的 app.js 和 index.html
2. 重新部署旧版本文件
3. 或联系腾讯云技术支持

## 注意事项
- 部署前请确保所有文件已保存
- 部署过程中不要中断连接
- 部署完成后，可能需要等待几分钟才能看到效果（CDN缓存）
- 版本号已更新，确保浏览器加载最新资源
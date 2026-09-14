# 知遇录首页简介更新部署检查清单

## 更新内容
- 首页简介文案已更新为：
  ```
  <section class="hero">
    <h1>知遇录</h1>
    <p class="hero-positioning muted">知遇录记得你走过的每一步，陪你成为一个更好的人。</p>
    <p class="hero-sub">长在知乎生态的「个人成长操作系统」</p>
    <p class="hero-desc">把知乎上真实走过的路，重新组织成你自己的下一步：看清自己、借前人校准方向、把方法炼成自己的、把成长写成生命之书。</p>
    <div class="cta"><a href="#self"><button>从「认识自己」开始 →</button></a></div>
  </section>
  ```

## 已完成的本地修改
- [x] 更新了 `assets/js/app.js` 中的首页内容
- [x] 更新了 `index.html` 中的 app.js 版本号为 `2026091321`
- [x] 更新了 `index.html` 中的 style.css 版本号为 `2026091321`
- [x] 检查了 JavaScript 语法，无错误

## 部署前检查
- [ ] 确认已登录腾讯云开发 CLI (`tcb login`)
- [ ] 确认当前目录为 `D:\WPS\843531481\WPS云盘\工作项目\知乎黑客松比赛\zhiyulu`
- [ ] 确认 `cloudbaserc.json` 配置文件存在且配置正确

## 部署命令
在项目根目录执行以下命令：
```bash
tcb hosting deploy . /zhiyulu --yes
```

## 部署后验证
- [ ] 访问 https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/
- [ ] 确认首页显示新的简介文案
- [ ] 确认版本号已更新（检查浏览器开发者工具的 Network 标签页）

## 备用部署方法
如果上述方法不工作，可以尝试：
1. 使用腾讯云开发控制台手动上传文件
2. 或使用以下命令：
   ```bash
   npx @cloudbase/cli hosting deploy . /zhiyulu --yes
   ```

## 回滚方案
如果出现问题，可以从以下备份恢复：
- `assets/js/app.js` 的备份文件在 `output/` 目录中
- 原始版本号为 `2026091320`
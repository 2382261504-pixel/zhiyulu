#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
备用部署脚本 - 尝试多种方式部署到腾讯云开发
"""

import os
import subprocess
import sys
import tempfile
import shutil
from pathlib import Path

def try_multiple_deploy_methods():
    """
    尝试多种部署方法
    """
    project_path = Path(r"D:\WPS\843531481\WPS云盘\工作项目\知乎黑客松比赛\zhiyulu")
    
    if not project_path.exists():
        print(f"❌ 项目路径不存在: {project_path}")
        return False
    
    os.chdir(project_path)
    print(f"✅ 切换到项目目录: {os.getcwd()}")
    
    # 检查配置文件
    config_file = project_path / "cloudbaserc.json"
    if not config_file.exists():
        print("❌ 未找到 cloudbaserc.json 配置文件")
        return False
    
    print("✅ 找到 cloudbaserc.json 配置文件")
    
    # 定义多种部署方法
    methods = [
        {
            "name": "直接tcb命令",
            "cmd": ["tcb", "hosting", "deploy", ".", "/zhiyulu", "--yes"]
        },
        {
            "name": "npx tcb命令",
            "cmd": ["npx", "@cloudbase/cli", "hosting", "deploy", ".", "/zhiyulu", "--yes"]
        },
        {
            "name": "npx tcb简写",
            "cmd": ["npx", "tcb", "hosting", "deploy", ".", "/zhiyulu", "--yes"]
        }
    ]
    
    success = False
    for method in methods:
        print(f"\n🔄 尝试部署方法: {method['name']}")
        print(f"   命令: {' '.join(method['cmd'])}")
        
        try:
            result = subprocess.run(
                method['cmd'],
                capture_output=True,
                text=True,
                timeout=300  # 5分钟超时
            )
            
            if result.returncode == 0:
                print(f"✅ {method['name']} 成功!")
                print(f"   输出: {result.stdout[-300:]}")  # 显示最后300个字符
                success = True
                break
            else:
                print(f"❌ {method['name']} 失败")
                print(f"   错误: {result.stderr[:500]}")  # 显示前500个字符
                
        except subprocess.TimeoutExpired:
            print(f"❌ {method['name']} 超时")
        except FileNotFoundError:
            print(f"❌ {method['name']} 命令未找到")
        except Exception as e:
            print(f"❌ {method['name']} 发生错误: {e}")
    
    return success

def manual_deploy_instructions():
    """
    提供手动部署说明
    """
    print("\n" + "="*60)
    print("手动部署说明")
    print("="*60)
    print("如果自动部署失败，请按以下步骤手动部署：")
    print()
    print("1. 确保已安装腾讯云开发命令行工具：")
    print("   npm install -g @cloudbase/cli")
    print()
    print("2. 登录腾讯云开发：")
    print("   tcb login")
    print()
    print("3. 切换到项目目录并执行部署：")
    print("   cd \"D:/WPS/843531481/WPS云盘/工作项目/知乎黑客松比赛/zhiyulu\"")
    print("   tcb hosting deploy . /zhiyulu --yes")
    print()
    print("4. 或使用 npx 方式（无需全局安装）：")
    print("   npx @cloudbase/cli hosting deploy . /zhiyulu --yes")
    print()
    print("部署完成后，访问：")
    print("https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/")
    print("="*60)

def main():
    print("🔄 尝试自动部署...")
    success = try_multiple_deploy_methods()
    
    if success:
        print("\n🎉 部署成功！")
        print("新首页简介现在应该已上线。")
    else:
        print("\n❌ 自动部署失败")
        manual_deploy_instructions()
        
        # 提供本地验证信息
        print("\n📋 本地文件状态确认：")
        app_js = Path("assets/js/app.js")
        index_html = Path("index.html")
        
        if app_js.exists():
            content = app_js.read_text(encoding='utf-8')
            if '知遇录记得你走过的每一步，陪你成为一个更好的人' in content:
                print("✅ app.js 包含新文案")
            else:
                print("❌ app.js 未包含新文案")
        
        if index_html.exists():
            content = index_html.read_text(encoding='utf-8')
            if 'app.js?v=2026091321' in content:
                print("✅ index.html 版本号已更新")
            else:
                print("❌ index.html 版本号未更新")

if __name__ == "__main__":
    main()
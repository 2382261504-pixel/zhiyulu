import os
import subprocess
import sys
import time
from pathlib import Path

def deploy_zhiyulu_to_cloudbase():
    """
    部署知遇录到腾讯云开发
    """
    print("🚀 开始部署知遇录到腾讯云开发...")
    
    project_path = Path(r"D:\WPS\843531481\WPS云盘\工作项目\知乎黑客松比赛\zhiyulu")
    
    if not project_path.exists():
        print(f"❌ 项目路径不存在: {project_path}")
        return False
    
    # 切换到项目目录
    os.chdir(project_path)
    print(f"✅ 当前工作目录: {os.getcwd()}")
    
    # 检查必需的文件
    required_files = [
        "index.html",
        "assets/js/app.js",
        "assets/css/style.css"
    ]
    
    for file in required_files:
        if not (project_path / file).exists():
            print(f"❌ 缺少必需文件: {file}")
            return False
    
    print("✅ 所有必需文件存在")
    
    # 检查 tcb 命令是否可用
    try:
        # 尝试使用全局安装的 tcb
        result = subprocess.run(["tcb", "--version"], 
                                capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            tcb_cmd = ["tcb"]
            print(f"✅ 找到全局 tcb: {result.stdout.strip()}")
        else:
            # 尝试使用 npx
            result = subprocess.run(["npx", "tcb", "--version"], 
                                    capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                tcb_cmd = ["npx", "tcb"]
                print(f"✅ 找到 npx tcb: {result.stdout.strip()}")
            else:
                print("❌ 未找到 tcb 命令")
                print("   请先安装: npm install -g @cloudbase/cli")
                return False
    except Exception as e:
        print(f"❌ 检查 tcb 命令失败: {e}")
        # 如果检查失败，仍然尝试使用 npx
        tcb_cmd = ["npx", "tcb"]
        print("   将尝试使用 npx tcb")
    
    # 执行部署命令
    try:
        print("⏳ 开始部署到腾讯云开发...")
        print(f"   命令: {' '.join(tcb_cmd + ['hosting', 'deploy', '.', '/zhiyulu', '--yes'])}")
        
        start_time = time.time()
        result = subprocess.run(
            tcb_cmd + ["hosting", "deploy", ".", "/zhiyulu", "--yes"],
            capture_output=True,
            text=True,
            timeout=600  # 10分钟超时
        )
        elapsed = time.time() - start_time
        
        if result.returncode == 0:
            print(f"✅ 部署成功! (耗时: {elapsed:.1f}秒)")
            print(f"   输出: {result.stdout[:500]}...")  # 只显示前500字符
            return True
        else:
            print(f"❌ 部署失败")
            print(f"   错误: {result.stderr}")
            print(f"   输出: {result.stdout}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ 部署超时 (超过10分钟)")
        return False
    except Exception as e:
        print(f"❌ 部署过程中发生错误: {e}")
        return False

def main():
    print("=" * 60)
    print("知遇录部署工具")
    print("=" * 60)
    
    success = deploy_zhiyulu_to_cloudbase()
    
    print("=" * 60)
    if success:
        print("🎉 部署成功!")
        print("   访问地址: https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/")
        print("   新首页简介现在应该生效了")
    else:
        print("❌ 部署失败，请检查错误信息")
        print("   可能需要:")
        print("   1. 确保已安装 @cloudbase/cli: npm install -g @cloudbase/cli")
        print("   2. 确保已登录: tcb login")
        print("   3. 检查 cloudbaserc.json 配置")
    print("=" * 60)

if __name__ == "__main__":
    main()
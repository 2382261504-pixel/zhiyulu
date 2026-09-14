import os
import subprocess
import sys
import time
from pathlib import Path

def deploy_with_node():
    """
    使用node直接执行部署
    """
    project_path = Path(r"D:\WPS\843531481\WPS云盘\工作项目\知乎黑客松比赛\zhiyulu")
    
    if not project_path.exists():
        print(f"❌ 项目路径不存在: {project_path}")
        return False
    
    os.chdir(project_path)
    print(f"✅ 切换到项目目录: {os.getcwd()}")
    
    # 尝试直接使用node执行tcb命令
    try:
        node_path = r"C:\Users\解晨飞\.workbuddy\binaries\node\versions\22.22.2-3\node.exe"
        tcb_path = r"C:\Users\解晨飞\.workbuddy\binaries\node\workspace\node_modules\@cloudbase\cli\bin\tcb.js"
        
        if not os.path.exists(tcb_path):
            print("❌ 未找到tcb.js文件")
            # 尝试安装tcb cli
            print("尝试安装 @cloudbase/cli...")
            result = subprocess.run([node_path, "-e", "require('child_process').execSync('npm install @cloudbase/cli --no-save', {stdio: 'inherit'})"], timeout=300)
            if result.returncode != 0:
                print("❌ 安装 @cloudbase/cli 失败")
                return False
        
        print("✅ 开始部署...")
        start_time = time.time()
        
        # 执行部署命令
        result = subprocess.run([
            node_path,
            tcb_path,
            "hosting",
            "deploy",
            ".",
            "/zhiyulu",
            "--yes"
        ], capture_output=True, text=True, timeout=600)
        
        elapsed = time.time() - start_time
        
        if result.returncode == 0:
            print(f"✅ 部署成功! (耗时: {elapsed:.1f}秒)")
            print(f"输出: {result.stdout[-500:]}")  # 显示最后500个字符
            return True
        else:
            print(f"❌ 部署失败")
            print(f"错误: {result.stderr}")
            print(f"输出: {result.stdout}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ 部署超时")
        return False
    except Exception as e:
        print(f"❌ 部署错误: {e}")
        return False

if __name__ == "__main__":
    print("🚀 使用node直接执行部署...")
    success = deploy_with_node()
    
    if success:
        print("\n🎉 部署成功！")
        print("新文案现在应该是：知遇录记得你走过的每一步，让AI陪你成为一个更好的人。")
        print("访问地址: https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/")
    else:
        print("\n❌ 部署失败，请检查错误信息")
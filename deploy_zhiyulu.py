import os
import subprocess
import sys

def deploy_to_tencent_cloudbase():
    """部署知遇录前端到腾讯云开发"""
    try:
        # 切换到项目目录
        project_path = r"D:\WPS\843531481\WPS云盘\工作项目\知乎黑客松比赛\zhiyulu"
        os.chdir(project_path)
        
        print(f"当前工作目录: {os.getcwd()}")
        
        # 检查必要的文件是否存在
        required_files = ['index.html', 'assets/js/app.js']
        for file in required_files:
            if not os.path.exists(file):
                print(f"错误: 缺少必要文件 {file}")
                return False
        
        print("文件检查通过")
        
        # 使用 subprocess 调用 tcb 命令
        try:
            # 检查 tcb 是否已安装
            result = subprocess.run(['npx', 'tcb', '--version'], 
                                    capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                print(f"TCB CLI 检查失败: {result.stderr}")
                return False
            print(f"TCB CLI 版本: {result.stdout.strip()}")
            
            # 执行部署命令
            print("开始部署...")
            deploy_cmd = ['npx', 'tcb', 'hosting', 'deploy', '.', '/zhiyulu', '--yes']
            result = subprocess.run(deploy_cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                print("部署成功!")
                print(result.stdout)
                return True
            else:
                print(f"部署失败: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print("部署超时")
            return False
        except FileNotFoundError:
            print("未找到 tcb 命令，请确保已安装 @cloudbase/cli")
            return False
            
    except Exception as e:
        print(f"部署过程中发生错误: {str(e)}")
        return False

if __name__ == "__main__":
    success = deploy_to_tencent_cloudbase()
    if success:
        print("\n🎉 知遇录首页简介更新已成功部署到线上!")
        print("访问地址: https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/")
    else:
        print("\n❌ 部署失败，请检查错误信息。")
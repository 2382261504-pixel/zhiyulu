#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
部署知遇录到腾讯云开发
"""

import os
import sys
import shutil
import tempfile
from pathlib import Path

def prepare_deployment():
    """
    准备部署文件，创建临时目录并复制需要的文件
    """
    project_path = Path(r"D:\WPS\843531481\WPS云盘\工作项目\知乎黑客松比赛\zhiyulu")
    
    # 验证项目路径存在
    if not project_path.exists():
        print(f"错误: 项目路径不存在 {project_path}")
        return None
    
    # 创建临时目录
    temp_dir = Path(tempfile.mkdtemp(prefix="zhiyulu_deploy_"))
    print(f"创建临时部署目录: {temp_dir}")
    
    try:
        # 复制所有文件到临时目录（排除.git等不需要的文件）
        def copy_tree(src, dst, exclude=None):
            if exclude is None:
                exclude = {'.git', 'node_modules', '.DS_Store', '__pycache__', '.workbuddy'}
            
            for item in src.rglob('*'):
                if any(part in exclude for part in item.parts):
                    continue
                
                dest_path = dst / item.relative_to(src)
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                
                if item.is_file():
                    shutil.copy2(item, dest_path)
        
        copy_tree(project_path, temp_dir)
        
        print(f"文件复制完成: {len(list(temp_dir.rglob('*')))} 个文件")
        return temp_dir
    
    except Exception as e:
        print(f"准备部署文件时出错: {e}")
        # 清理临时目录
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass
        return None

def main():
    print("🚀 开始部署知遇录前端到腾讯云开发...")
    
    # 准备部署文件
    temp_dir = prepare_deployment()
    if not temp_dir:
        print("❌ 部署准备失败")
        return False
    
    try:
        # 输出部署信息
        print(f"✅ 部署文件准备就绪")
        print(f"📁 项目路径: D:/WPS/843531481/WPS云盘/工作项目/知乎黑客松比赛/zhiyulu")
        print(f"📁 临时目录: {temp_dir}")
        
        # 检查关键文件
        required_files = [
            temp_dir / "index.html",
            temp_dir / "assets" / "js" / "app.js",
            temp_dir / "assets" / "css" / "style.css"
        ]
        
        missing_files = []
        for f in required_files:
            if not f.exists():
                missing_files.append(str(f))
        
        if missing_files:
            print(f"❌ 缺少必要文件: {missing_files}")
            return False
        
        print("✅ 所有必需文件检查通过")
        print("\n💡 请注意: 实际部署需要使用腾讯云开发控制台或tcb命令行工具")
        print("   由于环境限制，当前仅完成部署前的准备工作")
        print(f"   部署目录位置: {temp_dir}")
        print("   请在有tcb环境的机器上执行: tcb hosting deploy . /zhiyulu --yes")
        
        # 等待用户确认
        print(f"\n📋 部署准备完成，临时目录: {temp_dir}")
        print("   请在有网络和tcb环境的环境下执行部署命令")
        
        return True
        
    except Exception as e:
        print(f"❌ 部署过程中出错: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # 不自动删除临时目录，让用户有机会使用
        print(f"\n📁 临时部署目录已创建在: {temp_dir}")
        print("   (请手动清理该目录)")

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 部署准备完成!")
        print("   访问地址: https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/")
    else:
        print("\n❌ 部署失败")
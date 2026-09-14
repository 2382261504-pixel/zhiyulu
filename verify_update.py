import os
import json
from pathlib import Path

def verify_deployment():
    """
    验证知遇录首页简介更新是否已正确完成
    """
    project_path = Path(r"D:\WPS\843531481\WPS云盘\工作项目\知乎黑客松比赛\zhiyulu")
    
    print("🔍 验证知遇录首页简介更新...")
    print("=" * 50)
    
    # 检查 index.html 中的版本号
    index_html = project_path / "index.html"
    if index_html.exists():
        content = index_html.read_text(encoding='utf-8')
        
        # 检查 JS 版本号
        js_version_found = 'app.js?v=2026091321' in content
        print(f"✅ index.html JS版本号正确: {js_version_found}")
        
        # 检查 CSS 版本号
        css_version_found = 'style.css?v=2026091321' in content
        print(f"✅ index.html CSS版本号正确: {css_version_found}")
    
    # 检查 app.js 中的新文案
    app_js = project_path / "assets" / "js" / "app.js"
    if app_js.exists():
        content = app_js.read_text(encoding='utf-8')
        
        # 检查新文案是否存在
        new_text_found = '知遇录记得你走过的每一步，陪你成为一个更好的人' in content
        print(f"✅ app.js 新文案存在: {new_text_found}")
        
        # 检查旧文案是否已被替换
        old_text_found = '别人做单次会话，知遇录记得你走过的每一步' in content
        print(f"✅ app.js 旧文案已移除: {not old_text_found}")
    
    # 检查语法
    import subprocess
    try:
        result = subprocess.run([
            "C:\\Users\\解晨飞\\.workbuddy\\binaries\\node\\versions\\22.22.2-3\\node.exe", 
            "--check", 
            str(app_js)
        ], capture_output=True, text=True, timeout=30)
        
        syntax_ok = result.returncode == 0
        print(f"✅ JavaScript 语法检查: {syntax_ok}")
        if not syntax_ok:
            print(f"   错误信息: {result.stderr}")
    except Exception as e:
        print(f"⚠️ JavaScript 语法检查失败: {e}")
    
    print("=" * 50)
    
    # 总结
    all_checks = [
        js_version_found if 'js_version_found' in locals() else False,
        css_version_found if 'css_version_found' in locals() else False,
        new_text_found if 'new_text_found' in locals() else False,
        not old_text_found if 'old_text_found' in locals() else True
    ]
    
    success_count = sum(all_checks)
    total_checks = len(all_checks)
    
    print(f"✅ 验证完成: {success_count}/{total_checks} 项检查通过")
    
    if success_count == total_checks:
        print("\n🎉 所有本地更改已完成！")
        print("   现在可以部署到线上环境:")
        print("   1. 确保已登录腾讯云开发 CLI")
        print("   2. 在项目目录执行: tcb hosting deploy . /zhiyulu --yes")
        print("   3. 访问: https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/")
    else:
        print("\n❌ 部分检查未通过，请检查上述问题")
    
    return success_count == total_checks

if __name__ == "__main__":
    verify_deployment()
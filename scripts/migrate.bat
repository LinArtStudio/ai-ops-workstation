@echo off
echo ========================================
echo   AI产品运营工作台 - 数据库迁移说明
echo ========================================
echo.
echo HTTP / 脚本自动迁移已停用（M0 安全加固）。
echo.
echo 请按以下步骤操作：
echo 1. 打开 Supabase Dashboard - SQL Editor
echo 2. 执行仓库文件：
echo    supabase\migrations\20260726_m0_auth_rls.sql
echo 3. 在 Authentication 中开启 Email 登录
echo.
echo 详见 scripts\MIGRATION-GUIDE.md
echo.
pause

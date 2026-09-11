$batContent = @'
@echo off
chcp 65001 > nul
title NTIS 공고 동기화 파이프라인

echo ======================================================
echo [1/3] NTIS 최신 공고 데이터 수집 중...
echo ======================================================
cd /d "%~dp0"
node scripts/fetch-notices.mjs

echo.
echo ======================================================
echo [2/3] 변경 사항 Git 스테이징 및 확인...
echo ======================================================
git add public/data/notices.json

git diff --staged --quiet
if %errorlevel% equ 0 (
    echo.
    echo [안내] 갱신된 공고 데이터가 없습니다. (기존 데이터 유지)
) else (
    echo.
    echo [안내] 새로운 공고가 감지되었습니다. GitHub 푸시를 진행합니다.
    git commit -m "Auto sync: Update notices.json [%date% %time%]"
    git push origin main
    echo.
    echo ======================================================
    echo [3/3] 푸시 완료! Vercel에서 수초 내로 최신 공고가 자동 배포됩니다.
    echo ======================================================
)

echo.
echo 모든 처리가 완료되었습니다. 아무 키나 누르면 창이 닫힙니다.
pause > nul
'@

$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText("$PWD/sync-push.bat", $batContent, $utf8Bom)
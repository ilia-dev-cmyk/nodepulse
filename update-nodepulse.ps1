# NodePulse - apply the updated source to the local repo and push to GitHub.
#
# Why this file exists: the commands sent in chat get their backslashes stripped
# on the way to the clipboard, which is what produced the "DestinationPath is
# null or empty" error. This script does the same job without you having to
# retype any path.
#
# How to run it:
#   1. Download the new nodepulse.zip to your Downloads folder.
#   2. Put this file anywhere (for example D:\nodepulse\update-nodepulse.ps1).
#   3. Right-click it -> "Run with PowerShell",
#      or from a PowerShell prompt in its folder:
#         powershell -ExecutionPolicy Bypass -File .\update-nodepulse.ps1
#
# Optional parameters:
#   -RepoPath D:/nodepulse     where the git clone lives (default D:/nodepulse)
#   -ZipPath  C:/path/file.zip  skip the automatic search in Downloads

param(
    [string] $RepoPath = 'D:/nodepulse',
    [string] $ZipPath  = ''
)

$ErrorActionPreference = 'Stop'

# --- 1. Locate the archive -------------------------------------------------
if ([string]::IsNullOrWhiteSpace($ZipPath)) {
    $downloads = Join-Path $env:USERPROFILE 'Downloads'
    if (-not (Test-Path $downloads)) {
        throw "Downloads folder not found: $downloads"
    }
    $newest = Get-ChildItem -Path $downloads -Filter 'nodepulse*.zip' -File |
              Sort-Object LastWriteTime -Descending |
              Select-Object -First 1
    if ($null -eq $newest) {
        throw "No nodepulse*.zip found in $downloads. Download the archive first, or pass -ZipPath."
    }
    $ZipPath = $newest.FullName
}

Write-Host "Archive : $ZipPath"
Write-Host "Repo    : $RepoPath"

if (-not (Test-Path -LiteralPath $ZipPath)) {
    throw "Archive not found: $ZipPath"
}
if (-not (Test-Path -LiteralPath (Join-Path $RepoPath '.git'))) {
    throw "$RepoPath is not a git repository (no .git folder). Pass -RepoPath."
}

# --- 2. Extract to a clean temp folder -------------------------------------
$tmp = Join-Path $env:TEMP 'nodepulse-update'
if (Test-Path -LiteralPath $tmp) {
    Remove-Item -LiteralPath $tmp -Recurse -Force
}
Expand-Archive -Path $ZipPath -DestinationPath $tmp -Force

$srcRoot = Join-Path $tmp 'nodepulse'
if (-not (Test-Path -LiteralPath (Join-Path $srcRoot 'package.json'))) {
    throw "Unexpected archive layout: nodepulse/package.json not found inside $ZipPath"
}

# --- 3. Copy over the working tree (this never touches .git) ---------------
$files = Get-ChildItem -Path $srcRoot -Force
foreach ($item in $files) {
    Copy-Item -Path $item.FullName -Destination $RepoPath -Recurse -Force
}
Remove-Item -LiteralPath $tmp -Recurse -Force
Write-Host "Source files copied."

# --- 4. Commit and push ----------------------------------------------------
$exitCode = 0
Push-Location $RepoPath
try {
    # git writes progress to stderr; with ErrorActionPreference = 'Stop' that can
    # be turned into a bogus exception in Windows PowerShell 5.1, so relax it here
    # and check $LASTEXITCODE instead.
    $ErrorActionPreference = 'Continue'

    Write-Host ""
    Write-Host "--- git status ---"
    git status --short

    git add -A
    $staged = git diff --cached --name-only
    if ([string]::IsNullOrWhiteSpace(($staged -join ''))) {
        Write-Host "Nothing to commit: the repository already contains these files."
    }
    else {
        git commit -m "Deploy hardening: real robots/sitemap, security headers, social preview assets, a11y skip-link fixes, netlify.toml"
        if ($LASTEXITCODE -ne 0) { throw "git commit failed (exit $LASTEXITCODE)." }

        $branch = (git rev-parse --abbrev-ref HEAD).Trim()
        Write-Host "Pushing branch $branch ..."
        git push origin $branch
        if ($LASTEXITCODE -ne 0) { throw "git push failed (exit $LASTEXITCODE). Check that you are signed in to GitHub." }
        Write-Host "Pushed. Netlify will rebuild from $branch."
    }
}
catch {
    $exitCode = 1
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Pop-Location
}

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "Done. Watch the deploy in Netlify, then check:"
    Write-Host "  https://lighthearted-biscotti-02c161.netlify.app/robots.txt   -> text/plain"
    Write-Host "  https://lighthearted-biscotti-02c161.netlify.app/sitemap.xml  -> xml"
    Write-Host "  https://lighthearted-biscotti-02c161.netlify.app/og.png       -> image"
}

exit $exitCode

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dist = Join-Path $root 'dist'
$zip = Join-Path $root 'autofilter-extension.zip'
if (-not (Test-Path -LiteralPath (Join-Path $dist 'manifest.json'))) { throw 'Build output is missing.' }
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path (Join-Path $dist '*') -DestinationPath $zip
Write-Output "Created $zip"

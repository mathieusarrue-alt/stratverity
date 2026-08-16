$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backup = Join-Path $root '.seo-backup-20260816'
$files = @(
  'app\layout.tsx',
  'app\robots.ts',
  'app\sitemap.ts',
  'app\learn\page.tsx',
  'app\learn\learn.module.css',
  'app\learn\[slug]\page.tsx'
)
foreach ($f in $files) {
  $src = Join-Path $backup $f
  $dst = Join-Path $root $f
  $dir = Split-Path $dst -Parent
  if (-not (Test-Path -LiteralPath $src)) { throw "Missing backup: $src" }
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Copy-Item -LiteralPath $src -Destination $dst -Force
}
Write-Host 'SEO backup restored from .seo-backup-20260816'

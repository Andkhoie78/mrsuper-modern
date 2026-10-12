$ErrorActionPreference='Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
if (!(Test-Path '.env')) {
  $text=Get-Content '.env.example' -Raw
  function Secret { $b=New-Object byte[] 32; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); return [Convert]::ToBase64String($b) -replace '[+/=]','a' }
  $text=$text.Replace('DB_PASSWORD=CHANGE_ME',"DB_PASSWORD=$(Secret)")
  $text=$text.Replace('MYSQL_ROOT_PASSWORD=CHANGE_ME',"MYSQL_ROOT_PASSWORD=$(Secret)")
  $text=$text.Replace('SESSION_SECRET=CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS',"SESSION_SECRET=$(Secret)")
  $text=$text.Replace('OTP_SECRET=CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS',"OTP_SECRET=$(Secret)")
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) '.env'),$text,[System.Text.UTF8Encoding]::new($false))
  Write-Host 'Local .env created with random secrets.' -ForegroundColor Green
} else {Write-Host 'Existing .env kept unchanged.'}
Write-Host 'Building Docker images...'
docker compose build
if($LASTEXITCODE -ne 0){throw 'Docker build failed'}
Write-Host 'Starting MySQL + Mailpit...'
docker compose up -d mysql mailpit
if($LASTEXITCODE -ne 0){throw 'MySQL start failed'}
Write-Host 'Creating database tables (non-destructive)...'
docker compose run --rm api node src/init-db.js
if($LASTEXITCODE -ne 0){throw 'Database init failed'}
Write-Host 'Starting site...'
docker compose up -d
if($LASTEXITCODE -ne 0){throw 'Site startup failed'}
Write-Host 'Website: http://localhost:8089' -ForegroundColor Green
Write-Host 'Mailpit verification inbox: http://localhost:8025' -ForegroundColor Green
Write-Host 'To create admin run: docker compose exec api node src/create-admin.js admin@example.com' -ForegroundColor Yellow

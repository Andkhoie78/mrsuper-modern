$ErrorActionPreference='Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
$urls=@('http://localhost:8089/up','http://localhost:8089/api/public/site-config','http://localhost:8089/api/public/home','http://localhost:8089/api/public/courses')
foreach($url in $urls){
  $out=curl.exe -s -o NUL -w '%{http_code} | %{time_total}s' --max-time 20 $url
  Write-Host "$url => $out"
}
Write-Host 'Run manual acceptance: student registration -> Mailpit -> OTP -> login -> browse paid course -> HesabPay screenshot -> admin approval -> Join.'

$body = @{ username = 'admin'; password = 'admin123' } | ConvertTo-Json
try {
  $resp = Invoke-RestMethod -Method Post -Uri 'http://localhost:4001/auth/login' -ContentType 'application/json' -Body $body -ErrorAction Stop
} catch {
  Write-Error "Login request failed: $_"
  exit 1
}
if (-not $resp.token) {
  Write-Error "Login didn't return token"
  exit 1
}
$token = $resp.token
Write-Output "===LOGIN-OK==="
$resp | ConvertTo-Json -Depth 5
Write-Output "===FETCH-AUDIT-START==="
try {
  $audit = Invoke-RestMethod -Method Get -Uri 'http://localhost:4001/audit' -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
  $audit | ConvertTo-Json -Depth 5
} catch {
  Write-Error "Audit fetch failed: $_"
  exit 1
}

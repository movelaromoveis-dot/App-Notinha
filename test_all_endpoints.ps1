$body = @{ username = 'admin'; password = 'admin123' } | ConvertTo-Json
$resp = Invoke-RestMethod -Method Post -Uri 'http://localhost:4001/auth/login' -ContentType 'application/json' -Body $body -ErrorAction Stop
$token = $resp.token

Write-Output "===TEST-1: HEALTH-CHECK==="
$health = Invoke-RestMethod -Method Get -Uri 'http://localhost:4001/' -ErrorAction Stop
$health | ConvertTo-Json

Write-Output "===TEST-2: CREATE-USER==="
$newUserBody = @{
  username = 'teste_usuario_' + (Get-Random)
  full_name = 'Usuario Teste'
  password = 'teste123456'
  role_name = 'vendedor'
} | ConvertTo-Json
try {
  $newUser = Invoke-RestMethod -Method Post -Uri 'http://localhost:4001/users' `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType 'application/json' `
    -Body $newUserBody -ErrorAction Stop
  $newUser | ConvertTo-Json -Depth 5
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
}

Write-Output "`n===TEST-3: GET-USERS==="
try {
  $users = Invoke-RestMethod -Method Get -Uri 'http://localhost:4001/users' `
    -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
  Write-Output "Total users: $($users.Count)"
  $users | ConvertTo-Json -Depth 5
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
}

Write-Output "`n===TEST-4: GET-AUDIT==="
try {
  $audit = Invoke-RestMethod -Method Get -Uri 'http://localhost:4001/audit' `
    -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
  if ($audit) {
    Write-Output "Total audit logs: $($audit.Count)"
    $audit | ConvertTo-Json -Depth 5
  } else {
    Write-Output "No audit logs yet"
  }
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
}

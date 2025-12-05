$body = @{ username = 'admin'; password = 'admin123' } | ConvertTo-Json
$resp = Invoke-RestMethod -Method Post -Uri 'http://localhost:4001/auth/login' -ContentType 'application/json' -Body $body -ErrorAction Stop
$token = $resp.token

Write-Output "===CREATE-USER-DEBUG==="
$newUserBody = @{
  username = 'teste_user_' + (Get-Random)
  full_name = 'Usuario Teste'
  password = 'teste123456'
  role = 'vendedor'
} | ConvertTo-Json

Write-Output "Sending: $newUserBody"

try {
  $newUser = Invoke-RestMethod -Method Post -Uri 'http://localhost:4001/users' `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType 'application/json' `
    -Body $newUserBody -ErrorAction Stop
  $newUser | ConvertTo-Json -Depth 5
} catch {
  Write-Output "ERROR STATUS: $($_.Exception.Response.StatusCode)"
  Write-Output "ERROR MESSAGE: $($_.Exception.Message)"
  $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
  $errorBody = $streamReader.ReadToEnd()
  Write-Output "ERROR BODY: $errorBody"
}

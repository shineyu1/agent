param(
  [Parameter(Mandatory = $true)]
  [string]$PaymentProof,

  [string]$BaseUrl = "http://localhost:3000",

  [string]$ServiceSlug = "openclaw-runtime-echo",

  [string]$RequestBody = '{"query":"user skill final regression test"}'
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) {
  Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [string]$Body
  )

  try {
    if ($Method -eq 'GET' -and [string]::IsNullOrEmpty($Body)) {
      $resp = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $Url -Headers $Headers -TimeoutSec 60
    } else {
      $resp = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $Url -Headers $Headers -Body $Body -ContentType 'application/json' -TimeoutSec 60
    }
    return [PSCustomObject]@{
      StatusCode = [int]$resp.StatusCode
      Headers = $resp.Headers
      Body = $resp.Content
    }
  } catch {
    if ($_.Exception.Response) {
      $resp = $_.Exception.Response
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $bodyText = $reader.ReadToEnd()
      return [PSCustomObject]@{
        StatusCode = [int]$resp.StatusCode
        Headers = $resp.Headers
        Body = $bodyText
      }
    }
    throw
  }
}

$payableUrl = "$BaseUrl/api/services/$ServiceSlug"

Write-Step "Replay paid request"
$replay = Invoke-JsonRequest -Method POST -Url $payableUrl -Headers @{ 'payment-signature' = $PaymentProof } -Body $RequestBody
$replay | ConvertTo-Json -Depth 8

if ($replay.StatusCode -ne 200) {
  Write-Host "Replay did not succeed; stopping before receipt/replay-guard." -ForegroundColor Yellow
  exit 1
}

$replayJson = $replay.Body | ConvertFrom-Json
$tx = $replayJson.transactionReference
if (-not $tx) {
  Write-Host "No transactionReference returned." -ForegroundColor Red
  exit 1
}

Write-Step "Fetch receipt"
$receiptUrl = "$BaseUrl/api/receipts/$tx"
$receipt = Invoke-JsonRequest -Method GET -Url $receiptUrl -Headers @{} -Body $null
$receipt | ConvertTo-Json -Depth 8

Write-Step "Replay same proof again to verify replay guard"
$replayGuard = Invoke-JsonRequest -Method POST -Url $payableUrl -Headers @{ 'payment-signature' = $PaymentProof } -Body $RequestBody
$replayGuard | ConvertTo-Json -Depth 8

Write-Step "Summary"
[PSCustomObject]@{
  serviceSlug = $ServiceSlug
  replayStatus = $replay.StatusCode
  transactionReference = $tx
  receiptStatus = $receipt.StatusCode
  replayGuardStatus = $replayGuard.StatusCode
} | ConvertTo-Json -Depth 6

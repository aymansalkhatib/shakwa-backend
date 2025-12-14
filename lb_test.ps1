$baseUrl = "http://127.0.0.1:53153/api"

1..30 | ForEach-Object {
  $json = curl.exe -s -H "Connection: close" $baseUrl | ConvertFrom-Json
  $json.meta.podName
} | Group-Object | Sort-Object Count -Descending | Format-Table Count, Name

$bytes = [System.IO.File]::ReadAllBytes('C:\Temp\spec_extracted\word\document.xml')
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$pattern = [regex]'<w:t[^>]*>([^<]*)</w:t>'
$matches_list = $pattern.Matches($text)
foreach ($m in $matches_list) {
    $val = $m.Groups[1].Value.Trim()
    if ($val -ne '') {
        Write-Output $val
    }
}

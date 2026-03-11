[xml]$xml = Get-Content 'C:\Temp\spec_extracted\word\document.xml' -Encoding UTF8
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$nodes = $xml.SelectNodes('//w:t', $ns)
foreach($node in $nodes){
    if($node.InnerText.Trim() -ne ''){
        Write-Output $node.InnerText
    }
}

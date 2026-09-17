Add-Type -AssemblyName System.IO.Compression.FileSystem
$docx = Join-Path (Get-Location) "DOC-20260918-WA0014.docx"
Write-Host "Lendo arquivo: $docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($docx)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
$xmlText = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

[xml]$doc = $xmlText
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$paragraphs = $doc.SelectNodes('//w:p', $ns)
$lines = New-Object System.Collections.Generic.List[string]
foreach ($p in $paragraphs) {
    $texts = $p.SelectNodes('.//w:t', $ns)
    $line = ($texts | ForEach-Object { $_.InnerText }) -join ''
    if ($line.Trim().Length -gt 0) {
        $lines.Add($line)
    }
}
$outputPath = Join-Path (Get-Location) "docs\DOC-20260918-WA0014.md"
[System.IO.File]::WriteAllLines($outputPath, $lines, [System.Text.Encoding]::UTF8)
Write-Host "DOCUMENT_EXTRACTED_SUCCESS"

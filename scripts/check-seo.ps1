$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$SiteBase = "https://matteatools.github.io/vision-game/"
$Errors = [System.Collections.Generic.List[string]]::new()
$Warnings = [System.Collections.Generic.List[string]]::new()

function Error([string]$Message) { $Errors.Add($Message) }
function Warn([string]$Message) { $Warnings.Add($Message) }
function Match-Value([string]$Html, [string]$Pattern) {
    $value = [regex]::Match($Html, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase).Groups[1].Value
    return [System.Net.WebUtility]::HtmlDecode($value)
}

$rawGames = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "data\games.json") | ConvertFrom-Json
$games = @()
foreach ($rawGame in $rawGames) { $games += $rawGame }
$published = @($games | Where-Object { $_.published -eq $true })
$qualification = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "data\qualification.json") | ConvertFrom-Json

if ($published.Count -eq 0) { Error "No published games found in data/games.json." }

$slugs = @($published.slug)
if (($slugs | Select-Object -Unique).Count -ne $slugs.Count) { Error "Duplicate published game slugs found." }

$playTitles = @($published | ForEach-Object { $_.seo.playTitle })
$playDescriptions = @($published | ForEach-Object { $_.seo.playDescription })
$guideTitles = @($published | ForEach-Object { $_.seo.guideTitle })
$guideDescriptions = @($published | ForEach-Object { $_.seo.guideDescription })
foreach ($set in @($playTitles, $playDescriptions, $guideTitles, $guideDescriptions)) {
    if (($set | Select-Object -Unique).Count -ne $set.Count) { Error "Duplicate SEO title or description found in game data." }
}

$requiredFields = @("slug", "title", "group", "href", "guideHref", "titleImage", "playImage", "ogImage", "description", "guideSummary", "overview", "howToPlay")
$allowedGroups = @("find", "remember", "follow", "compare", "think", "communication")
foreach ($game in $published) {
    foreach ($field in $requiredFields) {
        if ([string]::IsNullOrWhiteSpace([string]$game.$field)) { Error "$($game.slug): missing $field." }
    }
    if ([string]::IsNullOrWhiteSpace([string]$game.seo.playTitle)) { Error "$($game.slug): missing play SEO title." }
    if ([string]::IsNullOrWhiteSpace([string]$game.seo.playDescription)) { Error "$($game.slug): missing play SEO description." }
    if ([string]::IsNullOrWhiteSpace([string]$game.seo.guideTitle)) { Error "$($game.slug): missing guide SEO title." }
    if ([string]::IsNullOrWhiteSpace([string]$game.seo.guideDescription)) { Error "$($game.slug): missing guide SEO description." }
    if ($game.group -notin $allowedGroups) { Error "$($game.slug): unknown top-page group $($game.group)." }
    if ($game.isVisionTraining -ne $false) { Error "$($game.slug): games must not be classified as vision training without an explicit new decision." }

    foreach ($relative in @($game.titleImage, $game.playImage, $game.ogImage)) {
        if (-not (Test-Path (Join-Path $Root ([string]$relative).Replace('/', '\')))) { Error "$($game.slug): missing image $relative." }
    }

    $gamePath = Join-Path $Root ("games\" + $game.slug + "\index.html")
    $guidePath = Join-Path $Root ("guide\" + $game.slug + "\index.html")
    if (-not (Test-Path $gamePath)) { Error "$($game.slug): game page is missing."; continue }
    if (-not (Test-Path $guidePath)) { Error "$($game.slug): guide page is missing."; continue }

    $gameHtml = Get-Content -Raw -Encoding UTF8 $gamePath
    $expectedCanonical = $SiteBase + $game.href
    $actualTitle = Match-Value $gameHtml '<title>(.*?)</title>'
    $actualDescription = Match-Value $gameHtml '<meta\s+name="description"\s+content="([^"]*)"'
    $actualCanonical = Match-Value $gameHtml '<link\s+rel="canonical"\s+href="([^"]*)"'
    if ($actualTitle -ne $game.seo.playTitle) { Error "$($game.slug): play title is out of sync." }
    if ($actualDescription -ne $game.seo.playDescription) { Error "$($game.slug): play description is out of sync." }
    if ($actualCanonical -ne $expectedCanonical) { Error "$($game.slug): canonical is out of sync." }
    if ($gameHtml -match '(?i)noindex') { Error "$($game.slug): unexpected noindex." }

    $guideHtml = Get-Content -Raw -Encoding UTF8 $guidePath
    if ($guideHtml -notmatch [regex]::Escape('../../' + $game.href)) { Error "$($game.slug): guide has no play link." }
    if ($guideHtml -notmatch [regex]::Escape($SiteBase + $game.guideHref)) { Error "$($game.slug): guide canonical is missing." }
}

$topHtml = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "index.html")
if ($topHtml -notmatch 'href="guide/"') { Error "Top page has no normal link to the guide index." }
if ($topHtml -notmatch 'data/games\.generated\.js') { Error "Top page does not load generated game data." }

$guideIndex = Join-Path $Root "guide\index.html"
if (-not (Test-Path $guideIndex)) {
    Error "Guide index is missing."
} else {
    $guideIndexHtml = Get-Content -Raw -Encoding UTF8 $guideIndex
    foreach ($game in $published) {
        if ($guideIndexHtml -notmatch [regex]::Escape($game.guideHref)) { Error "$($game.slug): guide index link is missing." }
    }
}

$expectedGuideDirectories = @($published.slug) + "miru"
foreach ($directory in Get-ChildItem (Join-Path $Root "guide") -Directory) {
    if ($directory.Name -notin $expectedGuideDirectories) {
        Error "Unexpected guide directory: $($directory.Name)"
    }
}

$sitemapPath = Join-Path $Root "sitemap.xml"
try { [xml]$sitemap = Get-Content -Raw -Encoding UTF8 $sitemapPath } catch { Error "sitemap.xml is invalid XML: $($_.Exception.Message)" }
if ($null -ne $sitemap) {
    $actualUrls = @($sitemap.urlset.url | ForEach-Object { [string]$_.loc })
    $expectedUrls = @(
        $SiteBase
        ($SiteBase + "about/")
        ($SiteBase + "guide/")
        ($SiteBase + "guide/miru/")
    )
    if ($qualification.enabled -eq $true) {
        $expectedUrls += $SiteBase + "vision-training/"
    }
    foreach ($game in $published | Where-Object { $_.sitemap -eq $true }) {
        $expectedUrls += $SiteBase + $game.href
        $expectedUrls += $SiteBase + $game.guideHref
    }
    foreach ($url in $expectedUrls) { if ($url -notin $actualUrls) { Error "sitemap.xml is missing $url" } }
    foreach ($url in $actualUrls) { if ($url -notin $expectedUrls) { Error "sitemap.xml contains unexpected URL $url" } }
    if ($actualUrls -match 'classic\.html') { Error "sitemap.xml contains a classic page." }
}

$robots = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "robots.txt")
if ($robots -notmatch '(?m)^Sitemap: https://matteatools\.github\.io/vision-game/sitemap\.xml\s*$') { Error "robots.txt sitemap directive is missing or incorrect." }
if ($robots -match '(?im)^Disallow:\s*/') { Error "robots.txt blocks public pages." }

if ($qualification.enabled -eq $true) {
    foreach ($field in @('associationName', 'associationUrl', 'qualificationName', 'validUntil', 'registrationNumber')) {
        if ([string]::IsNullOrWhiteSpace([string]$qualification.$field)) { Error "Qualification is enabled without $field." }
    }
    if ([string]::IsNullOrWhiteSpace([string]$qualification.publicAssets.mark)) { Error "Qualification is enabled without the public mark path." }
    if ([string]::IsNullOrWhiteSpace([string]$qualification.markSha256)) { Error "Qualification is enabled without the approved mark checksum." }
    $date = [datetime]::MinValue
    if (-not [datetime]::TryParseExact([string]$qualification.validUntil, 'yyyy-MM-dd', [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::None, [ref]$date)) {
        Error "Qualification validUntil must use yyyy-MM-dd."
    } else {
        $days = [math]::Floor(($date.Date - (Get-Date).Date).TotalDays)
        if ($days -lt 0) { Error "Qualification has expired." }
        elseif ($days -le 30) { Warn "Qualification expires within 30 days." }
        elseif ($days -le 90) { Warn "Qualification expires within 90 days." }
    }

    $visionPath = Join-Path $Root "vision-training\index.html"
    if (-not (Test-Path -LiteralPath $visionPath -PathType Leaf)) {
        Error "Qualification is enabled but the vision-training page is missing."
    } else {
        $visionHtml = Get-Content -Raw -Encoding UTF8 $visionPath
        $visionText = [System.Net.WebUtility]::HtmlDecode($visionHtml)
        if ($visionHtml -notmatch [regex]::Escape($SiteBase + 'vision-training/')) { Error "vision-training canonical is missing." }
        if ($visionHtml -match '(?i)noindex') { Error "vision-training page has unexpected noindex." }
        if ($visionHtml -notmatch 'vision-training-events\.js') { Error "vision-training page is missing SEO experiment navigation tracking." }
        if ($visionHtml -notmatch 'data-vision-training-link="information_to_seeing_games"') { Error "vision-training page is missing the tracked seeing-games link." }
        foreach ($value in @($qualification.associationName, $qualification.qualificationName, $qualification.registrationNumber)) {
            if ($visionText -notmatch [regex]::Escape([string]$value)) { Error "vision-training page is missing a required qualification value." }
        }
        if ($visionHtml -notmatch '各ゲームをビジョントレーニング®として') { Error "vision-training page is missing the game-classification disclaimer." }
    }

    foreach ($entry in @(
        @{ Name = 'top'; Path = (Join-Path $Root 'index.html'); Link = 'href="vision-training/"' },
        @{ Name = 'about'; Path = (Join-Path $Root 'about\index.html'); Link = 'href="../vision-training/"' }
    )) {
        $html = Get-Content -Raw -Encoding UTF8 $entry.Path
        $decodedHtml = [System.Net.WebUtility]::HtmlDecode($html)
        if ($decodedHtml -notmatch [regex]::Escape([string]$qualification.registrationNumber)) { Error "$($entry.Name) page is missing the conspicuous registration number." }
        if ($html -notmatch [regex]::Escape([string]$qualification.publicAssets.mark)) { Error "$($entry.Name) page is missing the official trademark mark." }
        if ($html -notmatch $entry.Link) { Error "$($entry.Name) page is missing the vision-training detail link." }
        if ($html -notmatch 'vision-training-events\.js') { Error "$($entry.Name) page is missing SEO experiment navigation tracking." }
    }

    $publicMarkPath = Join-Path $Root ([string]$qualification.publicAssets.mark).Replace('/', '\')
    if (-not (Test-Path -LiteralPath $publicMarkPath -PathType Leaf)) {
        Error "Public trademark mark is missing."
    } else {
        $publicMarkHash = (Get-FileHash -LiteralPath $publicMarkPath -Algorithm SHA256).Hash
        if ($publicMarkHash -ne ([string]$qualification.markSha256).ToUpperInvariant()) {
            Error "Public trademark mark checksum differs from the approved official mark."
        }
        if (-not [string]::IsNullOrWhiteSpace([string]$qualification.sourceAssets.mark)) {
            $sourceMarkPath = Join-Path $Root ([string]$qualification.sourceAssets.mark).Replace('/', '\')
            if ((Test-Path -LiteralPath $sourceMarkPath -PathType Leaf) -and (Get-FileHash -LiteralPath $sourceMarkPath -Algorithm SHA256).Hash -ne $publicMarkHash) {
                Error "Public trademark mark differs from the supplied private source mark."
            }
        }
    }
    $publicQualificationDirectory = Join-Path $Root 'assets\qualification'
    if (Test-Path -LiteralPath $publicQualificationDirectory) {
        $unexpectedQualificationAssets = @(Get-ChildItem -LiteralPath $publicQualificationDirectory -File | Where-Object { $_.FullName -ne [System.IO.Path]::GetFullPath($publicMarkPath) })
        if ($unexpectedQualificationAssets.Count -gt 0) { Error "Unexpected qualification files were copied into public assets." }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $Root 'assets\vision-training-events.js') -PathType Leaf)) { Error "vision-training navigation tracking script is missing." }

    $publicTextFiles = @(
        (Join-Path $Root 'index.html'),
        (Join-Path $Root 'about\index.html'),
        (Join-Path $Root 'guide\miru\index.html'),
        (Join-Path $Root 'vision-training\index.html')
    )
    foreach ($textFile in $publicTextFiles) {
        $textContent = Get-Content -Raw -Encoding UTF8 $textFile
        $decodedTextContent = [System.Net.WebUtility]::HtmlDecode($textContent)
        if ($decodedTextContent -match 'ビジョントレーニング(?!®)') { Error "Trademark is displayed without ® in $textFile" }
    }
} else {
    Warn "Qualification publishing is disabled; no qualification or vision-training page is published."
    if (Test-Path (Join-Path $Root "vision-training\index.html")) { Error "vision-training page exists while qualification publishing is disabled." }
}

$gitignorePath = Join-Path $Root ".gitignore"
if (-not (Test-Path $gitignorePath) -or (Get-Content -Raw -Encoding UTF8 $gitignorePath) -notmatch '(?m)^資格/\r?$') {
    Error "The private qualification source folder is not protected by .gitignore."
}

foreach ($warning in $Warnings) { Write-Warning $warning }
if ($Errors.Count -gt 0) {
    foreach ($message in $Errors) { Write-Error $message }
    exit 1
}

Write-Host "SEO check passed: $($published.Count) published games, guides, metadata, links, assets, sitemap, robots, and qualification safeguards."

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$SiteBase = "https://matteatools.github.io/vision-game/"
$DataPath = Join-Path $Root "data\games.json"
$QualificationPath = Join-Path $Root "data\qualification.json"

function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $directory = Split-Path -Parent $Path
    if ($directory -and -not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Encode([object]$Value) {
    return [System.Net.WebUtility]::HtmlEncode([string]$Value)
}

function Expand-Template([string]$Template, [hashtable]$Values) {
    foreach ($key in $Values.Keys) {
        $Template = $Template.Replace("{{$key}}", [string]$Values[$key])
    }
    return $Template
}

function Set-Meta([string]$Html, [string]$Attribute, [string]$Key, [string]$Content) {
    $pattern = '(?is)<meta\s+' + [regex]::Escape($Attribute) + '="' + [regex]::Escape($Key) + '"\s+content="[^"]*"\s*/?>'
    $tag = '<meta ' + $Attribute + '="' + $Key + '" content="' + (Encode $Content) + '">'
    if ([regex]::IsMatch($Html, $pattern)) {
        return [regex]::Replace($Html, $pattern, $tag, 1)
    }
    return [regex]::Replace($Html, '(?i)</head>', "    $tag`r`n</head>", 1)
}

function Set-Canonical([string]$Html, [string]$Url) {
    $tag = '<link rel="canonical" href="' + (Encode $Url) + '">'
    if ([regex]::IsMatch($Html, '(?is)<link\s+rel="canonical"\s+href="[^"]*"\s*/?>')) {
        return [regex]::Replace($Html, '(?is)<link\s+rel="canonical"\s+href="[^"]*"\s*/?>', $tag, 1)
    }
    return [regex]::Replace($Html, '(?i)</head>', "    $tag`r`n</head>", 1)
}

function Set-GeneratedBlock([string]$Html, [string]$Name, [string]$Content) {
    $start = "<!-- ${Name}:start -->"
    $end = "<!-- ${Name}:end -->"
    $block = "$start`r`n$Content`r`n$end"
    $pattern = '(?is)' + [regex]::Escape($start) + '.*?' + [regex]::Escape($end)
    if ([regex]::IsMatch($Html, $pattern)) {
        return [regex]::Replace($Html, $pattern, $block, 1)
    }
    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $Html
    }
    return [regex]::Replace($Html, '(?i)</main>', "$block`r`n    </main>", 1)
}

function Resolve-UnderRoot([string]$RelativePath) {
    $normalized = $RelativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $normalized))
    $rootPrefix = [System.IO.Path]::GetFullPath($Root).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    if (-not $fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Path escapes the site root: $RelativePath"
    }
    return $fullPath
}

$rawGames = Get-Content -Raw -Encoding UTF8 $DataPath | ConvertFrom-Json
$Games = @()
foreach ($rawGame in $rawGames) { $Games += $rawGame }
$Published = @($Games | Where-Object { $_.published -eq $true })
$GameBySlug = @{}
foreach ($game in $Published) {
    $GameBySlug[$game.slug] = $game
}

$qualification = Get-Content -Raw -Encoding UTF8 $QualificationPath | ConvertFrom-Json
$qualificationActive = $qualification.enabled -eq $true
$qualificationExpiry = [datetime]::MinValue
if ($qualificationActive) {
    $requiredQualificationFields = @(
        'associationName',
        'associationUrl',
        'qualificationName',
        'validUntil',
        'registrationNumber'
    )
    foreach ($field in $requiredQualificationFields) {
        if ([string]::IsNullOrWhiteSpace([string]$qualification.$field)) {
            throw "Qualification publishing is enabled without $field."
        }
    }
    if (-not [datetime]::TryParseExact([string]$qualification.validUntil, 'yyyy-MM-dd', [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::None, [ref]$qualificationExpiry)) {
        throw "Qualification validUntil must use yyyy-MM-dd."
    }
    if ($qualificationExpiry.Date -lt (Get-Date).Date) {
        Write-Warning "Qualification has expired. Qualification pages, links, and public mark will be removed from generated output."
        $qualificationActive = $false
    }
    if ($qualificationActive) {
        if ([string]::IsNullOrWhiteSpace([string]$qualification.publicAssets.mark) -or [string]::IsNullOrWhiteSpace([string]$qualification.markSha256)) {
            throw "Qualification publishing is enabled without the public trademark mark path and checksum."
        }
        $publicMarkPath = Resolve-UnderRoot ([string]$qualification.publicAssets.mark)
        $publicMarkDirectory = Split-Path -Parent $publicMarkPath
        if (-not (Test-Path -LiteralPath $publicMarkDirectory)) {
            New-Item -ItemType Directory -Path $publicMarkDirectory -Force | Out-Null
        }
        $sourceMarkPath = $null
        if (-not [string]::IsNullOrWhiteSpace([string]$qualification.sourceAssets.mark)) {
            $candidateSourceMarkPath = Resolve-UnderRoot ([string]$qualification.sourceAssets.mark)
            if (Test-Path -LiteralPath $candidateSourceMarkPath -PathType Leaf) {
                $sourceMarkPath = $candidateSourceMarkPath
                [System.IO.File]::Copy($sourceMarkPath, $publicMarkPath, $true)
            }
        }
        if (-not (Test-Path -LiteralPath $publicMarkPath -PathType Leaf)) {
            throw "The private source mark is unavailable and the verified public trademark mark is missing."
        }
        $actualMarkHash = (Get-FileHash -LiteralPath $publicMarkPath -Algorithm SHA256).Hash
        if ($actualMarkHash -ne ([string]$qualification.markSha256).ToUpperInvariant()) {
            throw "Public trademark mark checksum does not match the approved official mark."
        }
    }
}

function New-QualificationDisclosure([string]$Prefix, [string]$HeadingId, [string]$LinkRole) {
    if (-not $qualificationActive) { return '' }
    $expiryLabel = $qualificationExpiry.ToString('yyyy年M月d日')
    $markPath = $Prefix + ([string]$qualification.publicAssets.mark)
    $detailPath = $Prefix + 'vision-training/'
    return @"
      <section class="qualification-disclosure" aria-labelledby="$HeadingId">
        <div class="qualification-mark-wrap">
          <img class="qualification-mark" src="$(Encode $markPath)" alt="ビジョントレーニング®商標マーク" width="776" height="571" loading="lazy">
        </div>
        <div class="qualification-copy">
          <p class="qualification-kicker">資格・商標表示</p>
          <h2 id="$HeadingId">ビジョントレーニング®に関する制作背景</h2>
          <p class="qualification-association">$(Encode $qualification.associationName)</p>
          <p class="qualification-name">$(Encode $qualification.qualificationName)</p>
          <p class="qualification-registration"><strong>登録番号</strong> $(Encode $qualification.registrationNumber)</p>
          <p class="qualification-expiry">資格有効期限：$(Encode $expiryLabel)</p>
          <p class="qualification-note">制作者は、眼から情報を受け取り、頭で判断し、体で操作するという考え方をゲーム制作の参考にしています。各ゲームをビジョントレーニング®として提供するものではなく、能力の向上や特定の効果・改善を保証するものではありません。</p>
          <a class="qualification-link" href="$(Encode $detailPath)" data-vision-training-link="$(Encode $LinkRole)">資格とゲーム制作の考え方を詳しく見る</a>
        </div>
      </section>
      <script src="$(Encode ($Prefix + 'assets/vision-training-events.js'))"></script>
"@
}

# The browser consumes a generated JavaScript copy so the page still works from file://.
$generatedJson = $Published | ConvertTo-Json -Depth 12
Write-Utf8NoBom (Join-Path $Root "data\games.generated.js") "window.GAME_DATA = $generatedJson;`n"

# Replace the old duplicated top-page array with the generated shared data.
$topPath = Join-Path $Root "index.html"
$topHtml = Get-Content -Raw -Encoding UTF8 $topPath
$topDataBootstrap = @'
const games = (window.GAME_DATA ?? [])
            .filter((game) => game.published)
            .map((game) => ({ ...game }));
'@
$topDataPattern = '(?is)const games\s*=\s*\[.*?\]\.map\(\(game\)\s*=>\s*\(\{.*?\}\)\);'
if (-not [regex]::IsMatch($topHtml, $topDataPattern)) {
    if ($topHtml -notmatch 'const games = \(window\.GAME_DATA') {
        throw "Could not locate the top-page game data block."
    }
} else {
    $topHtml = [regex]::Replace($topHtml, $topDataPattern, $topDataBootstrap, 1)
}
$topHtml = Set-GeneratedBlock $topHtml 'qualification-disclosure' (New-QualificationDisclosure '' 'qualification-heading' 'top_to_information')
Write-Utf8NoBom $topPath $topHtml

$aboutPath = Join-Path $Root 'about\index.html'
$aboutHtml = Get-Content -Raw -Encoding UTF8 $aboutPath
$aboutHtml = Set-GeneratedBlock $aboutHtml 'qualification-disclosure' (New-QualificationDisclosure '../' 'about-qualification-heading' 'about_to_information')
Write-Utf8NoBom $aboutPath $aboutHtml

$gaHead = @'
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-2R4RYVCT21"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-2R4RYVCT21');
  </script>
'@

$pageTemplate = @'
<!doctype html>
<html lang="ja">
<head>
{{GA_HEAD}}
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fff8ed">
  <meta name="description" content="{{DESCRIPTION}}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{{CANONICAL}}">
  <link rel="icon" href="{{FAVICON}}" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="めとあたまのゲームパーク">
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="{{DESCRIPTION}}">
  <meta property="og:url" content="{{CANONICAL}}">
  <meta property="og:image" content="{{OG_IMAGE}}">
  <meta property="og:image:alt" content="{{OG_ALT}}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{TITLE}}">
  <meta name="twitter:description" content="{{DESCRIPTION}}">
  <meta name="twitter:image" content="{{OG_IMAGE}}">
  <title>{{TITLE}}</title>
  <link rel="stylesheet" href="{{STYLES}}">
  <script type="application/ld+json">{{JSON_LD}}</script>
</head>
<body>
{{BODY}}
{{PAGE_SCRIPT}}
</body>
</html>
'@

function New-GuideCard([object]$Game, [string]$Prefix) {
    $skills = @($Game.skills | ForEach-Object { '<span class="tag">' + (Encode $_) + '</span>' }) -join ""
    return @"
      <article class="guide-card">
        <a class="guide-card-image" href="$Prefix$($Game.guideHref)">
          <img src="$Prefix$($Game.playImage)" alt="$(Encode $Game.title)のゲーム画面" width="960" height="600" loading="lazy">
        </a>
        <div class="guide-card-body">
          <div class="tags">$skills</div>
          <h2><a href="$Prefix$($Game.guideHref)">$(Encode $Game.title)</a></h2>
          <p>$(Encode $Game.guideSummary)</p>
          <div class="card-actions">
            <a class="secondary-button" href="$Prefix$($Game.guideHref)">遊び方を見る</a>
            <a class="primary-button" href="$Prefix$($Game.href)" data-guide-play data-game-slug="$(Encode $Game.slug)">このゲームであそぶ</a>
          </div>
        </div>
      </article>
"@
}

$guideItems = @($Published | ForEach-Object {
    [ordered]@{
        "@type" = "ListItem"
        position = [array]::IndexOf($Published, $_) + 1
        name = $_.title
        url = $SiteBase + $_.guideHref
    }
})
$guideJsonLd = [ordered]@{
    "@context" = "https://schema.org"
    "@type" = "CollectionPage"
    name = "ゲームガイド"
    url = $SiteBase + "guide/"
    description = "めとあたまのゲームパークで公開中のゲームについて、内容と遊び方を紹介する一覧です。"
    mainEntity = [ordered]@{
        "@type" = "ItemList"
        itemListElement = $guideItems
    }
} | ConvertTo-Json -Depth 10 -Compress

$guideCards = @($Published | ForEach-Object { New-GuideCard $_ "../" }) -join "`n"
$guideBody = @"
  <header class="site-header">
    <a href="../"><img src="../site-logo-cool.svg" alt="めとあたまのゲームパーク"></a>
    <nav aria-label="サイト案内"><a href="../">トップへ</a><a href="miru/">見ることを使うゲーム</a></nav>
  </header>
  <main>
    <section class="page-hero">
      <p class="eyebrow">おとなの方へ・くわしく知りたい方へ</p>
      <h1>ゲームガイド</h1>
      <p>公開中のゲームについて、どんなゲームか、どのように遊ぶかを紹介します。説明を読まず、すぐゲームへ進むこともできます。</p>
    </section>
    <section class="guide-grid" aria-label="ゲームガイド一覧">
$guideCards
    </section>
  </main>
  <footer><a href="../">めとあたまのゲームパークへ戻る</a><p>© めとあたまのゲームパーク</p></footer>
"@
$guidePage = Expand-Template $pageTemplate @{
    GA_HEAD = $gaHead
    TITLE = "ゲームガイド｜めとあたまのゲームパーク"
    DESCRIPTION = "めとあたまのゲームパークで公開中の無料Webゲームについて、内容、基本的な遊び方、ゲーム中に行うことを紹介します。"
    CANONICAL = $SiteBase + "guide/"
    FAVICON = "../site-logo-cool.svg"
    OG_IMAGE = $SiteBase + "assets/home/og-image.png"
    OG_ALT = "めとあたまのゲームパークのゲームガイド"
    STYLES = "styles.css"
    JSON_LD = $guideJsonLd
    BODY = $guideBody
    PAGE_SCRIPT = '<script src="guide-events.js"></script>'
}
Write-Utf8NoBom (Join-Path $Root "guide\index.html") $guidePage

foreach ($game in $Published) {
    $activityItems = @($game.activities | ForEach-Object { "          <li>$(Encode $_)</li>" }) -join "`n"
    $relatedCards = @($game.related | ForEach-Object {
        $related = $GameBySlug[[string]$_]
        if ($null -ne $related) {
            @"
        <article class="related-card">
          <a href="../$($related.slug)/"><img src="../../$($related.titleImage)" alt="" width="960" height="600" loading="lazy"><span>$(Encode $related.title)</span></a>
        </article>
"@
        }
    }) -join "`n"
    $jsonLd = [ordered]@{
        "@context" = "https://schema.org"
        "@type" = "WebPage"
        name = $game.seo.guideTitle
        description = $game.seo.guideDescription
        url = $SiteBase + $game.guideHref
        image = $SiteBase + $game.ogImage
        inLanguage = "ja"
        isPartOf = [ordered]@{
            "@type" = "WebSite"
            name = "めとあたまのゲームパーク"
            url = $SiteBase
        }
        about = [ordered]@{
            "@type" = "WebApplication"
            name = $game.title
            url = $SiteBase + $game.href
            applicationCategory = "GameApplication"
            operatingSystem = "Web browser"
        }
    } | ConvertTo-Json -Depth 10 -Compress

    $body = @"
  <header class="site-header">
    <a href="../../"><img src="../../site-logo-cool.svg" alt="めとあたまのゲームパーク"></a>
    <nav aria-label="サイト案内"><a href="../">ゲームガイド</a><a href="../../">トップへ</a></nav>
  </header>
  <main>
    <nav class="breadcrumbs" aria-label="パンくず"><a href="../../">トップ</a><span>›</span><a href="../">ゲームガイド</a><span>›</span><span>$(Encode $game.title)</span></nav>
    <article class="game-guide">
      <div class="guide-hero-copy">
        <p class="eyebrow">ゲームガイド</p>
        <h1>$(Encode $game.title)</h1>
        <p class="lead">$(Encode $game.guideSummary)</p>
        <a class="primary-button large" href="../../$($game.href)" data-guide-play data-game-slug="$(Encode $game.slug)">このゲームであそぶ</a>
        <p class="play-note">無料・登録不要ですぐに遊べます。</p>
      </div>
      <figure class="guide-hero-image"><img src="../../$($game.playImage)" alt="$(Encode $game.title)のゲーム画面" width="960" height="600"></figure>
      <section class="content-card">
        <h2>このゲームについて</h2>
        <p>$(Encode $game.overview)</p>
      </section>
      <section class="content-card">
        <h2>遊び方</h2>
        <p>$(Encode $game.howToPlay)</p>
      </section>
      <section class="content-card">
        <h2>ゲーム中に行うこと</h2>
        <ul>
$activityItems
        </ul>
        <p class="disclaimer">ここではゲーム中の活動を説明しています。能力の向上や、特定の効果・改善を保証するものではありません。</p>
      </section>
      <section class="related-section">
        <h2>関連するゲーム</h2>
        <div class="related-grid">
$relatedCards
        </div>
      </section>
      <div class="bottom-actions"><a class="secondary-button" href="../">ゲームガイド一覧へ</a><a class="primary-button" href="../../$($game.href)" data-guide-play data-game-slug="$(Encode $game.slug)">このゲームであそぶ</a></div>
    </article>
  </main>
  <footer><a href="../../">めとあたまのゲームパークへ戻る</a><p>© めとあたまのゲームパーク</p></footer>
"@
    $page = Expand-Template $pageTemplate @{
        GA_HEAD = $gaHead
        TITLE = Encode $game.seo.guideTitle
        DESCRIPTION = Encode $game.seo.guideDescription
        CANONICAL = $SiteBase + $game.guideHref
        FAVICON = "../../site-logo-cool.svg"
        OG_IMAGE = $SiteBase + $game.ogImage
        OG_ALT = Encode ($game.title + "のゲーム画面")
        STYLES = "../styles.css"
        JSON_LD = $jsonLd
        BODY = $body
        PAGE_SCRIPT = '<script src="../guide-events.js"></script>'
    }
    Write-Utf8NoBom (Join-Path $Root ("guide\" + $game.slug + "\index.html")) $page
}

$seeingGames = @($Published | Where-Object { $_.seeingGuide -eq $true })
$seeingCards = @($seeingGames | ForEach-Object { New-GuideCard $_ "../../" }) -join "`n"
$seeingItems = @($seeingGames | ForEach-Object {
    [ordered]@{
        "@type" = "ListItem"
        position = [array]::IndexOf($seeingGames, $_) + 1
        name = $_.title
        url = $SiteBase + $_.guideHref
    }
})
$seeingJsonLd = [ordered]@{
    "@context" = "https://schema.org"
    "@type" = "CollectionPage"
    name = "見ることを使う無料ゲーム"
    url = $SiteBase + "guide/miru/"
    description = "見つける、覚える、目で追う、見比べるなど、ゲーム中に見ることを使う無料Webゲームの一覧です。"
    mainEntity = [ordered]@{
        "@type" = "ItemList"
        itemListElement = $seeingItems
    }
} | ConvertTo-Json -Depth 10 -Compress
$seeingBody = @"
  <header class="site-header">
    <a href="../../"><img src="../../site-logo-cool.svg" alt="めとあたまのゲームパーク"></a>
    <nav aria-label="サイト案内"><a href="../">ゲームガイド</a><a href="../../">トップへ</a></nav>
  </header>
  <main>
    <nav class="breadcrumbs" aria-label="パンくず"><a href="../../">トップ</a><span>›</span><a href="../">ゲームガイド</a><span>›</span><span>見ることを使うゲーム</span></nav>
    <section class="page-hero">
      <p class="eyebrow">見つける・覚える・目で追う・見比べる</p>
      <h1>見ることを使う<br>無料ゲーム</h1>
      <p>画面の中から対象を見つける、色や位置を覚える、動きを目で追う、形や向きを見分ける、複数のものを見比べる。ここでは、ゲーム中に実際に行うことから選べます。</p>
      <p class="notice">これらはゲーム内容の説明であり、能力の向上や特定の効果・改善を保証するものではありません。また、本サイトでは各ゲームをビジョントレーニング®として提供していません。</p>
    </section>
    <section class="guide-grid" aria-label="見ることを使うゲーム一覧">
$seeingCards
    </section>
  </main>
  <footer><a href="../../">めとあたまのゲームパークへ戻る</a><p>© めとあたまのゲームパーク</p></footer>
"@
$seeingPage = Expand-Template $pageTemplate @{
    GA_HEAD = $gaHead
    TITLE = "見ることを使う無料ゲーム｜見つける・覚える・目で追う"
    DESCRIPTION = "画面から見つける、色や位置を覚える、動きを目で追う、形や向きを見分けるなど、見ることを使って遊ぶ無料Webゲームを紹介します。"
    CANONICAL = $SiteBase + "guide/miru/"
    FAVICON = "../../site-logo-cool.svg"
    OG_IMAGE = $SiteBase + "assets/home/og-image.png"
    OG_ALT = "見ることを使う無料ゲーム"
    STYLES = "../styles.css"
    JSON_LD = $seeingJsonLd
    BODY = $seeingBody
    PAGE_SCRIPT = '<script src="../guide-events.js"></script>'
}
Write-Utf8NoBom (Join-Path $Root "guide\miru\index.html") $seeingPage

if ($qualificationActive) {
    $qualificationDescription = "ビジョントレーニング®インストラクターPRO資格を持つ制作者が、眼・頭・体の連携をゲーム制作でどのように参考にしているかを説明します。各ゲームはビジョントレーニング®として提供していません。"
    $qualificationJsonLd = [ordered]@{
        "@context" = "https://schema.org"
        "@type" = "WebPage"
        name = "ビジョントレーニング®とゲーム制作の考え方"
        description = $qualificationDescription
        url = $SiteBase + "vision-training/"
        inLanguage = "ja"
        isPartOf = [ordered]@{
            "@type" = "WebSite"
            name = "めとあたまのゲームパーク"
            url = $SiteBase
        }
    } | ConvertTo-Json -Depth 8 -Compress
    $expiryLabel = $qualificationExpiry.ToString('yyyy年M月d日')
    $qualificationBody = @"
  <header class="site-header">
    <a href="../"><img src="../site-logo-cool.svg" alt="めとあたまのゲームパーク"></a>
    <nav aria-label="サイト案内"><a href="../guide/miru/">見ることを使うゲーム</a><a href="../about/">このサイトについて</a><a href="../">トップへ</a></nav>
  </header>
  <main>
    <nav class="breadcrumbs" aria-label="パンくず"><a href="../">トップ</a><span>›</span><span>ビジョントレーニング®とゲーム制作</span></nav>
    <section class="page-hero">
      <p class="eyebrow">制作者の資格とゲーム制作の考え方</p>
      <h1>ビジョントレーニング®と<br>めとあたまのゲーム</h1>
      <p>制作者が学んだ考え方を、ゲームづくりでどのように参考にしているかをご案内します。</p>
    </section>

    <div class="qualification-page-grid">
      <section class="official-qualification" aria-labelledby="official-qualification-heading">
        <div class="official-mark-wrap">
          <img src="../$(Encode $qualification.publicAssets.mark)" alt="ビジョントレーニング®商標マーク" width="776" height="571">
        </div>
        <div>
          <p class="eyebrow">資格・商標表示</p>
          <h2 id="official-qualification-heading">$(Encode $qualification.associationName)</h2>
          <p class="qualification-name">$(Encode $qualification.qualificationName)</p>
          <p class="qualification-registration"><strong>登録番号</strong> $(Encode $qualification.registrationNumber)</p>
          <p>資格有効期限：$(Encode $expiryLabel)</p>
          <p><a href="$(Encode $qualification.associationUrl)" rel="external">協会公式サイトを確認する</a></p>
        </div>
      </section>

      <section class="content-card principle-section" aria-labelledby="principle-heading">
        <p class="eyebrow">制作で参考にしていること</p>
        <h2 id="principle-heading">眼で受け取り、頭で考え、体で操作する</h2>
        <p>ゲームでは、画面の中から対象を見つける、色や位置を覚える、動きを目で追う、形や向きを見分けるといった「見ること」と、判断して指や手で操作することが続いて起こります。制作者は、この眼・頭・体の連携という考え方をゲーム設計の参考にしています。</p>
        <div class="principle-list" aria-label="ゲーム中の流れ">
          <div><strong>眼</strong><span>画面から情報を受け取る</span></div>
          <div><strong>頭</strong><span>見つける・覚える・比べる・考える</span></div>
          <div><strong>体</strong><span>指や手で選ぶ・動かす</span></div>
        </div>
      </section>

      <section class="content-card relationship-section" aria-labelledby="relationship-heading">
        <p class="eyebrow">ゲームとの関係</p>
        <h2 id="relationship-heading">各ゲームをトレーニングとして提供しているわけではありません</h2>
        <p>「めとあたまのゲームパーク」は、無料・登録不要で遊べるWebゲームサイトです。資格は制作者が学んだ知識の背景を示すものであり、掲載している各ゲームをビジョントレーニング®として認定・提供することを意味しません。</p>
        <p class="notice">ゲームは能力の向上や、特定の効果・改善を保証するものではありません。ゲーム中に行う活動の説明として「見つける」「覚える」「目で追う」「見比べる」などの言葉を使用しています。</p>
        <div class="bottom-actions"><a class="primary-button large" href="../guide/miru/" data-vision-training-link="information_to_seeing_games">見ることを使うゲームを探す</a><a class="secondary-button" href="../guide/" data-vision-training-link="information_to_guides">ゲームガイドを見る</a></div>
      </section>
    </div>
  </main>
  <footer><a href="../">めとあたまのゲームパークへ戻る</a><p>© めとあたまのゲームパーク</p></footer>
"@
    $qualificationPage = Expand-Template $pageTemplate @{
        GA_HEAD = $gaHead
        TITLE = "ビジョントレーニング®とゲーム制作の考え方｜めとあたま"
        DESCRIPTION = $qualificationDescription
        CANONICAL = $SiteBase + "vision-training/"
        FAVICON = "../site-logo-cool.svg"
        OG_IMAGE = $SiteBase + "assets/home/og-image.png"
        OG_ALT = "めとあたまのゲームパーク"
        STYLES = "../guide/styles.css"
        JSON_LD = $qualificationJsonLd
        BODY = $qualificationBody
        PAGE_SCRIPT = '<script src="../assets/vision-training-events.js"></script>'
    }
    Write-Utf8NoBom (Join-Path $Root "vision-training\index.html") $qualificationPage
} else {
    $visionTrainingDirectory = Join-Path $Root 'vision-training'
    $visionTrainingPage = Join-Path $visionTrainingDirectory 'index.html'
    if (Test-Path -LiteralPath $visionTrainingPage -PathType Leaf) {
        Remove-Item -LiteralPath $visionTrainingPage -Force
    }
    if ((Test-Path -LiteralPath $visionTrainingDirectory -PathType Container) -and @(Get-ChildItem -LiteralPath $visionTrainingDirectory -Force).Count -eq 0) {
        Remove-Item -LiteralPath $visionTrainingDirectory -Force
    }
    if (-not [string]::IsNullOrWhiteSpace([string]$qualification.publicAssets.mark)) {
        $inactivePublicMarkPath = Resolve-UnderRoot ([string]$qualification.publicAssets.mark)
        if (Test-Path -LiteralPath $inactivePublicMarkPath -PathType Leaf) {
            Remove-Item -LiteralPath $inactivePublicMarkPath -Force
        }
        $inactivePublicMarkDirectory = Split-Path -Parent $inactivePublicMarkPath
        if ((Test-Path -LiteralPath $inactivePublicMarkDirectory -PathType Container) -and @(Get-ChildItem -LiteralPath $inactivePublicMarkDirectory -Force).Count -eq 0) {
            Remove-Item -LiteralPath $inactivePublicMarkDirectory -Force
        }
    }
}

# Keep game-page head metadata in sync without changing game UI or scripts.
foreach ($game in $Published) {
    $gamePath = Join-Path $Root ("games\" + $game.slug + "\index.html")
    if (-not (Test-Path $gamePath)) {
        throw "Game page not found: $gamePath"
    }
    $html = Get-Content -Raw -Encoding UTF8 $gamePath
    $titleTag = '<title>' + (Encode $game.seo.playTitle) + '</title>'
    $html = [regex]::Replace($html, '(?is)<title>.*?</title>', $titleTag, 1)
    $canonical = $SiteBase + $game.href
    $imageUrl = $SiteBase + $game.ogImage
    $html = Set-Canonical $html $canonical
    $html = Set-Meta $html "name" "description" $game.seo.playDescription
    $html = Set-Meta $html "property" "og:site_name" "めとあたまのゲームパーク"
    $html = Set-Meta $html "property" "og:title" $game.seo.playTitle
    $html = Set-Meta $html "property" "og:description" $game.seo.playDescription
    $html = Set-Meta $html "property" "og:url" $canonical
    $html = Set-Meta $html "property" "og:image" $imageUrl
    $html = Set-Meta $html "property" "og:image:alt" ($game.title + "のゲーム画面")
    $html = Set-Meta $html "name" "twitter:card" "summary_large_image"
    $html = Set-Meta $html "name" "twitter:title" $game.seo.playTitle
    $html = Set-Meta $html "name" "twitter:description" $game.seo.playDescription
    $html = Set-Meta $html "name" "twitter:image" $imageUrl
    Write-Utf8NoBom $gamePath $html
}

# Generate sitemap only from current public data.
$urls = [System.Collections.Generic.List[string]]::new()
$urls.Add($SiteBase)
$urls.Add($SiteBase + "about/")
$urls.Add($SiteBase + "guide/")
$urls.Add($SiteBase + "guide/miru/")
if ($qualificationActive) {
    $urls.Add($SiteBase + "vision-training/")
}
foreach ($game in $Published | Where-Object { $_.sitemap -eq $true }) {
    $urls.Add($SiteBase + $game.href)
    $urls.Add($SiteBase + $game.guideHref)
}

$urlMarkup = @($urls | ForEach-Object { "  <url>`n    <loc>$([System.Security.SecurityElement]::Escape($_))</loc>`n  </url>" }) -join "`n"
$sitemap = "<?xml version=`"1.0`" encoding=`"UTF-8`"?>`n<urlset xmlns=`"http://www.sitemaps.org/schemas/sitemap/0.9`">`n$urlMarkup`n</urlset>`n"
Write-Utf8NoBom (Join-Path $Root "sitemap.xml") $sitemap

Write-Host "Generated $($Published.Count) game guides, the guide index, the seeing-games page, qualification content, game metadata, and sitemap.xml."

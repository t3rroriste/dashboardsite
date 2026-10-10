# =========================================================================
# Recopie le socle commun de live/ vers live/dashboard.cyqbot.eu/.
#
# Pourquoi ce script existe : la vitrine et l'application sont deux sites
# servis depuis deux dossiers, mais ils partagent app.js, config.js, les
# cinq langues, anime.js, le logo et home.css. Ces fichiers existent donc
# en double. Sans ce script, on en corrige un, on oublie l'autre, et les
# deux moitiés du site divergent en silence — exactement ce qui est arrivé
# entre ce dépôt et le dossier local en septembre.
#
# À lancer après toute modification d'un fichier commun, avant de committer :
#
#     powershell -ExecutionPolicy Bypass -File sync-live.ps1
#
# -Verifier ne copie rien et sort en erreur si les deux copies diffèrent :
# c'est la forme utile dans une vérification automatique.
# =========================================================================

param([switch]$Verifier)

$ErrorActionPreference = 'Stop'
$racine = Split-Path -Parent $MyInvocation.MyCommand.Path
$vitrine = Join-Path $racine 'live'
$app     = Join-Path $vitrine 'dashboard.cyqbot.eu'

# Le socle : tout ce dont les deux sites ont besoin à l'identique.
# home.css en fait partie — login.html et welcome.html s'en servent.
$communs = @(
  '.htaccess',
  'assets/css/home.css',
  'assets/img/logo.png',
  'assets/js/app.js',
  'assets/js/config.js',
  'assets/js/lang/fr.js', 'assets/js/lang/en.js', 'assets/js/lang/es.js',
  'assets/js/lang/de.js', 'assets/js/lang/ko.js',
  'assets/js/vendor/anime.umd.min.js',
  'assets/js/vendor/anime.LICENSE.md'
)

$divergents = @()
foreach ($f in $communs) {
  $src = Join-Path $vitrine $f
  $dst = Join-Path $app $f
  if (-not (Test-Path $src)) { throw "Fichier commun absent de live/ : $f" }

  $memeContenu = (Test-Path $dst) -and
    ((Get-FileHash $src -Algorithm SHA256).Hash -eq (Get-FileHash $dst -Algorithm SHA256).Hash)

  if ($memeContenu) { continue }
  $divergents += $f
  if (-not $Verifier) {
    $dossier = Split-Path -Parent $dst
    if (-not (Test-Path $dossier)) { New-Item -ItemType Directory -Force $dossier | Out-Null }
    Copy-Item $src $dst -Force
    Write-Host ("  recopie : " + $f)
  }
}

if ($Verifier) {
  if ($divergents.Count) {
    Write-Host "Les copies communes ont divergé :" -ForegroundColor Red
    $divergents | ForEach-Object { Write-Host ("  " + $_) -ForegroundColor Red }
    Write-Host "Lance sync-live.ps1 sans -Verifier." -ForegroundColor Red
    exit 1
  }
  Write-Host "Les deux dossiers sont synchronisés."
  exit 0
}

if (-not $divergents.Count) { Write-Host "Rien à recopier : déjà synchronisés." }
else { Write-Host ("" + $divergents.Count + " fichier(s) recopié(s) vers dashboard.cyqbot.eu/.") }

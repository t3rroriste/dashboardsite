# Renumérote tous les assets (?v=…) des pages HTML.
#
# Pourquoi : le navigateur garde en cache app.css, app.js et les fichiers de
# langue. Sans ce numéro, on modifie un fichier, on recharge… et on voit
# l'ancienne version. Le numéro change -> l'URL change -> le navigateur
# retélécharge. C'est le seul moyen fiable sur un site sans build.
#
# À lancer après chaque modification de CSS ou de JS, avant d'envoyer le
# dossier à l'hébergeur :
#
#     powershell -ExecutionPolicy Bypass -File bump-version.ps1
#     powershell -ExecutionPolicy Bypass -File bump-version.ps1 -Dossier live

param(
  # Le dossier dont on renumérote les pages. Par défaut celui du script.
  # Le dépôt s'en sert pour traiter live/ puis live/dashboard.cyqbot.eu/,
  # qui sont deux sites distincts.
  [string]$Dossier
)

$ErrorActionPreference = 'Stop'
$racine = if ($Dossier) { (Resolve-Path $Dossier).Path }
          else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$version = Get-Date -Format 'yyyyMMddHHmm'

$pages = Get-ChildItem -Path $racine -Filter '*.html' -File

foreach ($page in $pages) {
  $texte = Get-Content -Path $page.FullName -Raw -Encoding UTF8
  $avant = $texte

  # href="assets/…​.css" et src="assets/….js", avec ou sans ?v= existant
  $texte = [regex]::Replace($texte,
    '(href="assets/[^"?]+\.css)(\?v=[^"]*)?"', ('${1}?v=' + $version + '"'))
  $texte = [regex]::Replace($texte,
    '(src="assets/[^"?]+\.js)(\?v=[^"]*)?"',  ('${1}?v=' + $version + '"'))

  if ($texte -ne $avant) {
    [System.IO.File]::WriteAllText($page.FullName, $texte, (New-Object System.Text.UTF8Encoding $false))
    Write-Host ("  mis a jour : " + $page.Name)
  } else {
    Write-Host ("  inchange   : " + $page.Name)
  }
}

Write-Host ""
Write-Host ("Version des assets : " + $version)
Write-Host "Recharge la page une fois avec Ctrl+Maj+R, puis envoie le dossier."

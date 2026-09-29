$projectRoot = Split-Path -Parent $PSScriptRoot
$gameExecutable = Join-Path $projectRoot 'dist\MiragineWar-win32-x64\MiragineWar.exe'
if (-not (Test-Path -LiteralPath $gameExecutable)) { throw 'Build the game first.' }
$linkPath = Join-Path $projectRoot '米拉奇战记.lnk'
$shortcutShell = New-Object -ComObject WScript.Shell
$shortcut = $shortcutShell.CreateShortcut($linkPath)
$shortcut.TargetPath = $gameExecutable
$shortcut.WorkingDirectory = Split-Path -Parent $gameExecutable
$shortcut.IconLocation = "$gameExecutable,0"
$shortcut.Description = 'Miragine War - Classic Remake'
$shortcut.Save()
Write-Output $linkPath

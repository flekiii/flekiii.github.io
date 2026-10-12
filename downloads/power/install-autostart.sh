#!/usr/bin/env bash
# Fleki Power Menu v0.2.0 — optional XFCE autostart installer.
# Download and inspect this script before running it. No sudo is required.
set -Eeuo pipefail

SOURCE="${1:-$HOME/Downloads/Fleki-Power-Menu-0.2.0-x86_64.AppImage}"
DESTDIR="$HOME/.local/opt/fleki-power-menu"
DEST="$DESTDIR/Fleki-Power-Menu.AppImage"
AUTOSTART="$HOME/.config/autostart/fleki-power-menu.desktop"
LOG="$HOME/.cache/fleki-power-menu.log"

if [[ ! -f "$SOURCE" ]]; then
  printf 'Error: AppImage was not found: %s\n' "$SOURCE" >&2
  printf 'Usage: bash install-autostart.sh /path/to/Fleki-Power-Menu-0.2.0-x86_64.AppImage\n' >&2
  exit 1
fi

if [[ "${XDG_CURRENT_DESKTOP:-}" != *XFCE* ]]; then
  printf 'Warning: Fleki Power Menu is designed for XFCE on X11.\n' >&2
fi

mkdir -p "$DESTDIR" "$(dirname "$AUTOSTART")" "$(dirname "$LOG")"
install -m 755 "$SOURCE" "$DEST"

# Only this application's autostart file is changed.
if [[ -f "$AUTOSTART" ]]; then
  cp -p -- "$AUTOSTART" "$AUTOSTART.previous"
fi
cat >"$AUTOSTART" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=Fleki Power Menu
Comment=Top-edge power controls for XFCE
Exec=$DEST
TryExec=$DEST
Terminal=false
OnlyShowIn=XFCE;
X-GNOME-Autostart-enabled=true
X-XFCE-Autostart-Delay=3
EOF

printf 'Installed: %s\nAutostart: %s\n' "$DEST" "$AUTOSTART"

# A running instance holds a lock. Don't launch a second copy.
if pgrep -f '^(/usr/bin/)?python(3)? .*/fleki-power-menu\.py$' >/dev/null 2>&1; then
  printf '\nA menu is already running. Close its previous terminal and launch the installed AppImage again.\n'
else
  setsid -f "$DEST" >"$LOG" 2>&1 </dev/null
  printf 'Started independently of this terminal. You can now close the terminal.\n'
fi

printf 'It will start automatically at the next XFCE login.\n'
printf 'Uninstall instructions: https://flekiii.github.io/power/\n'

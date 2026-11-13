#!/bin/sh
# {{SCRIPT}}
#
# Description:
#   Installs (or uninstalls) the Fullerene XKB keyboard layout.
#
#   Copies fullerene.xkb to <xkb>/symbols/fullerene and registers the layout
#   in the rules XML files (between the FULLERENE BEGIN/END markers) so it
#   shows up in layout pickers. Safe to re-run, e.g. after an
#   xkeyboard-config update overwrites the rules files. Re-runs itself with
#   sudo if needed.
#
# Usage:
#   {{SCRIPT}} [-i|--install] [-u|--uninstall] [-h|--help]
#
# Options:
#   -i, --install    Install or reinstall the layout (default)
#   -u, --uninstall  Uninstall the layout
#   -h, --help       Show this help message
#
# Environment:
#   XKB_DIR    XKB data directory (default: /usr/share/X11/xkb)
#
# Requirements:
#   POSIX sh, sudo, sed, awk; xkbcli or xkbcomp (optional, for validation)
#
# Exit codes:
#   0  Layout installed or uninstalled, or help displayed
#   1  Missing file or invalid usage

set -eu

# ==== Functions ===============================================================
usage() {
	sed -n '2,/^$/s/^#[[:space:]]\{0,1\}//p' "$0" |
		sed "s/{{SCRIPT}}/$(basename "$0")/g"
}

die() {
	printf '⛔ %s\n' "$*" >&2
	exit 1
}

info() {
	printf ':: %s\n' "$*"
}

# ==== Options =================================================================
action="install"

# Translate long options to short ones for getopts, up to "--"
end_options=false
for arg; do
	shift
	if [ "$end_options" = false ]; then
		case $arg in
		--help) arg=-h ;;
		--install) arg=-i ;;
		--uninstall) arg=-u ;;
		--) end_options=true ;;
		esac
	fi
	set -- "$@" "$arg"
done
while getopts ':hiu' opt; do
	case $opt in
	h)
		usage
		exit 0
		;;
	i)
		action="install"
		;;
	u)
		action="uninstall"
		;;
	*)
		printf 'Unknown option: -%s\n' "$OPTARG" >&2
		usage >&2
		exit 1
		;;
	esac
done
shift "$((OPTIND - 1))"

if [ "$#" -gt 0 ]; then
	printf 'Unexpected argument: %s\n' "$1" >&2
	usage >&2
	exit 1
fi

# ==== Defaults ================================================================
src_dir=$(cd "$(dirname "$0")" && pwd)
symbols_src="$src_dir/fullerene.xkb"
xml_src="$src_dir/fullerene.evdev.xml"

XKB_DIR="${XKB_DIR:-/usr/share/X11/xkb}"
symbols_dst="$XKB_DIR/symbols/fullerene"

begin_mark='<!-- FULLERENE BEGIN -->'
end_mark='<!-- FULLERENE END -->'
temp_file=""

# ==== Cleanup =================================================================
cleanup() {
	if [ -n "$temp_file" ]; then
		rm -f "$temp_file"
	fi
}
trap cleanup EXIT INT TERM

# ==== Privileges ==============================================================
if [ "$(id -u)" -ne 0 ]; then
	exec sudo -- env XKB_DIR="$XKB_DIR" "$0" "--$action"
fi

[ -d "$XKB_DIR" ] || die "XKB directory not found: $XKB_DIR"

# ==== Rules files =============================================================
# Overwrite a file's contents ($1) with temp_file in place. Writing through
# the existing file keeps symlinks (e.g. evdev.xml -> base.xml) intact.
commit_temp() {
	cat "$temp_file" >"$1"
	rm -f "$temp_file"
	temp_file=""
}

# Strip any existing Fullerene block from a rules file ($1)
remove_block() {
	temp_file="$1.fullerene.tmp.$$"
	sed "\|$begin_mark|,\|$end_mark|d" "$1" >"$temp_file"
	commit_temp "$1"
}

# Insert the Fullerene block right after <layoutList> in a rules file ($1),
# indented to match
insert_block() {
	temp_file="$1.fullerene.tmp.$$"
	awk -v block_file="$xml_src" '
		{ print }
		!done && /^[[:space:]]*<layoutList>[[:space:]]*$/ {
			match($0, /^[[:space:]]*/)
			indent = substr($0, 1, RLENGTH) "\t"
			while ((getline line < block_file) > 0)
				print indent line
			close(block_file)
			done = 1
		}
		END { if (!done) exit 1 }
	' "$1" >"$temp_file" || die "<layoutList> not found in $1"
	commit_temp "$1"
}

# Print each rules file once, skipping files that are the same file as one
# already printed (hard or symbolic link), so nothing is patched twice
rules_files() {
	seen=""
	for file in "$XKB_DIR/rules/evdev.xml" "$XKB_DIR/rules/base.xml"; do
		[ -e "$file" ] || continue
		# ls -i is the POSIX way to read an inode (find -printf is GNU only)
		# shellcheck disable=SC2012
		inode=$(ls -Li "$file" | awk '{ print $1 }')
		case " $seen " in
		*" $inode "*) continue ;;
		esac
		seen="$seen $inode"
		printf '%s\n' "$file"
	done
}

# ==== Actions =================================================================
do_install() {
	[ -f "$symbols_src" ] || die "missing $symbols_src"
	[ -f "$xml_src" ] || die "missing $xml_src"

	info "Installing symbols -> $symbols_dst"
	mkdir -p "$(dirname "$symbols_dst")"
	cp "$symbols_src" "$symbols_dst"
	chmod 644 "$symbols_dst"

	files=$(rules_files)
	old_ifs=$IFS
	IFS='
'
	for file in $files; do
		IFS=$old_ifs
		info "Registering layout in $file"
		[ -f "$file.fullerene.bak" ] || cp -p "$file" "$file.fullerene.bak"
		remove_block "$file"
		insert_block "$file"
	done
	IFS=$old_ifs

	info "Validating layout"
	if command -v xkbcli >/dev/null 2>&1; then
		xkbcli compile-keymap --include "$XKB_DIR" --layout fullerene >/dev/null ||
			die "xkbcli failed to compile the fullerene layout"
	elif command -v xkbcomp >/dev/null 2>&1 && [ -n "${DISPLAY:-}" ]; then
		setxkbmap -I "$XKB_DIR" -layout fullerene -print |
			xkbcomp -w0 -I"$XKB_DIR" - /dev/null ||
			die "xkbcomp failed to compile the fullerene layout"
	else
		info "No xkbcli/xkbcomp available, skipping validation"
	fi

	cat <<-EOF

		Fullerene installed. To use it:
		  X11:       setxkbmap fullerene
		  Sway:      input * xkb_layout fullerene
		  Hyprland:  input { kb_layout = fullerene }
		  GNOME/KDE: pick "English (Fullerene)" in keyboard settings (log out/in first)
	EOF
}

do_uninstall() {
	info "Removing $symbols_dst"
	rm -f "$symbols_dst"

	files=$(rules_files)
	old_ifs=$IFS
	IFS='
'
	for file in $files; do
		IFS=$old_ifs
		info "Unregistering layout from $file"
		remove_block "$file"
		rm -f "$file.fullerene.bak"
	done
	IFS=$old_ifs

	info "Fullerene uninstalled"
}

"do_$action"

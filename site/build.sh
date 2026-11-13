#!/bin/sh
# {{SCRIPT}}
#
# Description:
#   Builds the Fullerene website from the repo's Markdown pages: README.md
#   becomes index.html and KEYBOARDS.md keyboards.html, next to copies of the
#   images, the Linux files and the license files they link to.
#
# Usage:
#   {{SCRIPT}} [-h|--help] [--] [output_dir]
#
# Arguments:
#   output_dir  Where to write the site (default: _site in the repo)
#
# Options:
#   -h, --help  Show this help message
#
# Requirements:
#   POSIX sh, pandoc 3.1.11 or later (for GitHub callouts)
#
# Exit codes:
#   0  Site built, or help displayed
#   1  Invalid usage or missing pandoc

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

# ==== Options =================================================================
end_options=false
for arg; do
	shift
	if [ "$end_options" = false ]; then
		case $arg in
		--help) arg=-h ;;
		--) end_options=true ;;
		esac
	fi
	set -- "$@" "$arg"
done
while getopts ':h' opt; do
	case $opt in
	h)
		usage
		exit 0
		;;
	*)
		printf 'Unknown option: -%s\n' "$OPTARG" >&2
		usage >&2
		exit 1
		;;
	esac
done
shift "$((OPTIND - 1))"

if [ "$#" -gt 1 ]; then
	printf 'Expected at most one output directory\n' >&2
	usage >&2
	exit 1
fi

# ==== Defaults ================================================================
site_dir=$(cd "$(dirname "$0")" && pwd)
repo_dir=$(dirname "$site_dir")
output_dir=${1:-$repo_dir/_site}

command -v pandoc >/dev/null 2>&1 || die "pandoc not found"

# ==== Build ===================================================================
# Render one Markdown page ($1) to an HTML page ($2) titled $3. The template
# adds the side navigation, highlighting page $4 (index or keyboards) and
# listing the page's section headings.
render() {
	pandoc --from gfm --to html5 --standalone \
		--template "$site_dir/template.html" \
		--lua-filter "$site_dir/links.lua" \
		--toc --toc-depth 2 \
		--variable "current-$4" \
		--metadata pagetitle="$3" \
		--output "$output_dir/$2" \
		"$repo_dir/$1"
}

mkdir -p "$output_dir"
render README.md index.html "Fullerene" index
render KEYBOARDS.md keyboards.html "Fullerene on split keyboards" keyboards

cp "$site_dir/style.css" "$site_dir/sidebar.js" "$output_dir/"
cp "$repo_dir/LICENSE" "$repo_dir/NOTICE" "$output_dir/"
cp -R "$repo_dir/images" "$repo_dir/linux" "$output_dir/"

printf ':: Site built in %s\n' "$output_dir"

#!/bin/sh
# {{SCRIPT}}
#
# Description:
#   Builds the Fullerene website from the repo's Markdown pages: README.md
#   becomes index.html, KEYBOARDS.md keyboards.html and DEVELOPMENT.md
#   development.html, next to copies of the images, the Linux and typing
#   trainer files, and the license files they link to.
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
# Environment:
#   SITE_URL    Published address, for canonical links, link previews and the
#               sitemap (default: https://sobh.github.io/fullerene/)
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
site_url=${SITE_URL:-https://sobh.github.io/fullerene/}

command -v pandoc >/dev/null 2>&1 || die "pandoc not found"

# ==== Build ===================================================================
# Render one Markdown page ($1) to an HTML page ($2, empty for index.html,
# the site's address). The template adds the side navigation, highlighting
# page $3 (index, keyboards or development), and the page's title ($4) and description ($5)
# for search results and link previews.
render() {
	pandoc --from gfm --to html5 --standalone --wrap none \
		--template "$site_dir/template.html" \
		--lua-filter "$site_dir/links.lua" \
		--toc --toc-depth 2 \
		--variable "current-$3" \
		--variable "site-url=$site_url" \
		--variable "page=$2" \
		--metadata pagetitle="$4" \
		--metadata description="$5" \
		--output "$output_dir/${2:-index.html}" \
		"$repo_dir/$1"
}

mkdir -p "$output_dir"
render README.md "" index \
	"Fullerene – a keyboard layout for split keyboards" \
	"Fullerene is an English keyboard layout for split columnar keyboards, with light pinkies, few same-finger bigrams and an ANSI version for laptops."
render KEYBOARDS.md keyboards.html keyboards \
	"Fullerene on the ErgoDox EZ, Advantage360, Go60 and Imprint" \
	"The Fullerene keyboard layout on the ErgoDox EZ, Kinesis Advantage360, MoErgo Go60 and Cyboard Imprint split keyboards."
render DEVELOPMENT.md development.html development \
	"How the Fullerene keyboard layout was made" \
	"How the Fullerene keyboard layout was optimized: goals, scoring, the core-first search and the alternatives tested."

# Search engines: allow everything, and list the pages
cat >"$output_dir/robots.txt" <<-ROBOTS
	User-agent: *
	Allow: /

	Sitemap: ${site_url}sitemap.xml
ROBOTS
cat >"$output_dir/sitemap.xml" <<-SITEMAP
	<?xml version="1.0" encoding="UTF-8"?>
	<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
		<url><loc>$site_url</loc></url>
		<url><loc>${site_url}keyboards.html</loc></url>
		<url><loc>${site_url}development.html</loc></url>
	</urlset>
SITEMAP

cp "$site_dir/style.css" "$site_dir/sidebar.js" "$output_dir/"
cp "$repo_dir/LICENSE" "$repo_dir/NOTICE" "$output_dir/"
cp -R "$repo_dir/images" "$repo_dir/linux" "$repo_dir/typing" "$output_dir/"

printf ':: Site built in %s\n' "$output_dir"

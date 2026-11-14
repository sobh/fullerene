-- Point links to the repo's Markdown pages at their generated HTML pages
local pages = {
	["README.md"] = "index.html",
	["KEYBOARDS.md"] = "keyboards.html",
	["DEVELOPMENT.md"] = "development.html",
}

function Link(link)
	local target, anchor = link.target:match("^([^#]*)(#?.*)$")
	if pages[target] then
		link.target = pages[target] .. anchor
	end
	return link
end

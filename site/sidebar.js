// Resizable side navigation: the sidebar has `resize: horizontal`, so dragging
// its corner sets its inline width. Copy that width to --sidebar, which also
// places the main content, and remember it for the next page.
const sidebar = document.querySelector(".sidebar");

if (sidebar) {
	new ResizeObserver(() => {
		const width = sidebar.style.width;
		if (!width) {
			return; // not resized yet: keep the stylesheet's width
		}
		document.documentElement.style.setProperty("--sidebar", width);
		try {
			localStorage.setItem("sidebar-width", width);
		} catch {
			// Storage may be blocked (private windows): resizing still works
		}
	}).observe(sidebar);
}

// Narrow screens: the menu button slides the sidebar in and out. Tapping the
// backdrop, pressing Escape or following a link closes it again.
const menuButton = document.querySelector(".menu-button");
const backdrop = document.querySelector(".backdrop");

function setMenu(open) {
	document.body.classList.toggle("nav-open", open);
	menuButton.setAttribute("aria-expanded", String(open));
	menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

if (menuButton && sidebar) {
	menuButton.addEventListener("click", () => setMenu(!document.body.classList.contains("nav-open")));
	backdrop?.addEventListener("click", () => setMenu(false));
	sidebar.addEventListener("click", (event) => {
		if (event.target.closest("a")) {
			setMenu(false);
		}
	});
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			setMenu(false);
		}
	});
}

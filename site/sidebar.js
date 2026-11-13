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

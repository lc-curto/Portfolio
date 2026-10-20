from html.parser import HTMLParser
from pathlib import Path


class PortfolioParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.fragments = []
        self.meta_names = set()
        self.canonical = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "a" and attrs.get("href", "").startswith("#"):
            self.fragments.append(attrs["href"][1:])
        if tag == "meta" and attrs.get("name"):
            self.meta_names.add(attrs["name"])
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = bool(attrs.get("href"))


html_path = Path(__file__).resolve().parents[1] / "index.html"
html = html_path.read_text(encoding="utf-8")
parser = PortfolioParser()
parser.feed(html)
parser.close()

assert html.lstrip().lower().startswith("<!doctype html>"), "Missing HTML doctype"
assert "<title>" in html.lower(), "Missing page title"
assert "description" in parser.meta_names, "Missing meta description"
assert parser.canonical, "Missing canonical URL"
assert len(parser.ids) == len(set(parser.ids)), "Duplicate element IDs"
missing = sorted(set(parser.fragments) - set(parser.ids))
assert not missing, f"Broken internal links: {', '.join(missing)}"
assert "mailto:lucas.scurto@gmail.com" in html, "Missing direct email contact"
assert "<form" not in html.lower(), "A static contact form should not be presented as functional"
print(f"Portfolio checks passed ({len(parser.ids)} IDs; internal links resolve).")

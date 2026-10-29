"""Add visible and JSON-LD breadcrumbs to public pages without an existing trail."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://www.sweetescapememphis.com"
LABELS = {
    "about.html": "About",
    "dessert-guide.html": "Dessert guide",
    "flavors.html": "Scoop flavors",
    "gelato.html": "Gelato & sorbetto",
    "item-directory.html": "Item directory",
    "press.html": "Press",
    "rewards.html": "Rewards",
    "specialties.html": "Specialties",
    "stock.html": "In stock",
    "visit.html": "Visit",
    "yogurt.html": "Yogurt flavors",
}


def add(path):
    source = path.read_text()
    if 'aria-label="Breadcrumb"' in source or 'BreadcrumbList' in source:
        return False
    if re.search(r'<meta[^>]+name="robots"[^>]+content="noindex', source, re.I):
        return False
    canonical = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', source, re.I)
    main = re.search(r'<main\b[^>]*>', source, re.I)
    h1 = re.search(r'<h1\b[^>]*>(.*?)</h1>', source, re.I | re.S)
    if not canonical or not main or not h1:
        return False
    relative = path.relative_to(ROOT).as_posix()
    if relative == 'blog/index.html':
        trail = [('Home', '/'), ('Blog', '/blog/')]
    elif relative.startswith('blog/'):
        title = html.unescape(re.sub(r'<[^>]+>', '', h1.group(1))).strip()
        trail = [('Home', '/'), ('Blog', '/blog/'), (title, '/' + relative)]
    elif relative in LABELS:
        trail = [('Home', '/'), (LABELS[relative], '/' + relative)]
    else:
        return False
    # The final URL must match the page's canonical URL, including /blog/.
    trail[-1] = (trail[-1][0], canonical.group(1).replace(ORIGIN, ''))
    parts = []
    for index, (label, href) in enumerate(trail):
        name = html.escape(label, quote=True)
        if index:
            parts.append('<span aria-hidden="true">/</span>')
        parts.append(f'<span aria-current="page">{name}</span>' if index == len(trail)-1 else f'<a href="{html.escape(href, quote=True)}">{name}</a>')
    nav = '<nav class="site-breadcrumbs" aria-label="Breadcrumb">' + ''.join(parts) + '</nav>'
    data = {'@context': 'https://schema.org', '@type': 'BreadcrumbList',
            'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': label,
                                 'item': ORIGIN + href} for i, (label, href) in enumerate(trail)]}
    schema = '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
    source = source[:main.end()] + nav + source[main.end():]
    source = source.replace('</head>', '<link rel="stylesheet" href="/breadcrumbs.css?v=20261027-1">' + schema + '</head>', 1)
    path.write_text(source)
    return True


if __name__ == '__main__':
    pages = [*ROOT.glob('*.html'), *ROOT.glob('blog/*.html')]
    updated = [p.relative_to(ROOT).as_posix() for p in pages if add(p)]
    print(f'Added breadcrumbs to {len(updated)} pages.')

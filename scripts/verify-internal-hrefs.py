#!/usr/bin/env python3
"""Recette E2E : croise les liens internes du frontend avec les routes Next.js réelles.

Usage (depuis frontend/) :  python scripts/verify-internal-hrefs.py
Sortie : liste des liens internes (landing + header) et des cibles sans route
correspondante. Exit 0 si aucun lien mort, 1 sinon.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")


def collect_routes() -> set[str]:
    routes: set[str] = set()
    for dirpath, dirnames, filenames in os.walk(APP):
        if "api" in dirpath.split(os.sep):
            continue
        if "page.tsx" not in filenames:
            continue
        rel = os.path.relpath(dirpath, APP).replace("\\", "/")
        route = "/" + rel
        route = route.replace("[id]", ":id").replace("[slug]", ":slug")
        routes.add(route if route != "/." else "/")
    return routes


def collect_hrefs() -> set[str]:
    hrefs: set[str] = set()
    for name in ("home/landing-markup.ts", "components/SiteHeader.tsx"):
        path = os.path.join(APP, name)
        if not os.path.exists(path):
            continue
        text = open(path, encoding="utf-8").read()
        hrefs.update(re.findall(r'href="([^"]+)"', text))
        hrefs.update(re.findall(r'href=\{?"([^"]+)"', text))
    return hrefs


def main() -> int:
    routes = collect_routes()
    hrefs = collect_hrefs()
    internal = {
        h for h in hrefs
        if h.startswith("/") and not h.startswith("/#") and "#" not in h
    }
    broken: list[str] = []
    for h in sorted(internal):
        base = h.split("?")[0].rstrip("/") or "/"
        if base in routes:
            continue
        # tentative de match dynamique (:id / :slug)
        parts = base.strip("/").split("/")
        matched = any(
            len(rp) == len(parts)
            and all(rp[i].startswith(":") or rp[i] == parts[i] for i in range(len(parts)))
            for r in routes
            for rp in [r.strip("/").split("/")]
        )
        if not matched:
            broken.append(h)
    print(f"Routes détectées : {len(routes)}")
    print(f"Liens internes : {len(internal)}")
    if broken:
        print("LIENS MORTS :")
        for b in broken:
            print(f"  ✗ {b}")
        return 1
    print("✓ Aucun lien mort.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

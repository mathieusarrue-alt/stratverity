"""Playwright driver only: no downloads, external traffic or non-fixture credentials."""
import base64
import json
from pathlib import Path
import re
import sys
from time import time
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright


def run(site, profile, source, screenshot, browser_path):
    if not re.fullmatch(r"http://127\.0\.0\.1:[1-9][0-9]{0,4}", site):
        raise ValueError("Loopback only")
    user = dict(id="fixture-subject", email="fixture@example.invalid",
                email_confirmed_at="2026-01-01T00:00:00Z", aud="authenticated", app_metadata={}, user_metadata={})
    session = dict(access_token="fixture-intake", refresh_token="fixture-refresh", expires_at=int(time())+3600,
                   expires_in=3600, token_type="bearer", user=user)
    cookie = "base64-"+base64.urlsafe_b64encode(json.dumps(session).encode()).decode().rstrip("=")
    traffic, statuses, errors = [], [], []
    with sync_playwright() as playwright:
        context = playwright.chromium.launch_persistent_context(profile, executable_path=browser_path, headless=True,
            args=["--disable-background-networking"], viewport={"width":1320,"height":1100})
        try:
            context.route("**/*", lambda route: route.continue_() if urlsplit(route.request.url).hostname == "127.0.0.1"
                          else route.abort())
            context.add_cookies([dict(name="sb-127-auth-token", value=cookie, url=site, sameSite="Lax")])
            page = context.pages[0]
            page.on("request", lambda request: traffic.append(request.url))
            page.on("response", lambda response: statuses.append(
                [response.url.rsplit("/",1)[-1],response.status]) if "/api/private-audit/" in response.url else None)
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(site+"/configure", wait_until="domcontentloaded", timeout=30000)
            page.wait_for_function("""() => {
              const file = document.querySelector('input[type=file]');
              return file && Object.keys(file).some(key => key.startsWith('__reactFiber$'));
            }""", timeout=30000)
            price = page.locator("[role=status][aria-atomic=true]").first.inner_text()
            assert "19" in price and not any("/api/private-audit/" in url for url in traffic)
            page.locator('input[type="file"]').set_input_files(source)
            verify = page.locator('button[type="submit"]').filter(has_text=re.compile("Verify request|Vérifier la demande"))
            expect(verify).to_be_enabled(timeout=12000)
            verify.click()
            reserve = page.get_by_role("button",name=re.compile("Reserve quote|Réserver le devis"))
            expect(reserve).to_be_visible(timeout=30000)
            expect(reserve).to_be_disabled()
            coverage = page.get_by_role("region",name=re.compile("Data coverage|Couverture des données"))
            expect(coverage.get_by_text(re.compile("Less history than requested|Historique plus court que demandé"))).to_be_visible()
            coverage.get_by_role("checkbox").check()
            expect(reserve).to_be_enabled()
            with page.expect_response(lambda response: "/api/private-audit/" in response.url and
                                      response.url.endswith("/quote")) as reserved_response:
                reserve.click()
            reserved = reserved_response.value
            expect(coverage.get_by_text(re.compile("Quote reserved|Devis réservé"))).to_be_visible(timeout=15000)
            assert reserved.status == 200
            sent = reserved.request.post_data_json
            assert set(sent) == {"scope","accepted_reduced_receipt_sha256"}
            reservation = dict(attempt=reserved.url.split("/")[-2], scope=sent["scope"],
                               consent=sent["accepted_reduced_receipt_sha256"],
                               quote=reserved.json()["quote_sha256"])
            assert statuses == [["source",200],["freeze",200],["quote",200]], statuses
            assert not any(re.search("checkout-sessions|stripe\\.com",url,re.I) for url in traffic)
            if Path(screenshot).exists():
                raise FileExistsError(screenshot)
            page.screenshot(path=screenshot, full_page=True)
        except Exception as exc:
            print(json.dumps({"browser_failure":type(exc).__name__,"statuses":statuses,"errors":errors[:3]}),file=sys.stderr)
            raise
        finally:
            context.close()
    return dict(price=price,statuses=statuses,runtime_exceptions=len(errors),
                private_requests_before_verification=0,checkout_requests=0,reserved=True,
                reservation=reservation)


if __name__ == "__main__":
    print(json.dumps(run(*sys.argv[1:])))

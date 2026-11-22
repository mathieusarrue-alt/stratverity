"""DEV UI fixtures only. No real Auth, Stripe, source execution, email or backend.

The Vite API gets an EMPTY envDir and an allowlisted child environment. Browser
requests to every non-loopback origin are blocked before first navigation.
"""
import base64
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import tempfile
import threading
import time
from urllib.parse import urlsplit
from urllib.request import urlopen
from urllib.error import HTTPError
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
USER = dict(id="fixture-subject", email="fixture@example.invalid", email_confirmed_at="2026-01-01T00:00:00Z",
            aud="authenticated", app_metadata={}, user_metadata={})


class Auth(BaseHTTPRequestHandler):
    def do_GET(self):
        data = USER if self.path == "/auth/v1/user" else {"external": {}}
        raw = json.dumps(data).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw))); self.end_headers(); self.wfile.write(raw)

    def log_message(self, *_):
        pass


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0)); return sock.getsockname()[1]


def run():
    stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    output = ROOT / "evidence" / ("private_audit_ui_browser_" + stamp)
    output.mkdir(exist_ok=False)
    site_port, auth_port, upstream_port = free_port(), free_port(), free_port()
    site = f"http://127.0.0.1:{site_port}"
    auth = ThreadingHTTPServer(("127.0.0.1", auth_port), Auth)
    threading.Thread(target=auth.serve_forever, daemon=True).start()
    # Never inherit credentials, application env, proxy env or a user's browser profile.
    allowed = ["SystemRoot", "WINDIR", "COMSPEC", "PATH", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA", "APPDATA"]
    env = {k: os.environ[k] for k in allowed if k in os.environ}
    env.update(NODE_ENV="development", NEXT_PUBLIC_SUPABASE_URL=f"http://127.0.0.1:{auth_port}",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="fixture-publishable-not-secret",
        NEXT_PUBLIC_STRATVERITY_API_URL=f"http://127.0.0.1:{upstream_port}",
        NEXT_PUBLIC_STRATVERITY_PRIVATE_AUDIT_LOCAL="1", STRATVERITY_PRIVATE_AUDIT_LOCAL="1",
        NEXT_PUBLIC_STRATVERITY_PRIVATE_AUDIT_CHECKOUT_LOCAL="1", STRATVERITY_PRIVATE_AUDIT_CHECKOUT_LOCAL="1",
        STRATVERITY_PRIVATE_AUDIT_SITE=site, STRATVERITY_PRIVATE_AUDIT_UPSTREAM=f"http://127.0.0.1:{upstream_port}",
        WRANGLER_SEND_METRICS="false", WRANGLER_WRITE_LOGS="false", BROWSER="none")
    code = """import {createServer} from 'vite';
      const server=await createServer({envDir:process.argv[1],server:{host:'127.0.0.1',port:Number(process.argv[2]),strictPort:true}});
      await server.listen();process.on('SIGTERM',()=>server.close());"""
    errors, requests, blocked, sent, sessions = [], [], [], [], {}
    evidence = dict(fixture_only=True, env_files_read=False, nonloopback_allowed=False)
    with tempfile.TemporaryDirectory(prefix="sv-ui-empty-env-") as empty_env:
        with (output / "vite.log").open("w", encoding="utf8") as log:
            process = subprocess.Popen([shutil.which("node"), "--input-type=module", "-e", code, empty_env, str(site_port)],
                cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
            try:
                for _ in range(90):
                    if process.poll() is not None: raise RuntimeError("Fixture dev server exited")
                    try:
                        with urlopen(site + "/api/health-check", timeout=1): break
                    except HTTPError as response:
                        if response.code == 405: break
                    except Exception: time.sleep(.5)
                else: raise RuntimeError("Fixture dev server unavailable")
                with sync_playwright() as playwright:
                    browser = playwright.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                        headless=True, args=["--disable-background-networking"])
                    context = browser.new_context(viewport={"width":1320,"height":1100})
                    # The guard is installed before navigation. Stripe is deliberately NOT visited.
                    def guard(route):
                        url = route.request.url
                        if urlsplit(url).hostname != "127.0.0.1":
                            blocked.append(url); route.abort(); return
                        route.continue_()
                    context.route("**/*", guard)
                    cookie_session = dict(access_token="fixture-intake", refresh_token="fixture-refresh", expires_at=int(time.time())+3600,
                        expires_in=3600, token_type="bearer", user=USER)
                    cookie = "base64-" + base64.urlsafe_b64encode(json.dumps(cookie_session).encode()).decode().rstrip("=")
                    context.add_cookies([dict(name="sb-127-auth-token",value=cookie,url=site,sameSite="Lax")])
                    expiry = time.time() + 300
                    iso = lambda at: time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime(at))
                    scope_hash, quote_hash, receipt = "a"*64, "b"*64, "c"*64
                    lose_checkout = [False]
                    hold_freeze, deferred = [False], []
                    def api(route):
                        op = route.request.url.rsplit("/",1)[-1]; attempt=route.request.url.split("/")[-2]
                        body=route.request.post_data_json; sent.append(dict(op=op,attempt=attempt,body=body,
                            key=route.request.headers.get("idempotency-key")))
                        response = dict(authorization=False)
                        if op == "source": response["source_sha256"] = hashlib.sha256(body["source"].encode()).hexdigest()
                        elif op == "freeze":
                            c=body["scope"]["contexts"][0];step={"15m":900,"1h":3600,"4h":14400,"1d":86400,"1w":604800}[c["timeframe"]]
                            end=int(time.time())//step*step
                            response.update(schema="stratverity.audit-private-pre-admission@1",status="CONFIRM_EXACT_REDUCED_WINDOW",
                                profile="L1",scope_fingerprint=scope_hash,receipt_sha256=receipt,expires_at=iso(expiry),requires_confirmation=True,
                                contexts=[dict(**c,first_open=iso(end-4*step),last_close=iso(end),bars=4,target_years={"ESSENTIAL":2,"PREMIUM":8,"CUSTOM":10}[body["scope"]["audit_options"]["depth"]],reduced=True)])
                        elif op == "quote": response.update(scope_fingerprint=scope_hash,quote_sha256=quote_hash,pricing_version="launch-v0.3",
                            expires_at=iso(expiry),price=dict(currency="eur",cadence="ONE_TIME",due_today_ex_vat_cents=1900))
                        elif op == "checkout":
                            sessions.setdefault(attempt,"cs_test_fixture"+str(len(sessions)+1))
                            if lose_checkout[0]: lose_checkout[0]=False;route.abort();return
                            response.update(checkout_attempt_id="checkout-"+"d"*32,checkout_session_id=sessions[attempt],
                                checkout_url="https://checkout.stripe.com/c/pay/ui-fixture#fidkd%2Fopaque",scope_fingerprint=scope_hash,
                                quote_sha256=quote_hash,status="CHECKOUT_CREATED",pricing=dict(currency="eur",cadence="ONE_TIME",subtotal_ex_vat_cents=1900,
                                    activation_ex_vat_cents=0,due_today_ex_vat_cents=1900,tax_calculation="STRIPE_AUTOMATIC_TAX_AT_CHECKOUT"))
                        elif op == "status": response.update(checkout_status="PAID_PENDING_PROVISIONING",job_status="SUCCEEDED",delivery_status="DELIVERED",report_ready=True)
                        else: raise AssertionError(op)
                        if op=="freeze" and hold_freeze[0]:
                            deferred.append((route,json.dumps(response)));return
                        route.fulfill(status=201 if op=="checkout" else 200,content_type="application/json",body=json.dumps(response))
                    context.route("**/api/private-audit/**",api)
                    page=context.new_page();page.on("pageerror",lambda exc:errors.append(str(exc)));page.on("request",lambda req:requests.append(req.url))
                    page.goto(site+"/configure",wait_until="domcontentloaded")
                    upload=page.locator('input[type=file]');expect(upload).to_be_visible(timeout=30000)
                    page.wait_for_function("() => Object.keys(document.querySelector('input[type=file]')).some(k=>k.startsWith('__reactFiber$'))")
                    price=page.locator('[role=status][aria-atomic=true]').first.inner_text();assert "19" in price
                    assert len(sent)==0
                    upload.set_input_files(dict(name="fixture.py",mimeType="text/plain",buffer=b"def run(bars):\n    return []\n"))
                    verify=page.locator('button[type=submit]').filter(has_text=re.compile("Verify request|Vérifier la demande"));expect(verify).to_be_enabled();verify.click()
                    coverage=page.get_by_role("region",name=re.compile("Data coverage|Couverture des données"));expect(coverage).to_be_visible(timeout=15000)
                    reserve=coverage.get_by_role("button",name=re.compile("Reserve quote|Réserver le devis"));expect(reserve).to_be_disabled()
                    coverage.get_by_role("checkbox").check();reserve.click()
                    panel=page.get_by_role("region",name=re.compile("Local private checkout|Paiement privé local"));expect(panel).to_be_visible(timeout=15000)
                    pay=panel.get_by_role("button");expect(pay).to_be_disabled();panel.get_by_role("checkbox").check()
                    # Response lost: refresh offers an explicit recovery with the SAME key, quote and scope.
                    lose_checkout[0]=True;pay.click();expect(panel.get_by_role("status").first).to_contain_text(re.compile("non confirmée|could not be confirmed"))
                    first=[x for x in sent if x["op"]=="checkout"][0]
                    page.reload(wait_until="domcontentloaded")
                    recovery=page.get_by_role("region",name=re.compile("Local private checkout|Paiement privé local"));expect(recovery).to_be_visible(timeout=15000)
                    recovery.get_by_role("checkbox").check();recovery.get_by_role("button").click()
                    page.wait_for_timeout(700)
                    checkouts=[x for x in sent if x["op"]=="checkout"];assert len(checkouts)==2
                    assert checkouts[0]==checkouts[1],"Recovery changed request identity"
                    assert any("checkout.stripe.com" in x for x in blocked),"No guarded navigation observed"
                    # Simulate provider return explicitly; never load Stripe.
                    page.goto(site+"/configure/private-success?attempt="+first["attempt"]+"&session_id="+sessions[first["attempt"]],wait_until="domcontentloaded")
                    expect(page.get_by_role("status")).to_contain_text(re.compile("réception.*email.*pas vérifiée|Email receipt has not been verified"),timeout=15000)
                    assert [x["op"] for x in sent]==["source","freeze","quote","checkout","checkout","status"]
                    assert not any("owner_token" in json.dumps(x) for x in sent)
                    local=page.evaluate("sessionStorage.getItem('stratverity.private-audit.ui.v1')")
                    assert not re.search(r'"(?:source|email|filename|owner_token|access_token)"',local)
                    page.screenshot(path=str(output/"private-return.png"),full_page=True)
                    # Invalid duplicate query cannot obtain a new status.
                    count=len(sent);page.goto(page.url+"&session_id=cs_duplicate",wait_until="domcontentloaded")
                    expect(page.get_by_role("status")).to_contain_text(re.compile("absent ou invalide|missing or invalid"));assert len(sent)==count
                    # A -> B -> A while freeze is pending must not resurrect the old quote.
                    second=context.new_page();second.goto(site+"/configure",wait_until="domcontentloaded")
                    second.wait_for_function("() => Object.keys(document.querySelector('input[type=file]')).some(k=>k.startsWith('__reactFiber$'))")
                    second.locator('input[type=file]').set_input_files(dict(name="fixture.py",mimeType="text/plain",buffer=b"def run(bars):\n    return []\n"))
                    hold_freeze[0]=True
                    second.locator('button[type=submit]').filter(has_text=re.compile("Verify request|Vérifier la demande")).click()
                    for _ in range(60):
                        if deferred:break
                        second.wait_for_timeout(50)
                    assert len(deferred)==1
                    second.get_by_role("button",name=re.compile("^Premium")).click()
                    second.get_by_role("button",name=re.compile("^Essentiel|^Essential")).click()
                    for route,body in deferred:route.fulfill(status=200,content_type="application/json",body=body)
                    hold_freeze[0]=False;second.wait_for_timeout(350)
                    assert second.get_by_role("region",name=re.compile("Data coverage|Couverture des données")).count()==0
                    # Eight pending records must not be evicted or consume source/freeze.
                    full=[dict(json.loads(local)[0],attempt="fullfixture"+str(i)) for i in range(8)]
                    second.evaluate("raw=>sessionStorage.setItem('stratverity.private-audit.ui.v1',raw)",json.dumps(full))
                    before_full=len(sent)
                    second.locator('button[type=submit]').filter(has_text=re.compile("Verify request|Vérifier la demande")).click()
                    expect(second.get_by_text(re.compile("stockage local est indisponible ou saturé|Local storage is unavailable or full"))).to_be_visible()
                    assert len(sent)==before_full
                    assert second.evaluate("sessionStorage.getItem('stratverity.private-audit.ui.v1')")==json.dumps(full)
                    second.close()
                    evidence.update(pass_=True,private_operations=[x["op"] for x in sent],recovery_same_key_scope_quote=True,
                        real_provider_requests=0,blocked_external=len(blocked),browser_errors=errors,instant_price_before_fetch=price,
                        duplicate_query_no_status=True,source_not_stored=True,aba_deferred_freeze_refused=True,
                        eight_pending_preflight_no_upload=True)
                    context.close();browser.close()
            except Exception as exc:
                evidence.update(pass_=False,error=repr(exc),private_operations=[x["op"] for x in sent],browser_errors=errors)
                raise
            finally:
                process.terminate()
                try:process.wait(timeout=10)
                except subprocess.TimeoutExpired:process.kill();process.wait()
                auth.shutdown();auth.server_close()
                (output/"result.json").write_text(json.dumps(evidence,indent=2),encoding="utf8")
                print(output,flush=True)


if __name__=="__main__":run()

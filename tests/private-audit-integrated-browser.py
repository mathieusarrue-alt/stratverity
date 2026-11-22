"""One local browser -> cookie proxy -> real HTTP -> pinned Docker witness.

Only fixtures and a previously frozen capture are used. No provider, personal
cookie, .env loader, external browser navigation or product configuration change.
The UI clock alone is historical; Auth expiry and process clocks remain real.
"""
import argparse
import base64
from contextlib import ExitStack
from datetime import datetime
import hashlib
from http.server import ThreadingHTTPServer
import importlib.util
import json
import os
from pathlib import Path
import queue
import re
import shutil
import subprocess
import tempfile
import threading
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
LOOPBACK = re.compile(r"http://127\.0\.0\.1:[1-9][0-9]{0,4}")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_fixture(path, expected_sha):
    # Pin BEFORE executing imported Python, and check again after its import.
    if digest(path)!=expected_sha:raise ValueError("Fixture import pin mismatch")
    spec=importlib.util.spec_from_file_location("private_audit_ui_fixture",path)
    fixture=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fixture)
    if digest(path)!=expected_sha:raise ValueError("Fixture changed during import")
    fixture.USER["id"]="fixture-http-user" # Synthetic in-memory subject only.
    return fixture


def allowed_browser_origin(url, site, auth_origin, websocket=False):
    parsed=urlsplit(url)
    allowed={urlsplit(site).netloc} if websocket else {urlsplit(site).netloc,urlsplit(auth_origin).netloc}
    return parsed.scheme==("ws" if websocket else "http") and parsed.netloc in allowed


def checkout_observation(attempt, key, request_body, response_body):
    if not isinstance(key,str) or not re.fullmatch(r"[A-Za-z0-9._:-]{16,255}",key):raise ValueError("Fixture key required")
    response=json.loads(response_body)
    return dict(attempt=attempt,key_sha256=hashlib.sha256(key.encode()).hexdigest(),
        request_sha256=hashlib.sha256(request_body.encode()).hexdigest(),quote_sha256=response["quote_sha256"],
        session=response["checkout_session_id"],response_sha256=hashlib.sha256(response_body).hexdigest())


def runtime_env():
    # No application variables, credentials, proxies or browser profiles inherited.
    allowed = ["SystemRoot", "WINDIR", "COMSPEC", "PATH", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA", "APPDATA"]
    return {name: os.environ[name] for name in allowed if name in os.environ}


class Controller:
    def __init__(self, args, site, output):
        self.log = (output/"controller-stderr.log").open("w", encoding="utf8")
        self.process = subprocess.Popen([str(args.python), "-m", "scripts.gpt_private_http_docker_rehearsal",
            str(args.capture), str(output/"backend-private"), "--site", site], cwd=args.backend,
            env=runtime_env(), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=self.log,
            text=True, encoding="utf8", bufsize=1)
        self.lines = queue.Queue()
        def read():
            for line in self.process.stdout:self.lines.put(line)
            self.lines.put(None)
        threading.Thread(target=read, daemon=True).start()
        self.stopped = False
        try:
            self.ready = self.response(timeout=30)
            if self.ready.get("ready") is not True or self.ready.get("site") != site or not LOOPBACK.fullmatch(self.ready.get("upstream", "")):
                raise ValueError("Unexpected local controller readiness")
        except Exception:
            self.close();raise

    def response(self, timeout=180):
        line = self.lines.get(timeout=timeout)
        if line is None:raise RuntimeError("Controller ended before response")
        value = json.loads(line)
        if not isinstance(value,dict):raise ValueError("Controller object required")
        return value

    def command(self, name, timeout=180):
        if name not in {"inspect","deliver","finish","stop"}:raise ValueError("Fixture command refused")
        self.process.stdin.write(json.dumps({"command":name})+"\n");self.process.stdin.flush()
        result = self.response(timeout=timeout)
        if name == "stop":self.stopped = True
        return result

    def close(self):
        if self.process.poll() is None:
            try:
                if not self.stopped:self.command("stop",timeout=5)
                self.process.stdin.close();self.process.wait(timeout=20)
            except Exception:
                self.process.terminate()
                try:self.process.wait(timeout=10)
                except subprocess.TimeoutExpired:self.process.kill();self.process.wait()
        self.log.close()


def run(args):
    for name in ("backend","python","capture","output"):
        path=getattr(args,name)
        if not path.is_absolute():raise ValueError("Absolute paths required")
    output=args.output.resolve();output.mkdir(parents=True,exist_ok=False)
    pin_paths=[ROOT/path for path in ["app/configure/private-audit-client.ts","app/configure/private-audit-flow.ts",
        "app/api/private-audit/bridge.ts","app/api/private-audit/[attempt]/[operation]/route.ts",
        "app/configure/page.tsx","app/configure/private-success/page.tsx","app/configure/private-success/layout.tsx",
        "app/configure/private-audit-checkout-panel.tsx","vite.config.ts","tests/private-audit-ui-browser.py",
        "tests/private-audit-integrated-browser.py"]]
    pin_paths += [args.backend/"scripts/gpt_private_http_docker_rehearsal.py",args.capture/"verification.json",
        args.capture/"snapshots/BINANCE_BTCUSDT/15m.csv.gz",args.capture/"snapshots/BINANCE_BTCUSDT/15m.csv.gz.source.json",
        args.capture/"BTCUSDT_15m_second.json"]
    before={str(path):digest(path) for path in pin_paths}
    fixture_path=ROOT/"tests/private-audit-ui-browser.py"
    fixture=load_fixture(fixture_path,before[str(fixture_path)])
    Auth,USER,free_port=fixture.Auth,fixture.USER,fixture.free_port
    site=f"http://127.0.0.1:{free_port()}"
    controller=None;auth=None;vite=None;exit_code=None
    proof=dict(schema="private-integrated-browser@1",authorization=False,pass_=False,fixture_only=True,
        external_browser_requests_allowed=False,env_files_loaded=False,real_provider=False,
        native_auth_qualified=False,broker_parity=False,physical_quotas_qualified=False)
    try:
        controller=Controller(args,site,output);ready=controller.ready
        cutoff=datetime.fromisoformat(ready["cutoff"])
        if cutoff.utcoffset().total_seconds()!=0:raise ValueError("UTC historical capture required")
        source=ready["source"]
        if hashlib.sha256(source.encode()).hexdigest()!=ready["source_sha256"]:raise ValueError("Fixed witness mismatch")
        auth=ThreadingHTTPServer(("127.0.0.1",free_port()),Auth)
        threading.Thread(target=auth.serve_forever,daemon=True).start()
        env=runtime_env();env.update(NODE_ENV="development",NEXT_PUBLIC_SUPABASE_URL=f"http://127.0.0.1:{auth.server_port}",
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="fixture-publishable-not-secret",
            NEXT_PUBLIC_STRATVERITY_API_URL=ready["upstream"],STRATVERITY_PRIVATE_AUDIT_UPSTREAM=ready["upstream"],
            NEXT_PUBLIC_STRATVERITY_PRIVATE_AUDIT_LOCAL="1",STRATVERITY_PRIVATE_AUDIT_LOCAL="1",
            NEXT_PUBLIC_STRATVERITY_PRIVATE_AUDIT_CHECKOUT_LOCAL="1",STRATVERITY_PRIVATE_AUDIT_CHECKOUT_LOCAL="1",
            STRATVERITY_PRIVATE_AUDIT_SITE=site,WRANGLER_SEND_METRICS="false",WRANGLER_WRITE_LOGS="false",BROWSER="none")
        js="""import {createServer} from 'vite';
          const s=await createServer({envDir:process.argv[1],server:{host:'127.0.0.1',port:Number(process.argv[2]),strictPort:true}});
          await s.listen();process.on('SIGTERM',()=>s.close());"""
        with tempfile.TemporaryDirectory(prefix="sv-integrated-empty-env-") as empty_env, (output/"vite.log").open("w",encoding="utf8") as log:
            vite=subprocess.Popen([shutil.which("node"),"--input-type=module","-e",js,empty_env,str(urlsplit(site).port)],
                cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT)
            for _ in range(90):
                if vite.poll() is not None:raise RuntimeError("Dev server ended")
                try:
                    with urlopen(site+"/api/health-check",timeout=1):break
                except HTTPError as error:
                    if error.code==405:break
                except Exception:time.sleep(.5)
            else:raise RuntimeError("Dev server not ready")
            errors=[];blocked=[];operations=[];checkouts=[];statuses=[];lost=[False];dispatches=[0]
            auth_origin=f"http://127.0.0.1:{auth.server_port}"
            with sync_playwright() as playwright, ExitStack() as browser_cleanup:
                browser=playwright.chromium.launch(executable_path=args.chrome,headless=True,args=["--disable-background-networking"])
                browser_cleanup.callback(browser.close)
                context=browser.new_context(viewport={"width":1320,"height":1100})
                browser_cleanup.callback(context.close)
                def guard(route):
                    url=route.request.url
                    if not allowed_browser_origin(url,site,auth_origin):blocked.append(url);route.abort();return
                    route.continue_()
                context.route("**/*",guard) # Before navigation; no Stripe fetch at any point.
                context.route_web_socket("**/*",lambda route:route.connect_to_server()
                    if allowed_browser_origin(route.url,site,auth_origin,websocket=True) else route.close())
                session=dict(access_token="fixture-http-owner",refresh_token="fixture-refresh",expires_at=int(time.time())+3600,
                    expires_in=3600,token_type="bearer",user=USER)
                cookie="base64-"+base64.urlsafe_b64encode(json.dumps(session).encode()).decode().rstrip("=")
                context.add_cookies([dict(name="sb-127-auth-token",value=cookie,url=site,sameSite="Lax")])
                def checkout(route):
                    request=route.request
                    if not request.url.startswith(site+"/api/private-audit/"):
                        route.abort();raise AssertionError("Checkout interception must stay on fixture site")
                    dispatches[0]+=1
                    result=route.fetch(max_redirects=0,max_retries=0) # True cookie-bearing Next handler + HTTP composition.
                    body=result.body() # Fully attach and receive body before simulating response loss.
                    if result.status!=201:raise AssertionError("Actual checkout status "+str(result.status))
                    if result.headers.get("content-type","").split(";",1)[0].strip().lower()!="application/json":
                        raise AssertionError("Actual checkout must return JSON")
                    response=json.loads(body)
                    if response.get("authorization") is not False:raise AssertionError("Unexpected checkout authority")
                    assert response.get("checkout_url")=="https://checkout.stripe.com/c/pay/fixture#fidFixture%2Fopaque"
                    checkouts.append(checkout_observation(request.url.split("/")[-2],request.headers.get("idempotency-key"),request.post_data,body))
                    if not lost[0]:lost[0]=True;route.abort();return
                    route.fulfill(response=result)
                context.route("**/api/private-audit/*/checkout",checkout)
                page=context.new_page();page.clock.install(time=cutoff)
                page.on("pageerror",lambda error:errors.append(str(error)))
                def observed(response):
                    path=urlsplit(response.url).path
                    if "/api/private-audit/" not in path:return
                    op=path.rsplit("/",1)[-1];operations.append([op,response.status])
                    if op=="status":statuses.append(response.json())
                page.on("response",observed)
                page.goto(site+"/configure",wait_until="domcontentloaded")
                page.wait_for_function("() => {const f=document.querySelector('input[type=file]');return f&&Object.keys(f).some(k=>k.startsWith('__reactFiber$'));}")
                price=page.locator('[role=status][aria-atomic=true]').first.inner_text();assert "19" in price and not operations
                page.locator('input[type=file]').set_input_files(dict(name="technical-fixed-witness.py",mimeType="text/plain",buffer=source.encode()))
                page.locator('button[type=submit]').filter(has_text=re.compile("Verify request|Vérifier la demande")).click()
                coverage=page.get_by_role("region",name=re.compile("Data coverage|Couverture des données"));expect(coverage).to_be_visible(timeout=30000)
                reserve=coverage.get_by_role("button",name=re.compile("Reserve quote|Réserver le devis"));expect(reserve).to_be_disabled()
                coverage.get_by_role("checkbox").check();reserve.click()
                panel=page.get_by_role("region",name=re.compile("Local private checkout|Paiement privé local"));expect(panel).to_be_visible(timeout=30000)
                panel.get_by_role("checkbox").check();panel.get_by_role("button").click()
                expect(panel.get_by_role("status").first).to_contain_text(re.compile("non confirmée|could not be confirmed"),timeout=30000)
                attached=controller.command("inspect");assert attached["gateway_calls"]==1 and len(checkouts)==1
                page.reload(wait_until="domcontentloaded")
                expect(panel).to_be_visible(timeout=30000);panel.get_by_role("checkbox").check();panel.get_by_role("button").click()
                for _ in range(100):
                    if len(checkouts)==2 and "https://checkout.stripe.com/c/pay/fixture" in blocked:break
                    page.wait_for_timeout(50)
                assert len(checkouts)==2 and checkouts[0]==checkouts[1],"Retry identity/body/quote/session changed"
                pinned=controller.command("inspect")
                assert pinned["gateway_calls"]==1 and pinned["checkout_session_id"]==checkouts[1]["session"]
                template=pinned["success_url"]
                assert template.startswith(site+"/configure/private-success?") and template.count("{CHECKOUT_SESSION_ID}")==1
                return_url=template.replace("{CHECKOUT_SESSION_ID}",pinned["checkout_session_id"])
                assert urlsplit(return_url).hostname=="127.0.0.1" and "https://checkout.stripe.com/c/pay/fixture" in blocked
                page.goto(return_url,wait_until="domcontentloaded")
                for _ in range(100):
                    if statuses:break
                    page.wait_for_timeout(50)
                assert statuses and statuses[-1]["report_ready"] is False and statuses[-1]["authorization"] is False
                before_delivery=statuses[-1]
                page.screenshot(path=str(output/"pending.png"),full_page=True)
                delivered=controller.command("deliver");assert delivered=={"first":"SUCCEEDED","second":"IDLE"}
                expect(page.get_by_role("status")).to_contain_text(re.compile("réception.*email.*pas vérifiée|Email receipt has not been verified"),timeout=30000)
                assert statuses[-1]["report_ready"] is True and statuses[-1]["authorization"] is False
                page.screenshot(path=str(output/"ready.png"),full_page=True)
                cache=page.evaluate("sessionStorage.getItem('stratverity.private-audit.ui.v1')")
                assert not re.search(r'"(?:source|email|filename|owner_token|access_token)"',cache)
                assert not errors,errors
                assert not any(op in {"source","freeze","quote","status"} and code!=200 for op,code in operations)
                browser_checkout_responses=sum(op=="checkout" for op,_ in operations)
                assert dispatches[0]==2 and browser_checkout_responses==1
                finished=controller.command("finish")
                assert finished["docker_runs"]==1 and finished["gateway_calls"]==1 and finished["input_hashes_stable"] is True
                stop=controller.command("stop");assert stop=={"stopped":True}
                controller.process.wait(timeout=20);exit_code=controller.process.returncode;assert exit_code==0
                proof.update(pass_=True,browser_clock_only=cutoff.isoformat(),auth_expiry_real_clock=True,server_clock_historical=True,
                    operations=operations,lost_response_after_attach=True,retry_same_attempt_key_body_quote_session=True,
                    provider_calls=1,docker_runs=1,source_sha256=ready["source_sha256"],pending=before_delivery,
                    ready_status=statuses[-1],controller_exit=exit_code,instant_price_before_fetch=price,
                    blocked_external=len(blocked),browser_errors=errors,cache_metadata_only=True,
                    pinned_return_template_used=True,backend_proof_sha256=digest(output/"backend-private/proof.json"),
                    checkout_dispatches=dispatches[0],browser_checkout_responses=browser_checkout_responses,
                    checkouts=checkouts,browser_origins=[site,auth_origin],browser_direct_backend_allowed=False,
                    auth_fixture_pinned_before_import=True,browser_cleanup_on_assertion=True)
    except Exception as error:
        proof.update(error_type=type(error).__name__,error=str(error)[:1000]);raise
    finally:
        if vite is not None and vite.poll() is None:
            vite.terminate()
            try:vite.wait(timeout=15)
            except subprocess.TimeoutExpired:vite.kill();vite.wait()
        if controller is not None:controller.close()
        if auth is not None:auth.shutdown();auth.server_close()
        after={str(path):digest(path) for path in pin_paths}
        proof["input_pins_stable"]=before==after
        proof["input_pins"]=[dict(name=Path(path).name,sha256=sha) for path,sha in before.items()]
        if before!=after:proof.update(pass_=False,pin_failure=True)
        (output/"browser-proof.json").write_text(json.dumps(proof,indent=2),encoding="utf8")
        print(str(output),flush=True)
    if not proof["pass_"]:raise RuntimeError("Integrated browser recipe not qualified")


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ("backend","python","capture","output"):parser.add_argument("--"+name,type=Path,required=True)
    parser.add_argument("--chrome",default=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    run(parser.parse_args())

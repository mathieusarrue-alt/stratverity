"""HTTPS loopback Health lifecycle fixture; no provider or production activation.

Global Python runs the browser. Qualification Python runs --backend-fixture
without importing Playwright or cryptography. Only static synthetic text is
submitted; it is never executed as a customer strategy.
"""
import argparse
from contextlib import ExitStack
from datetime import datetime, timedelta, timezone
import hashlib
import importlib.util
import ipaddress
import json
from pathlib import Path
import queue
import re
import shutil
import socket
import ssl
import subprocess
import sys
import tempfile
import threading
import time
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlsplit
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'def run(bars):\n    return []\n'
OLD_SHA = '26a30b5ef21748ba79398d92f97fe6a123f1f7fb138ce6c63b1729956c24224f'
SITE = re.compile(r'https://127\.0\.0\.1:[1-9][0-9]{0,4}\Z')
UPSTREAM = re.compile(r'http://127\.0\.0\.1:[1-9][0-9]{0,4}\Z')


def helpers():
    path = ROOT/'tests/health-unavailable-browser.py'
    if hashlib.sha256(path.read_bytes()).hexdigest() != OLD_SHA:
        raise RuntimeError('Historical helper pin differs')
    spec = importlib.util.spec_from_file_location('health_unavailable_fixture_helpers', path)
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


def backend_fixture(args):
    if (not args.backend.is_absolute() or not SITE.fullmatch(args.site or '')
            or args.fixture_dir is None or not args.fixture_dir.is_absolute()):
        raise ValueError('Explicit HTTPS loopback fixture paths required')
    sys.path.insert(0, str(args.backend))
    from fastapi import FastAPI
    import uvicorn
    import audit_app.health_check as health
    from audit_app.api.eligibility_fastapi import build_eligibility_router
    from audit_app.api.eligibility_http import EligibilityHttpAdapter
    from audit_app.api.health_check_http import build_health_check_router
    from audit_app.eligibility import (EligibilityService, PseudonymousKeyFactory,
        SQLiteEligibilityRegistry, SQLiteProofConsumptionRegistry, SignedProofCodec)
    from audit_app.health_check.attempts import (HealthAttemptLimits, SQLiteHealthAttempts,
        migrate_health_attempts)
    database = args.fixture_dir/'disposable-health.sqlite'
    registry = SQLiteEligibilityRegistry(database)
    service = EligibilityService(registry=registry, proof_consumptions=SQLiteProofConsumptionRegistry(database),
        keys=PseudonymousKeyFactory(b'fixture-browser-identity-secret-32bytes-plus'),
        proofs=SignedProofCodec(b'fixture-browser-proof-secret-32bytes-plus', key_id='browser-fixture'))
    migrate_health_attempts(database)
    limits = HealthAttemptLimits(max_attempts=3, max_result_bytes=65536, max_owner_rows=2,
        max_total_rows=4, max_owner_reserved_bytes=131072, max_total_reserved_bytes=262144)
    attempts = SQLiteHealthAttempts(service, limits=limits)
    sent = []; scans = [0]; original = health.scan_source
    class CaptureEmail:
        def send_verification_link(self, *, email, url):
            if email != 'fixture@example.invalid':
                raise ValueError('Unexpected synthetic recipient')
            sent.append(url)  # private process memory; no sender or network client
    adapter = EligibilityHttpAdapter(service=service, email_sender=CaptureEmail(), public_origin=args.site,
        channel='website', confirmation_path='/api/eligibility/email/confirm',
        success_path='/health-check?email=verified')
    def scanner(code):
        if code != SOURCE:
            raise RuntimeError('Unexpected static fixture source')
        scans[0] += 1
        if scans[0] == 1:
            raise OSError('SYNTHETIC_TECHNICAL_FAILURE')
        return original(code)
    health.scan_source = scanner
    app = FastAPI()
    app.include_router(build_eligibility_router(adapter))
    app.include_router(build_health_check_router((args.site,), adapter,
        health_attempts=attempts, health_profile_version='fixture-browser-v1'))
    @app.get('/auth/v1/settings')
    def settings():
        return {'external':{}}
    listener = socket.socket(); listener.bind(('127.0.0.1', 0)); listener.listen(32)
    server = uvicorn.Server(uvicorn.Config(app, log_level='error', access_log=False))
    thread = threading.Thread(target=server.run, kwargs={'sockets':[listener]}, daemon=True); thread.start()
    def emit(value):
        print(json.dumps(value), flush=True)
    try:
        deadline = time.monotonic()+20
        while not server.started:
            if not thread.is_alive() or time.monotonic() > deadline:
                raise RuntimeError('Fixture backend unavailable')
            time.sleep(.01)
        emit({'ready':True, 'site':args.site, 'upstream':f'http://127.0.0.1:{listener.getsockname()[1]}',
              'eligibility':True, 'lifecycle':True})
        for line in sys.stdin:
            command = line.strip()
            if command == 'link':
                if len(sent) != 1:
                    raise RuntimeError('Expected exactly one captured synthetic message')
                emit({'url':sent[0]})  # private pipe only, never written into proof
            elif command == 'inspect':
                with registry._connect() as connection:
                    rows = connection.execute('SELECT status,attempts,generation,result_sha FROM health_attempts').fetchall()
                    grants = connection.execute('SELECT count(*) FROM eligibility_grants').fetchone()[0]
                emit({'scans':scans[0], 'grants':grants, 'rows':len(rows), 'messages':len(sent),
                      'attempts':[dict(row) for row in rows]})
            elif command == 'stop':
                emit({'stopped':True}); break
            else:
                raise ValueError('Unknown fixture command')
    finally:
        server.should_exit = True; thread.join(timeout=10); listener.close()


def certificate(directory):
    # Installed global dependency only, never imported by qualification child.
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, '127.0.0.1')])
    now = datetime.now(timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
        .serial_number(x509.random_serial_number()).not_valid_before(now-timedelta(minutes=1))
        .not_valid_after(now+timedelta(hours=2))
        .add_extension(x509.SubjectAlternativeName([x509.IPAddress(ipaddress.ip_address('127.0.0.1'))]), critical=False)
        .sign(key, hashes.SHA256()))
    key_path = directory/'private-key.pem'; cert_path = directory/'certificate.pem'
    key_path.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption()))
    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    return key_path, cert_path


def run(args):
    from playwright.sync_api import sync_playwright, expect
    for path in (args.backend, args.python, args.output, args.chrome):
        if path is None or not path.is_absolute():
            raise ValueError('Absolute paths required')
    old = helpers()
    output = args.output; output.mkdir(parents=True, exist_ok=False)
    front_paths = ['tests/health-lifecycle-browser.py', 'tests/health-unavailable-browser.py',
        'app/health-check/page.tsx', 'app/api/health-check/route.ts', 'app/api/eligibility/proxy.ts',
        'app/api/eligibility/session/route.ts', 'app/api/eligibility/email/request/route.ts',
        'app/api/eligibility/email/confirm/route.ts', 'app/i18n/messages.ts', 'vite.config.ts', 'worker/index.ts']
    back_paths = ['audit_app/health_check/__init__.py', 'audit_app/health_check/attempts.py',
        'audit_app/health_check/lifecycle_service.py', 'audit_app/api/health_check_http.py',
        'audit_app/api/eligibility_http.py', 'audit_app/api/eligibility_fastapi.py',
        'audit_app/eligibility/service.py', 'audit_app/eligibility/registry.py',
        'audit_app/eligibility/proofs.py', 'audit_app/eligibility/proof_registry.py',
        'audit_app/eligibility/identity.py', 'audit_app/storage/migrations/001_health_attempts.sql']
    paths = [ROOT/path for path in front_paths]+[args.backend/path for path in back_paths]
    before = {str(path):old.digest(path) for path in paths}
    proof = dict(schema='health-lifecycle-browser@1', pass_=False, fixture_only=True, authorization=False,
        real_provider=False, production_activated=False, submitted_code_executed=False, env_files_loaded=False,
        eligibility_fixture=True, lifecycle_fixture=True, os_ca_modified=False)
    backend = None; vite = None; health_statuses = []; failures = []; blocked = []; inspected = []
    try:
        site = f'https://127.0.0.1:{old.port()}'; lines = queue.Queue()
        with tempfile.TemporaryDirectory(prefix='sv-health-lifecycle-private-') as private_name:
            private = Path(private_name); key, cert = certificate(private)
            with ExitStack() as resources:
                # Private diagnostic logs may include synthetic verification URLs.
                # Never copy these logs into public evidence or commits.
                proof['stage'] = 'STARTING_BACKEND'
                back_log = resources.enter_context((output/'backend-private.log').open('w', encoding='utf8'))
                vite_log = resources.enter_context((output/'frontend-private.log').open('w', encoding='utf8'))
                backend = subprocess.Popen([str(args.python), str(Path(__file__).resolve()), '--backend-fixture',
                    '--backend', str(args.backend), '--fixture-dir', str(private), '--site', site],
                    cwd=args.backend, env=old.environment(), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                    stderr=back_log, text=True, encoding='utf8', bufsize=1)
                resources.callback(old.stop_owned, backend)
                def read():
                    for line in backend.stdout:
                        lines.put(line)
                    lines.put(None)
                threading.Thread(target=read, daemon=True).start()
                def response():
                    line = lines.get(timeout=25)
                    if line is None:
                        raise RuntimeError('Fixture backend ended')
                    return json.loads(line)
                def command(value):
                    backend.stdin.write(value+'\n'); backend.stdin.flush(); return response()
                ready = response(); upstream = ready.get('upstream', '')
                if (ready.get('ready') is not True or ready.get('site') != site
                        or ready.get('eligibility') is not True or ready.get('lifecycle') is not True
                        or not UPSTREAM.fullmatch(upstream)):
                    raise RuntimeError('Fixture readiness mismatch')
                env = old.environment()
                env.update(NODE_ENV='development', NEXT_PUBLIC_SITE_ORIGIN=site,
                    NEXT_PUBLIC_STRATVERITY_API_URL=upstream, NEXT_PUBLIC_FREE_ELIGIBILITY_ENABLED='true',
                    NEXT_PUBLIC_SUPABASE_URL=site, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-not-secret',
                    WRANGLER_SEND_METRICS='false', WRANGLER_WRITE_LOGS='false', BROWSER='none')
                js = """import {createServer} from 'vite';import fs from 'node:fs';
                  const server=await createServer({envDir:process.argv[1],server:{host:'127.0.0.1',port:Number(process.argv[2]),strictPort:true,
                    https:{key:fs.readFileSync(process.argv[3]),cert:fs.readFileSync(process.argv[4])}}});
                  await server.listen();process.stdin.on('data',async data=>{if(data.toString().trim()==='stop'){await server.close();process.exit(0);}});"""
                empty_env = private/'empty-env'; empty_env.mkdir()
                proof['stage'] = 'STARTING_FRONTEND'
                vite = subprocess.Popen([shutil.which('node'), '--input-type=module', '-e', js, str(empty_env),
                    str(urlsplit(site).port), str(key), str(cert)], cwd=ROOT, env=env, stdin=subprocess.PIPE,
                    stdout=vite_log, stderr=subprocess.STDOUT, text=True, encoding='utf8')
                resources.callback(old.stop_owned, vite)
                local_tls = ssl._create_unverified_context()  # this one loopback readiness connection only
                for _ in range(90):
                    if vite.poll() is not None:
                        raise RuntimeError('Fixture frontend ended')
                    try:
                        with urlopen(site+'/api/health-check', context=local_tls, timeout=1):
                            break
                    except HTTPError as error:
                        if error.code == 405:
                            break
                    except Exception:
                        time.sleep(.5)
                else:
                    raise RuntimeError('Fixture frontend unavailable')
                with sync_playwright() as playwright, ExitStack() as browser_resources:
                    browser = playwright.chromium.launch(executable_path=str(args.chrome), headless=True,
                        args=['--disable-background-networking'])
                    browser_resources.callback(browser.close)
                    context = browser.new_context(locale='en-US', reduced_motion='reduce',
                        viewport={'width':1320,'height':1100}, ignore_https_errors=True)
                    browser_resources.callback(context.close)
                    dispatches = []; lost_response = []; normal_responses = []; page_errors = []
                    def allowed(url, websocket=False):
                        parsed = urlsplit(url)
                        return parsed.netloc == urlsplit(site).netloc and parsed.scheme == ('wss' if websocket else 'https')
                    def guard(route):
                        if not allowed(route.request.url):
                            blocked.append(urlsplit(route.request.url).hostname); route.abort(); return
                        if urlsplit(route.request.url).path == '/api/health-check' and route.request.method == 'POST':
                            dispatches.append(hashlib.sha256(route.request.post_data_buffer or b'').hexdigest())
                            if len(dispatches) == 2:
                                result = route.fetch(max_redirects=0, max_retries=0)
                                body = result.body()
                                if result.status != 200 or 'application/json' not in result.headers.get('content-type', ''):
                                    raise AssertionError('Lost-response fixture expected real successful JSON')
                                doc = json.loads(body)
                                if doc.get('score') != 100:
                                    raise AssertionError('Unexpected completed Health response')
                                lost_response.append(hashlib.sha256(body).hexdigest())
                                route.abort(); return
                        route.continue_()
                    context.route('**/*', guard)
                    context.route_web_socket('**/*', lambda route: route.connect_to_server() if allowed(route.url, True) else route.close())
                    page = context.new_page(); page.on('pageerror', lambda error: page_errors.append(type(error).__name__))
                    def observed(result):
                        if urlsplit(result.url).path == '/api/health-check':
                            health_statuses.append(result.status)
                    page.on('response', observed)
                    proof['stage'] = 'VERIFYING_EMAIL'
                    page.goto(site+'/health-check', wait_until='domcontentloaded')
                    page.wait_for_function("() => {const t=document.querySelector('textarea');return t&&Object.keys(t).some(k=>k.startsWith('__reactFiber$'));}")
                    page.get_by_label('Source language').select_option('python'); page.locator('textarea').fill(SOURCE)
                    page.locator('input[type=email]').fill('fixture@example.invalid')
                    with page.expect_response(lambda result: urlsplit(result.url).path == '/api/eligibility/email/request') as email_response:
                        page.locator('button[type=submit]').click()
                    assert email_response.value.status == 202
                    cookie = next(item for item in context.cookies() if item['name'] == '__Host-ab_session')
                    assert cookie['secure'] and cookie['httpOnly'] and cookie['path'] == '/'
                    link = command('link')['url']; parsed = urlsplit(link)
                    assert (parsed.scheme, parsed.netloc, parsed.path) == ('https', urlsplit(site).netloc, '/api/eligibility/email/confirm')
                    assert not parsed.fragment and set(parse_qs(parsed.query)) == {'token'}
                    page.goto(link, wait_until='domcontentloaded')
                    expect(page).to_have_url(site+'/health-check?email=verified')
                    email_cookie = next(item for item in context.cookies() if item['name'] == '__Host-ab_email')
                    assert email_cookie['secure'] and email_cookie['httpOnly'] and email_cookie['path'] == '/'
                    page.wait_for_function("() => {const t=document.querySelector('textarea');return t&&Object.keys(t).some(k=>k.startsWith('__reactFiber$'));}")
                    page.get_by_label('Source language').select_option('python'); page.locator('textarea').fill(SOURCE)
                    submit = page.locator('button[type=submit]')
                    proof['stage'] = 'FAILED_SCAN'
                    with page.expect_response(lambda result: urlsplit(result.url).path == '/api/health-check') as failed:
                        submit.click()
                    assert failed.value.status == 503 and failed.value.json() == {'detail':{'code':'HEALTH_CHECK_UNAVAILABLE'}}
                    expect(page.get_by_role('alert')).to_have_text('HTTP 503')
                    expect(page.get_by_role('img', name='Score 100/100', exact=True)).to_have_count(0)
                    page.screenshot(path=str(output/'technical-failure.png'), full_page=True, mask=[page.locator('textarea')])
                    inspected.append(command('inspect'))
                    assert inspected[-1]['scans'] == 1 and inspected[-1]['attempts'][0]['status'] == 'FAILED_TECHNICAL'
                    proof['stage'] = 'LOST_REPLY'
                    with page.expect_event('requestfailed', predicate=lambda request:
                            urlsplit(request.url).path == '/api/health-check') as lost:
                        submit.click()
                    assert lost.value.failure
                    expect(page.get_by_role('alert')).to_be_visible(timeout=15000)
                    assert len(lost_response) == 1
                    expect(page.get_by_role('img', name='Score 100/100', exact=True)).to_have_count(0)
                    page.screenshot(path=str(output/'response-lost.png'), full_page=True, mask=[page.locator('textarea')])
                    inspected.append(command('inspect'))
                    assert inspected[-1]['scans'] == 2 and inspected[-1]['attempts'][0]['status'] == 'SUCCEEDED'
                    proof['stage'] = 'CACHED_REPLY'
                    with page.expect_response(lambda result: urlsplit(result.url).path == '/api/health-check') as cached:
                        submit.click()
                    cached_body = cached.value.body(); cached_doc = json.loads(cached_body)
                    assert cached.value.status == 200 and cached_doc['score'] == 100 and cached_doc['verdict'] == 'Excellent'
                    assert hashlib.sha256(cached_body).hexdigest() == lost_response[0]
                    expect(page.get_by_role('img', name='Score 100/100', exact=True)).to_be_visible()
                    expect(page.get_by_role('alert')).to_have_count(0)
                    page.screenshot(path=str(output/'cached-success.png'), full_page=True, mask=[page.locator('textarea')])
                    final = command('inspect'); inspected.append(final)
                    assert final['scans'] == 2 and final['grants'] == final['rows'] == final['messages'] == 1
                    assert len(final['attempts']) == 1 and final['attempts'][0]['status'] == 'SUCCEEDED'
                    assert final['attempts'][0]['attempts'] == final['attempts'][0]['generation'] == 2
                    assert len(dispatches) == 3 and len(set(dispatches)) == 1 and health_statuses == [503, 200] and not page_errors
                    proof.update(pass_=True, stage='COMPLETE', health_browser_statuses=health_statuses, dispatches=3,
                        identical_request_hashes=True, real_lost_response_sha256=lost_response[0],
                        cached_response_sha256=hashlib.sha256(cached_body).hexdigest(), inspections=inspected,
                        session_cookie_secure_httponly=True, email_cookie_secure_httponly=True,
                        captured_messages=1, browser_errors=page_errors, blocked_requests=len(blocked),
                        source_sha256=hashlib.sha256(SOURCE.encode()).hexdigest())
                assert command('stop') == {'stopped':True}; backend.wait(timeout=15)
                assert backend.returncode == 0
                old.stop_owned(vite); assert vite.returncode == 0
    except Exception as error:
        proof.update(pass_=False, failure_type=type(error).__name__)
        raise
    finally:
        old.stop_owned(vite); old.stop_owned(backend)
        proof.update(health_browser_statuses=health_statuses, inspections=inspected,
            owned_process_exit_codes={'frontend':vite.poll() if vite is not None else None,
                                      'backend':backend.poll() if backend is not None else None})
        after = {str(path):old.digest(path) for path in paths}
        proof['input_pins_stable'] = before == after
        proof['input_pins'] = {('front/'+str(path.relative_to(ROOT)) if path.is_relative_to(ROOT)
            else 'backend/'+str(path.relative_to(args.backend))):before[str(path)] for path in paths}
        if before != after:
            proof.update(pass_=False, pin_failure=True)
        (output/'proof.json').write_text(json.dumps(proof, indent=2), encoding='utf8')
        print(str(output), flush=True)
    if not proof['pass_']:
        raise RuntimeError('Health lifecycle browser fixture not qualified')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend-fixture', action='store_true'); parser.add_argument('--site')
    parser.add_argument('--backend', type=Path, required=True); parser.add_argument('--python', type=Path)
    parser.add_argument('--fixture-dir', type=Path); parser.add_argument('--output', type=Path)
    parser.add_argument('--chrome', type=Path, default=Path(r'C:\Program Files\Google\Chrome\Application\chrome.exe'))
    args = parser.parse_args()
    backend_fixture(args) if args.backend_fixture else run(args)

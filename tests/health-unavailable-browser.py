"""Local Health UI -> real Next proxy -> real Health HTTP fixture, no eligibility.

Run using the existing global Python with Playwright. Backend child uses the
qualification Python; Playwright is deliberately imported only in browser mode.
No submitted strategy is executed and no production configuration is changed.
"""
import argparse
from contextlib import ExitStack
import hashlib
import json
import os
from pathlib import Path
import queue
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import urlopen

ROOT=Path(__file__).resolve().parents[1]
SOURCE='def run(bars):\n    return []\n' # Synthetic static string only, never exec/import it.
LOOPBACK=re.compile(r'http://127\.0\.0\.1:[1-9][0-9]{0,4}')


def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def environment():
    allowed=('SystemRoot','WINDIR','COMSPEC','PATH','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA')
    return {key:os.environ[key] for key in allowed if key in os.environ}


def port():
    with socket.socket() as listener:listener.bind(('127.0.0.1',0));return listener.getsockname()[1]


def stop_owned(child):
    if child is None or child.poll() is not None:return
    try:
        child.stdin.write('stop\n');child.stdin.flush();child.wait(timeout=15)
    except Exception:
        child.terminate()
        try:child.wait(timeout=15)
        except subprocess.TimeoutExpired:child.kill();child.wait(timeout=15)


def backend_fixture(args):
    if not args.backend.is_absolute() or not LOOPBACK.fullmatch(args.site or ''):raise ValueError('Explicit local fixture required')
    sys.path.insert(0,str(args.backend))
    from fastapi import FastAPI
    import uvicorn
    import audit_app.health_check as health
    from audit_app.api.health_check_http import build_health_check_router
    calls=[0];started=threading.Event();release=threading.Event();original=health.scan_source
    def scanner(code):
        if code!=SOURCE:raise RuntimeError('Unexpected fixture source')
        calls[0]+=1
        if calls[0]==1:return original(code)
        started.set()
        if not release.wait(timeout=20):raise OSError('SYNTHETIC_HEALTH_SCANNER_TIMEOUT')
        raise OSError('SYNTHETIC_HEALTH_INTERNAL_FAILURE_NOT_PUBLIC')
    health.scan_source=scanner
    app=FastAPI();app.include_router(build_health_check_router((args.site,),eligibility=None))
    @app.get('/fixture-ready')
    def ready():return {'ready':True}
    @app.get('/auth/v1/settings')
    def settings():return {'external':{}}
    listener=socket.socket();listener.bind(('127.0.0.1',0));listener.listen(32)
    server=uvicorn.Server(uvicorn.Config(app,log_level='error',access_log=False))
    thread=threading.Thread(target=server.run,kwargs={'sockets':[listener]},daemon=True);thread.start()
    end=time.monotonic()+20
    while not server.started:
        if not thread.is_alive() or time.monotonic()>end:raise RuntimeError('Fixture backend unavailable')
        time.sleep(.01)
    def emit(value):print(json.dumps(value),flush=True)
    emit({'ready':True,'upstream':f'http://127.0.0.1:{listener.getsockname()[1]}','eligibility':False})
    try:
        for line in sys.stdin:
            command=line.strip()
            if command=='inspect':emit({'scanner_calls':calls[0],'second_started':started.is_set()})
            elif command=='release':release.set();emit({'released':True})
            elif command=='stop':release.set();emit({'stopped':True});break
            else:raise ValueError('Unexpected fixture command')
    finally:
        release.set();server.should_exit=True;thread.join(timeout=10);listener.close()


def run(args):
    from playwright.sync_api import sync_playwright,expect
    for path in (args.backend,args.python,args.output):
        if path is None or not path.is_absolute():raise ValueError('Absolute paths required')
    output=args.output;output.mkdir(parents=True,exist_ok=False)
    paths=[ROOT/path for path in ['tests/health-unavailable-browser.py','app/health-check/page.tsx',
        'app/api/health-check/route.ts','app/api/eligibility/proxy.ts','app/i18n/messages.ts','vite.config.ts','worker/index.ts']]
    paths += [args.backend/'audit_app/health_check/__init__.py',args.backend/'audit_app/api/health_check_http.py']
    before={str(path):digest(path) for path in paths}
    proof=dict(schema='health-unavailable-browser@1',pass_=False,fixture_only=True,authorization=False,
        real_eligibility=False,real_provider=False,submitted_code_executed=False,env_files_loaded=False)
    backend=None;vite=None;observed=[];response_statuses=[]
    try:
        site=f'http://127.0.0.1:{port()}';env=environment();lines=queue.Queue()
        with (output/'backend-stderr.log').open('w',encoding='utf8') as backend_log:
            backend=subprocess.Popen([str(args.python),str(Path(__file__).resolve()),'--backend-fixture','--backend',str(args.backend),'--site',site],
                cwd=args.backend,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=backend_log,text=True,encoding='utf8',bufsize=1)
            def read():
                for line in backend.stdout:lines.put(line)
                lines.put(None)
            threading.Thread(target=read,daemon=True).start()
            def response(timeout=25):
                line=lines.get(timeout=timeout)
                if line is None:raise RuntimeError('Fixture backend ended early')
                return json.loads(line)
            def command(text):backend.stdin.write(text+'\n');backend.stdin.flush();return response()
            ready=response()
            if ready.get('ready') is not True or ready.get('eligibility') is not False or not LOOPBACK.fullmatch(ready.get('upstream','')):
                raise ValueError('Unexpected fixture readiness')
            upstream=ready['upstream']
            env.update(NODE_ENV='development',NEXT_PUBLIC_SITE_ORIGIN=site,NEXT_PUBLIC_STRATVERITY_API_URL=upstream,
                NEXT_PUBLIC_FREE_ELIGIBILITY_ENABLED='false',NEXT_PUBLIC_SUPABASE_URL=upstream,
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-publishable-not-secret',WRANGLER_SEND_METRICS='false',WRANGLER_WRITE_LOGS='false',BROWSER='none')
            js="""import {createServer} from 'vite';
              const server=await createServer({envDir:process.argv[1],server:{host:'127.0.0.1',port:Number(process.argv[2]),strictPort:true}});
              await server.listen();process.stdin.on('data',async data=>{if(data.toString().trim()==='stop'){await server.close();process.exit(0);}});"""
            with tempfile.TemporaryDirectory(prefix='sv-health-empty-env-') as empty_env,(output/'vite.log').open('w',encoding='utf8') as vite_log:
                vite=subprocess.Popen([shutil.which('node'),'--input-type=module','-e',js,empty_env,str(urlsplit(site).port)],cwd=ROOT,
                    env=env,stdin=subprocess.PIPE,stdout=vite_log,stderr=subprocess.STDOUT,text=True,encoding='utf8')
                for _ in range(90):
                    if vite.poll() is not None:raise RuntimeError('Fixture frontend ended early')
                    try:
                        with urlopen(site+'/api/health-check',timeout=1):break
                    except HTTPError as error:
                        if error.code==405:break
                    except Exception:time.sleep(.5)
                else:raise RuntimeError('Fixture frontend unavailable')
                errors=[];blocked=[];requests=[]
                with sync_playwright() as playwright,ExitStack() as cleanup:
                    browser=playwright.chromium.launch(executable_path=args.chrome,headless=True,args=['--disable-background-networking'])
                    cleanup.callback(browser.close)
                    context=browser.new_context(locale='en-US',reduced_motion='reduce',viewport={'width':1320,'height':1100})
                    cleanup.callback(context.close)
                    def allowed(url,websocket=False):
                        parsed=urlsplit(url)
                        return parsed.netloc==urlsplit(site).netloc and parsed.scheme==('ws' if websocket else 'http')
                    def guard(route):
                        if not allowed(route.request.url):blocked.append(urlsplit(route.request.url).hostname);route.abort();return
                        route.continue_()
                    context.route('**/*',guard) # Installed before first navigation. No API response mocking.
                    context.route_web_socket('**/*',lambda route:route.connect_to_server() if allowed(route.url,True) else route.close())
                    page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
                    page.on('request',lambda request:requests.append(urlsplit(request.url).path))
                    def received(result):
                        if urlsplit(result.url).path=='/api/health-check':response_statuses.append(result.status)
                    page.on('response',received)
                    page.goto(site+'/health-check',wait_until='domcontentloaded')
                    page.wait_for_function("() => {const t=document.querySelector('textarea');return t&&Object.keys(t).some(k=>k.startsWith('__reactFiber$'));}")
                    page.get_by_label('Source language').select_option('python');page.locator('textarea').fill(SOURCE)
                    submit=page.locator('button[type=submit]');expect(submit).to_be_enabled()
                    with page.expect_response(lambda result:urlsplit(result.url).path=='/api/health-check') as first_response:submit.click()
                    first=first_response.value.json();observed.append((first_response.value.status,first))
                    assert first_response.value.status==200
                    assert first['details']['static_checks']=='basic' and first['score']==100 and first['verdict']=='Excellent'
                    gauge=page.get_by_role('img',name='Score 100/100',exact=True);expect(gauge).to_be_visible()
                    cta=page.get_by_text(first['cta'],exact=True);expect(cta).to_be_visible()
                    assert cta.locator('..').locator('a').get_attribute('href')=='/configure'
                    page.screenshot(path=str(output/'success.png'),full_page=True)
                    with page.expect_response(lambda result:urlsplit(result.url).path=='/api/health-check') as second_response:
                        submit.click()
                        expect(gauge).to_have_count(0);expect(cta).to_have_count(0)
                        for _ in range(80):
                            if command('inspect')['second_started']:break
                            page.wait_for_timeout(25)
                        else:raise AssertionError('Second scanner request did not start')
                        assert command('release')=={'released':True}
                    second=second_response.value.json()
                    observed.append((second_response.value.status,second))
                    proof['http_observations']=observed
                    alert=page.get_by_role('alert');expect(alert).to_have_text('HTTP 503',timeout=15000)
                    assert response_statuses==[200,503], 'Expected exactly two Health HTTP responses, 200 then 503'
                    assert len(observed)==2 and observed[0][0]==200 and observed[1]==(503,{'detail':{'code':'HEALTH_CHECK_UNAVAILABLE'}}), 'Health response body/status mismatch'
                    expect(gauge).to_have_count(0);expect(cta).to_have_count(0);expect(page.get_by_text('Excellent',exact=True)).to_have_count(0)
                    assert command('inspect')=={'scanner_calls':2,'second_started':True}
                    assert not any('/eligibility/' in path for path in requests) and not errors
                    page.screenshot(path=str(output/'unavailable.png'),full_page=True)
                    assert command('stop')=={'stopped':True};backend.wait(timeout=15);assert backend.returncode==0
                    proof.update(pass_=True,statuses=[status for status,_ in observed],first_score=100,first_profile='python-basic',
                        error=observed[1][1],old_result_removed_before_failure=True,no_old_score_verdict_cta_after_error=True,
                        scanner_calls=2,backend_exit=backend.returncode,browser_errors=errors,blocked_requests=len(blocked),
                        browser_direct_backend_allowed=False,source_sha256=hashlib.sha256(SOURCE.encode()).hexdigest())
    except Exception as error:
        proof.update(failure_type=type(error).__name__,failure=str(error)[:400]);raise
    finally:
        stop_owned(vite);stop_owned(backend)
        proof.update(http_observations=observed,http_response_statuses=response_statuses,
            owned_process_exit_codes={'frontend':vite.poll() if vite is not None else None,
                'backend':backend.poll() if backend is not None else None})
        after={str(path):digest(path) for path in paths};proof['input_pins_stable']=before==after
        proof['input_pins']={str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else 'backend/'+str(path.relative_to(args.backend)):before[str(path)] for path in paths}
        if before!=after:proof.update(pass_=False,pin_failure=True)
        (output/'proof.json').write_text(json.dumps(proof,indent=2),encoding='utf8');print(str(output),flush=True)
    if not proof['pass_']:raise RuntimeError('Health browser fixture not qualified')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend-fixture',action='store_true');parser.add_argument('--site')
    parser.add_argument('--backend',type=Path,required=True);parser.add_argument('--python',type=Path);parser.add_argument('--output',type=Path)
    parser.add_argument('--chrome',default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    args=parser.parse_args()
    backend_fixture(args) if args.backend_fixture else run(args)

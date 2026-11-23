"""Bounded harness unit checks: no server, Docker, provider or browser launched."""
from contextlib import ExitStack
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec=importlib.util.spec_from_file_location("integrated_browser",Path(__file__).with_name("private-audit-integrated-browser.py"))
driver=importlib.util.module_from_spec(spec);spec.loader.exec_module(driver)


class HarnessChecks(unittest.TestCase):
    def test_only_exact_site_and_fake_auth_http_origins(self):
        site,auth="http://127.0.0.1:41000","http://127.0.0.1:41001"
        for url in [site+"/configure",auth+"/auth/v1/user"]:
            self.assertTrue(driver.allowed_browser_origin(url,site,auth))
        for url in ["http://127.0.0.1:41002/private-backend","http://127.0.0.1:410000/x",
            "http://localhost:41000/x","https://127.0.0.1:41000/x","http://user@127.0.0.1:41000/x",
            "http://127.0.0.1:41000.evil.test/x","https://checkout.stripe.com/c/pay/fixture",
            "blob:"+site+"/fixture","data:text/html,fixture"]:
            with self.subTest(url=url):self.assertFalse(driver.allowed_browser_origin(url,site,auth))

    def test_websocket_only_on_site_not_auth_or_backend(self):
        self.assertTrue(driver.allowed_browser_origin("ws://127.0.0.1:41000/vite","http://127.0.0.1:41000","http://127.0.0.1:41001",True))
        for port in [41001,41002]:
            self.assertFalse(driver.allowed_browser_origin(f"ws://127.0.0.1:{port}/x","http://127.0.0.1:41000","http://127.0.0.1:41001",True))

    def test_fixture_pin_checked_before_execution(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root);marker=root/"executed";source=root/"fixture.py"
            source.write_text("from pathlib import Path\nPath("+repr(str(marker))+").touch()\nUSER={'id':'old'}\n",encoding="utf8")
            with self.assertRaises(ValueError):driver.load_fixture(source,"0"*64)
            self.assertFalse(marker.exists())
            value=driver.load_fixture(source,driver.digest(source))
            self.assertTrue(marker.exists());self.assertEqual(value.USER["id"],"fixture-http-user")

    def test_fixture_changed_during_import_is_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            source=Path(root)/"fixture.py"
            source.write_text("from pathlib import Path\nPath(__file__).write_text('# changed')\nUSER={}\n",encoding="utf8")
            with self.assertRaisesRegex(ValueError,"during import"):driver.load_fixture(source,driver.digest(source))

    def test_checkout_export_has_hashes_not_raw_key_or_body(self):
        key="fixture-idempotency-key";body='{"scope":"fixture"}'
        response=json.dumps(dict(quote_sha256="a"*64,checkout_session_id="cs_fixture")).encode()
        observed=driver.checkout_observation("attempt",key,body,response)
        self.assertEqual(set(observed),{"attempt","key_sha256","request_sha256","quote_sha256","session","response_sha256"})
        self.assertEqual(observed["key_sha256"],hashlib.sha256(key.encode()).hexdigest())
        self.assertEqual(observed["request_sha256"],hashlib.sha256(body.encode()).hexdigest())
        self.assertEqual(observed["response_sha256"],hashlib.sha256(response).hexdigest())
        self.assertNotIn(key,json.dumps(observed));self.assertNotIn(body,json.dumps(observed))

    def test_checkout_key_must_be_present_and_bounded(self):
        for key in [None,"short","a"*256,"bad key with spaces"]:
            with self.assertRaises(ValueError):driver.checkout_observation("attempt",key,"{}",b"{}")

    def test_exitstack_cleanup_order_on_assertion(self):
        # Same LIFO ownership pattern used immediately after launch/new_context.
        closed=[]
        with self.assertRaises(AssertionError):
            with ExitStack() as cleanup:
                cleanup.callback(lambda:closed.append("browser"));cleanup.callback(lambda:closed.append("context"))
                raise AssertionError("fixture")
        self.assertEqual(closed,["context","browser"])


    def attachment(self):
        headers={"content-type":"application/octet-stream",
            "content-disposition":'attachment; filename="stratverity-audit.html"',
            "cache-control":"no-store","x-content-type-options":"nosniff",
            "referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow",
            "content-security-policy":"default-src 'none'; sandbox; base-uri 'none'; frame-ancestors 'none'"}
        pending={"status":404,"error":"PRIVATE_AUDIT_REQUEST_REFUSED","cache_control":"no-store"}
        return [200,"stratverity-audit.html",headers,b"<html>fixture</html>",pending]

    def test_download_proof_has_hash_and_size_not_html_or_authority(self):
        values=self.attachment();result=driver.download_observation(*values)
        self.assertEqual(set(result),{"bytes","sha256","filename","headers","pending_refusal"})
        self.assertEqual(result["bytes"],len(values[3]))
        self.assertEqual(result["sha256"],hashlib.sha256(values[3]).hexdigest())
        self.assertNotIn("<html>",json.dumps(result))
        self.assertEqual(result["pending_refusal"]["status"],404)

    def test_download_proof_refuses_each_missing_or_changed_defense(self):
        for header in self.attachment()[2]:
            with self.subTest(header=header):
                values=self.attachment();values[2][header]="unsafe"
                with self.assertRaises(ValueError):driver.download_observation(*values)
        for index,value in [(0,404),(1,"private-owner.html"),(3,b""),(3,"html"),(3,b"x"*8388609),
                            (4,{"status":404,"error":"PRIVATE_AUDIT_REQUEST_REFUSED","cache_control":"public"})]:
            with self.subTest(field=index):
                values=self.attachment();values[index]=value
                with self.assertRaises(ValueError):driver.download_observation(*values)

    def test_attachment_byte_limits_are_inclusive(self):
        for size in [1,8388608]:
            with self.subTest(size=size):
                values=self.attachment();values[3]=b"x"*size
                self.assertEqual(driver.download_observation(*values)["bytes"],size)


    def test_observations_survive_failure_without_html_or_credential_headers(self):
        values=self.attachment();values[2]['content-security-policy']='changed-native-header'
        values[2]['set-cookie']='NEVER-EXPORT';values[2]['authorization']='NEVER-EXPORT'
        observed=driver.attachment_observed(*values)
        self.assertEqual(observed['headers']['content-security-policy'],'changed-native-header')
        self.assertEqual(observed['sha256'],hashlib.sha256(values[3]).hexdigest())
        self.assertEqual(observed['bytes'],len(values[3]))
        self.assertNotIn('NEVER-EXPORT',json.dumps(observed));self.assertNotIn('<html>',json.dumps(observed))
        with self.assertRaisesRegex(ValueError,'headers.content-security-policy'):
            driver.download_observation(*values)

    def test_mime_case_or_parameters_are_observed_but_not_silently_normalized(self):
        for mime in ['Application/Octet-Stream','application/octet-stream; charset=utf-8']:
            with self.subTest(mime=mime):
                values=self.attachment();values[2]['content-type']=mime
                self.assertEqual(driver.attachment_observed(*values)['headers']['content-type'],mime)
                with self.assertRaisesRegex(ValueError,'headers.content-type'):driver.download_observation(*values)

    def test_diagnostic_headers_are_bounded_and_marked_without_weakening_validation(self):
        values=self.attachment();values[2]['content-security-policy']='x'*5000
        observed=driver.attachment_observed(*values)
        self.assertEqual(len(observed['headers']['content-security-policy']),4096)
        self.assertEqual(observed['headers_truncated'],['content-security-policy'])
        with self.assertRaises(ValueError):driver.download_observation(*values)


if __name__=="__main__":unittest.main()

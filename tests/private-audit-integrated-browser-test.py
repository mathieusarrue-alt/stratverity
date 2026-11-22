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
            "http://127.0.0.1:41000.evil.test/x","https://checkout.stripe.com/c/pay/fixture"]:
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


if __name__=="__main__":unittest.main()

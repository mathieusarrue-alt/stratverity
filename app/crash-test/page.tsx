"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import styles from "./crash-test.module.css";
import { useCT } from "./i18n";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://api.stratverity.com";

const ASSET_PRESETS = [
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
  "OANDA:EURUSD",
  "OANDA:XAUUSD",
  "SP:SPX",
  "NASDAQ:NDX",
] as const;

const TIMEFRAME_PRESETS = ["5m", "15m", "1h", "4h", "1D"] as const;

const CRASH_TEST_PRICE = 49;

type Language = "pinescript" | "python";
type SubmissionState = "idle" | "submitting" | "checkout" | "error";

type CheckoutResponse = {
  audit_hash: string;
  checkout_session_id: string;
  checkout_url: string;
  status: string;
};

function isStripeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

export default function CrashTestPage() {
  const t = useCT();
  const [language, setLanguage] = useState<Language>("pinescript");
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");
  const [timeframe, setTimeframe] = useState("15m");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "warning">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReady = code.trim().length >= 10;

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setCode(text);
    if (file.name.endsWith(".py")) setLanguage("python");
    else if (file.name.endsWith(".pine") || file.name.endsWith(".ps"))
      setLanguage("pinescript");
    setMessage("");
    setMessageType("");
  };

  const clearFile = () => {
    setFileName("");
    setCode("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady) {
      setMessage(t("ct.minChars"));
      setMessageType("warning");
      return;
    }

    setState("submitting");
    setMessage(t("ct.preparingPayment"));
    setMessageType("");

    try {
      const response = await fetch(`${API_URL}/v1/audit/crash-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          symbol,
          timeframe,
        }),
      });

      const result = (await response.json()) as CheckoutResponse & {
        detail?: { code?: string; message?: string };
      };

      if (!response.ok) {
        const detail =
          typeof result.detail === "object" ? result.detail : undefined;
        setState("error");
        setMessage(detail?.message ?? t("ct.serviceUnavailable"));
        setMessageType("warning");
        return;
      }

      if (!isStripeCheckoutUrl(result.checkout_url)) {
        setState("error");
        setMessage(t("ct.invalidStripe"));
        setMessageType("warning");
        return;
      }

      sessionStorage.setItem(
        `stratverity.crash-test:${result.checkout_session_id}`,
        result.audit_hash,
      );

      setState("checkout");
      window.location.assign(result.checkout_url);
    } catch {
      setState("error");
      setMessage(t("ct.connectionError"));
      setMessageType("warning");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>{t("ct.eyebrow")}</span>
        <h1>
          {t("ct.title1")}
          <em>{t("ct.title2")}</em>
        </h1>
        <p>{t("ct.lead")}</p>
        <div className={styles.pricePill}>
          <b>{CRASH_TEST_PRICE}€</b>
          <small>{t("ct.price")}</small>
        </div>
      </section>

      <div className={styles.workspace}>
        <form className={styles.form} onSubmit={submitCheckout}>
          <fieldset className={styles.block}>
            <legend>
              <span>01</span>{t("ct.step.code")}
            </legend>
            <div className={styles.codeInput}>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={language === "pinescript" ? styles.tabActive : ""}
                  onClick={() => setLanguage("pinescript")}
                >
                  Pine Script
                </button>
                <button
                  type="button"
                  className={language === "python" ? styles.tabActive : ""}
                  onClick={() => setLanguage("python")}
                >
                  Python
                </button>
              </div>

              {fileName ? (
                <div className={styles.fileInfo}>
                  <span>
                    📄 <strong>{fileName}</strong>{" "}
                    <code>({code.length.toLocaleString()} {t("ct.car")})</code>
                  </span>
                  <button type="button" onClick={clearFile} title="×">
                    ×
                  </button>
                </div>
              ) : (
                <label className={styles.filePicker}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pine,.ps,.py,.txt"
                    onChange={handleFile}
                  />
                  <strong>{t("ct.chooseFile")}</strong>
                  <small>{t("ct.fileHelp")}</small>
                </label>
              )}

              <textarea
                className={styles.textarea}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={
                  language === "pinescript"
                    ? t("ct.placeholderPine")
                    : t("ct.placeholderPython")
                }
                spellCheck={false}
              />
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend>
              <span>02</span>{t("ct.step.asset")}
            </legend>
            <div className={styles.chips}>
              {ASSET_PRESETS.map((asset) => (
                <button
                  type="button"
                  key={asset}
                  className={`${styles.chip} ${symbol === asset ? styles.chipActive : ""}`}
                  onClick={() => setSymbol(asset)}
                >
                  {asset.replace(/^.*:/, "")}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend>
              <span>03</span>{t("ct.step.timeframe")}
            </legend>
            <div className={styles.chips}>
              {TIMEFRAME_PRESETS.map((tf) => (
                <button
                  type="button"
                  key={tf}
                  className={`${styles.chip} ${timeframe === tf ? styles.chipActive : ""}`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </fieldset>

          {isReady && (
            <div className={styles.readyBadge}>
              <span className={styles.dot} />
              {t("ct.ready")}
            </div>
          )}
        </form>

        <aside className={styles.summary}>
          <h2>{t("ct.summary")}</h2>
          <dl>
            <div>
              <dt>{t("ct.lang")}</dt>
              <dd>{language === "pinescript" ? "Pine Script" : "Python"}</dd>
            </div>
            <div>
              <dt>{t("ct.asset")}</dt>
              <dd>{symbol.replace(/^.*:/, "")}</dd>
            </div>
            <div>
              <dt>{t("ct.timeframe")}</dt>
              <dd>{timeframe}</dd>
            </div>
            <div>
              <dt>{t("ct.codeSize")}</dt>
              <dd>{code.length.toLocaleString()} {t("ct.car")}</dd>
            </div>
          </dl>

          <div className={styles.price}>
            <span>{t("ct.total")}</span>
            <strong>{CRASH_TEST_PRICE}€</strong>
          </div>
          <small>{t("ct.vat")}</small>

          <button
            className={styles.submit}
            type="submit"
            disabled={!isReady || state === "submitting" || state === "checkout"}
          >
            {state === "submitting"
              ? t("ct.preparing")
              : state === "checkout"
                ? t("ct.redirecting")
                : t("ct.pay")}
          </button>

          {message && (
            <p
              className={`${styles.message} ${messageType === "warning" ? styles.warning : ""}`}
            >
              {message}
            </p>
          )}

          <p className={styles.message}>
            {t("ct.secure")}{" "}
            <Link href="/legal/terms">{t("ct.conditions")}</Link> ·{" "}
            <Link href="/legal/privacy">{t("ct.privacy")}</Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
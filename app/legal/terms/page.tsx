"use client";

import { LegalPage, styles } from "../LegalPage";
import { useI18n } from "../../i18n/I18nProvider";

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <LegalPage
      titleKey="legal.terms.title"
      leadKey="legal.terms.lead"
    >
      <p className={styles.warning}>{t("legal.terms.warning")}</p>
      <section>
        <h2>{t("legal.terms.s1h")}</h2>
        <p>{t("legal.terms.s1p")}</p>
        <p>{t("legal.terms.vat")}</p>
      </section>
      <section>
        <h2>{t("legal.terms.s2h")}</h2>
        <p>{t("legal.terms.s2p")}</p>
      </section>
      <section>
        <h2>{t("legal.terms.s3h")}</h2>
        <p>{t("legal.terms.s3p")}</p>
      </section>
      <section>
        <h2>{t("legal.terms.s4h")}</h2>
        <p>{t("legal.terms.s4p")}</p>
      </section>
      <section>
        <h2>{t("legal.terms.s5h")}</h2>
        <p>{t("legal.terms.s5p")}</p>
      </section>
    </LegalPage>
  );
}

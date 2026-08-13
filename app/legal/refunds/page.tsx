"use client";

import { LegalPage, styles } from "../LegalPage";
import { useI18n } from "../../i18n/I18nProvider";

export default function RefundsPage() {
  const { t } = useI18n();
  return (
    <LegalPage
      titleKey="legal.refunds.title"
      leadKey="legal.refunds.lead"
    >
      <p className={styles.warning}>{t("legal.refunds.warning")}</p>
      <section>
        <h2>{t("legal.refunds.s1h")}</h2><p>{t("legal.refunds.s1p")}</p>
      </section>
      <section>
        <h2>{t("legal.refunds.s2h")}</h2><p>{t("legal.refunds.s2p")}</p>
      </section>
    </LegalPage>
  );
}

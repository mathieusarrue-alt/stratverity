"use client";

import { LegalPage } from "../LegalPage";
import { useI18n } from "../../i18n/I18nProvider";

export default function RiskPage() {
  const { t } = useI18n();
  return (
    <LegalPage
      titleKey="legal.risk.title"
      leadKey="legal.risk.lead"
    >
      <section>
        <h2>{t("legal.risk.s1h")}</h2><p>{t("legal.risk.s1p")}</p>
      </section>
      <section>
        <h2>{t("legal.risk.s2h")}</h2><p>{t("legal.risk.s2p")}</p>
      </section>
      <section>
        <h2>{t("legal.risk.s3h")}</h2><p>{t("legal.risk.s3p")}</p>
      </section>
    </LegalPage>
  );
}

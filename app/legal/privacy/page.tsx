"use client";

import { LegalPage } from "../LegalPage";
import { useI18n } from "../../i18n/I18nProvider";

export default function PrivacyPage() {
  const { t } = useI18n();
  return (
    <LegalPage
      titleKey="legal.privacy.title"
      leadKey="legal.privacy.lead"
    >
      <section>
        <h2>{t("legal.privacy.s1h")}</h2><p>{t("legal.privacy.s1p")}</p>
      </section>
      <section>
        <h2>{t("legal.privacy.s2h")}</h2><p>{t("legal.privacy.s2p")}</p>
      </section>
      <section>
        <h2>{t("legal.privacy.s3h")}</h2><p>{t("legal.privacy.s3p")}</p>
      </section>
    </LegalPage>
  );
}

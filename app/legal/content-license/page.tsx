"use client";

import { LegalPage } from "../LegalPage";
import { useI18n } from "../../i18n/I18nProvider";

export default function ContentLicensePage() {
  const { t } = useI18n();
  return (
    <LegalPage
      titleKey="legal.license.title"
      leadKey="legal.license.lead"
    >
      <section>
        <h2>{t("legal.license.s1h")}</h2><p>{t("legal.license.s1p")}</p>
      </section>
      <section>
        <h2>{t("legal.license.s2h")}</h2><p>{t("legal.license.s2p")}</p>
      </section>
      <section>
        <h2>{t("legal.license.s3h")}</h2><p>{t("legal.license.s3p")}</p>
      </section>
    </LegalPage>
  );
}

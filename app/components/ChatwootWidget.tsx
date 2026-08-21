"use client";

import { useEffect } from "react";

/**
 * Widget de chat Chatwoot — chargé de façon asynchrone et conditionnelle.
 *
 * Actif UNIQUEMENT si `NEXT_PUBLIC_CHATWOOT_TOKEN` est défini (côté build).
 * Aucun script n'est injecté tant qu'aucun serveur Chatwoot n'est configuré,
 * donc le chargement du site n'est jamais ralenti en production.
 *
 * Configuration (variables d'environnement / Amplify) :
 *   NEXT_PUBLIC_CHATWOOT_TOKEN   — token de l'Inbox "Website" Chatwoot
 *   NEXT_PUBLIC_CHATWOOT_URL     — origine du serveur Chatwoot (ex. https://chat.stratverity.com)
 */
const CHATWOOT_TOKEN = process.env.NEXT_PUBLIC_CHATWOOT_TOKEN?.trim();
const CHATWOOT_URL = (
  process.env.NEXT_PUBLIC_CHATWOOT_URL || "https://chat.stratverity.com"
).replace(/\/+$/, "");

export default function ChatwootWidget() {
  useEffect(() => {
    if (!CHATWOOT_TOKEN) return;
    if (document.getElementById("chatwoot-sdk")) return;

    const script = document.createElement("script");
    script.id = "chatwoot-sdk";
    script.src = `${CHATWOOT_URL}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    script.onload = () => {
      const sdk = (window as unknown as { chatwootSDK?: { run: (cfg: unknown) => void } }).chatwootSDK;
      if (sdk) {
        sdk.run({
          websiteToken: CHATWOOT_TOKEN,
          baseUrl: CHATWOOT_URL,
        });
      }
    };
    script.onerror = () => {
      // Échec silencieux : le widget ne doit jamais casser le site.
      document.getElementById("chatwoot-sdk")?.remove();
    };
    document.body.appendChild(script);

    return () => {
      // Le script est volontairement conservé (singleton) ; on n'empile pas de doublons.
    };
  }, []);

  return null;
}
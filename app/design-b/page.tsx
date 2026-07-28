"use client";

import {
  ChangeEvent,
  FormEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Theme = "light" | "dark";
type Locale = "fr" | "en" | "es" | "de";
type ProductMode = "audit" | "improve" | "monitor";

const languages: { code: Locale; label: string; short: string }[] = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" },
  { code: "de", label: "Deutsch", short: "DE" },
];

const copy = {
  fr: {
    nav: {
      product: "Produit",
      research: "Recherche",
      pricing: "Offres",
      resources: "Ressources",
      faq: "FAQ",
      search: "Rechercher",
      login: "Connectez-vous",
    },
    hero: {
      status: "Moteur de vérification · Aperçu privé",
      line1: "Transformez un backtest",
      line2: "en preuve exploitable.",
      body:
        "Auditez votre stratégie, mesurez sa robustesse et testez des pistes d’amélioration sans confondre optimisation et performance future.",
      primary: "Auditer ma stratégie",
      secondary: "Explorer la méthode",
      trust: ["Sans compte", "Pine & Python", "Preuves traçables"],
    },
    modes: {
      audit: "Audit",
      improve: "Amélioration",
      monitor: "Monitoring",
    },
    console: {
      title: "Scénario d’optimisation contrôlée",
      subtitle: "Exemple interactif · Données simulées",
      before: "Avant",
      after: "Après tests",
      labels: {
        audit: ["Contrôles", "Risques détectés", "Preuves reliées"],
        improve: ["Performance nette", "Winrate", "Drawdown max."],
        monitor: ["Dérive observée", "Alertes actives", "Surveillance"],
      },
      values: {
        audit: ["27", "3", "100%"],
        improve: ["+34,6%", "+9,4 pts", "−21,8%"],
        monitor: ["2,7%", "4", "24/7"],
      },
      note:
        "Illustration uniquement : variation issue d’un scénario simulé, sans résultat client ni garantie de rendement.",
    },
    audit: {
      kicker: "PREMIER DIAGNOSTIC",
      title: "Déposez. Nous vérifions.",
      body: "Aucun fichier n’est transmis dans ce prototype privé.",
      choose: "Choisir un fichier Pine ou Python",
      selected: "Fichier sélectionné localement",
      limit: "2 Mo maximum · Aucun code exécuté",
      button: "Préparer mon diagnostic",
    },
    method: {
      kicker: "LE STANDARD STRATVERITY",
      title: "Chaque conclusion doit pouvoir remonter à sa preuve.",
      body:
        "Nous séparons le storytelling, les chiffres déclarés, les recalculs possibles et les tests réellement exécutés.",
      items: [
        ["01", "Inspecter", "Code, paramètres, dates et hypothèses de marché."],
        ["02", "Recalculer", "PF, Avg R net, frais, drawdown et stabilité."],
        ["03", "Mettre à l’épreuve", "Actifs, périodes, unités de temps et frictions."],
      ],
    },
    improvement: {
      kicker: "STRATVERITY LAB",
      title: "Voir ce qui s’améliore. Et ce qui se dégrade.",
      body:
        "Chaque variante est comparée à la base sur plusieurs dimensions. Un gain de winrate ne compte pas s’il détruit le Profit Factor ou augmente le drawdown.",
      before: "Stratégie fournie",
      after: "Variante testée",
      metrics: [
        ["Performance nette", "+34,6%", "illustratif"],
        ["Winrate", "+9,4 pts", "secondaire"],
        ["Profit Factor", "1,18 → 1,46", "après frais"],
        ["Drawdown max.", "−21,8%", "réduction"],
      ],
      disclaimer:
        "Données de démonstration. Les améliorations réelles dépendent du code, des marchés, de la période, des frais et du risque de sur-optimisation.",
    },
    research: {
      kicker: "RECHERCHE",
      title: "La méthode avant le marketing.",
      body:
        "Des notes courtes pour comprendre comment nous testons la robustesse et pourquoi certains beaux backtests ne survivent pas au réel.",
      cards: [
        ["Robustesse", "Pourquoi un test multi-actifs révèle la dépendance à un marché.", "7 min"],
        ["Sur-optimisation", "Reconnaître une amélioration réelle face à un paramétrage opportuniste.", "9 min"],
        ["Coûts d’exécution", "Mesurer l’impact des frais, du slippage et de la liquidité.", "6 min"],
      ],
      read: "Lire la note",
    },
    suite: {
      kicker: "PLATEFORME STRATVERITY",
      title: "Un parcours complet, de la preuve au suivi.",
      body: "Les modules futurs restent identifiés comme tels jusqu’à leur disponibilité réelle.",
      items: [
        ["BacktestProof", "Audit", "Disponible en premier"],
        ["StratVerity Lab", "Amélioration", "Prochain module"],
        ["StratVerity Radar", "Monitoring", "En développement"],
        ["StratVerity Market", "Stratégies vérifiées", "Vision future"],
      ],
    },
    pricing: {
      kicker: "OFFRES",
      title: "Commencez par la preuve dont vous avez besoin.",
      body: "Les prix définitifs seront publiés après mesure des coûts réels et étude concurrentielle.",
      plans: [
        ["Diagnostic", "Gratuit", "Une première lecture limitée par email", "Commencer"],
        ["Audit complet", "À l’analyse", "Rapport détaillé, recalculs et risques", "Rejoindre l’accès privé"],
        ["Radar", "Abonnement futur", "Suivi continu et détection de dérive", "Être informé"],
      ],
      popular: "Produit initial",
    },
    faq: {
      kicker: "FAQ",
      title: "Des réponses avant le dépôt.",
      items: [
        ["Exécutez-vous automatiquement mon code ?", "Non. Le diagnostic initial inspecte les fichiers sans exécuter un code client inconnu."],
        ["Les chiffres d’amélioration sont-ils garantis ?", "Jamais. Les chiffres visibles sur cette page sont des exemples simulés destinés à expliquer le produit."],
        ["Un winrate plus élevé signifie-t-il une meilleure stratégie ?", "Non. Nous regardons d’abord le Profit Factor, l’Avg R net, les frais, le drawdown et la stabilité."],
        ["Quelles sources acceptez-vous ?", "Le premier parcours accepte Pine Script, Python et des exports de résultats compatibles. Les dossiers complets viendront ensuite."],
        ["Puis-je utiliser le service sans compte ?", "Le diagnostic limité est pensé sans compte. Une adresse email vérifiée sert à livrer le rapport."],
      ],
    },
    search: {
      title: "Rechercher dans StratVerity",
      placeholder: "Audit, drawdown, Pine, robustesse…",
      empty: "Aucun résultat. Essayez un autre terme.",
      close: "Fermer",
    },
    login: {
      title: "Accès StratVerity",
      body: "La connexion sera activée avec les premiers comptes privés.",
      email: "Adresse email",
      password: "Mot de passe",
      submit: "Demander l’accès",
      note: "Prototype : aucune authentification n’est encore connectée.",
      success: "Demande simulée — le système de compte sera connecté dans un prochain bloc.",
      close: "Fermer",
    },
    footer: {
      line: "Vérifier. Améliorer. Surveiller.",
      risk: "Aucun rendement futur garanti. Les exemples présentés sont illustratifs.",
    },
  },
  en: {
    nav: { product: "Product", research: "Research", pricing: "Plans", resources: "Resources", faq: "FAQ", search: "Search", login: "Sign in" },
    hero: { status: "Verification engine · Private preview", line1: "Turn a backtest", line2: "into usable evidence.", body: "Audit your strategy, measure robustness and test improvement paths without confusing optimization with future performance.", primary: "Audit my strategy", secondary: "Explore the method", trust: ["No account", "Pine & Python", "Traceable evidence"] },
    modes: { audit: "Audit", improve: "Improve", monitor: "Monitor" },
    console: { title: "Controlled optimization scenario", subtitle: "Interactive example · Simulated data", before: "Before", after: "After tests", labels: { audit: ["Checks", "Risks detected", "Linked evidence"], improve: ["Net performance", "Win rate", "Max drawdown"], monitor: ["Observed drift", "Active alerts", "Monitoring"] }, values: { audit: ["27", "3", "100%"], improve: ["+34.6%", "+9.4 pts", "−21.8%"], monitor: ["2.7%", "4", "24/7"] }, note: "Illustration only: simulated scenario variation, not a client result or return guarantee." },
    audit: { kicker: "FIRST DIAGNOSTIC", title: "Upload. We verify.", body: "No file leaves your browser in this private prototype.", choose: "Choose a Pine or Python file", selected: "File selected locally", limit: "2 MB maximum · No code executed", button: "Prepare my diagnostic" },
    method: { kicker: "THE STRATVERITY STANDARD", title: "Every conclusion should lead back to evidence.", body: "We separate storytelling, declared figures, possible recalculations and tests actually performed.", items: [["01", "Inspect", "Code, parameters, dates and market assumptions."], ["02", "Recalculate", "PF, net Avg R, fees, drawdown and stability."], ["03", "Challenge", "Assets, periods, timeframes and frictions."]] },
    improvement: { kicker: "STRATVERITY LAB", title: "See what improves. And what breaks.", body: "Every variant is compared with its baseline across several dimensions. A win-rate gain means little if Profit Factor falls or drawdown rises.", before: "Submitted strategy", after: "Tested variant", metrics: [["Net performance", "+34.6%", "illustrative"], ["Win rate", "+9.4 pts", "secondary"], ["Profit Factor", "1.18 → 1.46", "after fees"], ["Max drawdown", "−21.8%", "reduction"]], disclaimer: "Demo data. Actual changes depend on code, markets, period, fees and overfitting risk." },
    research: { kicker: "RESEARCH", title: "Method before marketing.", body: "Short notes on robustness testing and why some beautiful backtests fail in live conditions.", cards: [["Robustness", "Why cross-asset testing reveals dependence on one market.", "7 min"], ["Overfitting", "Separate genuine improvement from opportunistic parameter tuning.", "9 min"], ["Execution costs", "Measure fees, slippage and liquidity impact.", "6 min"]], read: "Read note" },
    suite: { kicker: "STRATVERITY PLATFORM", title: "From first proof to continuous monitoring.", body: "Future modules remain clearly identified until they are truly available.", items: [["BacktestProof", "Audit", "Available first"], ["StratVerity Lab", "Improvement", "Next module"], ["StratVerity Radar", "Monitoring", "In development"], ["StratVerity Market", "Verified strategies", "Future vision"]] },
    pricing: { kicker: "PLANS", title: "Start with the level of proof you need.", body: "Final prices will be published after measuring real costs and completing the competitive review.", plans: [["Diagnostic", "Free", "A limited first read delivered by email", "Get started"], ["Full audit", "Per analysis", "Detailed report, recalculations and risks", "Join private access"], ["Radar", "Future subscription", "Continuous tracking and drift detection", "Get updates"]], popular: "Initial product" },
    faq: { kicker: "FAQ", title: "Answers before upload.", items: [["Do you automatically run my code?", "No. The initial diagnostic inspects files without executing unknown client code."], ["Are improvement figures guaranteed?", "Never. Figures on this page are simulated examples explaining the product."], ["Does a higher win rate mean a better strategy?", "No. Profit Factor, net Avg R, fees, drawdown and stability come first."], ["Which sources are accepted?", "The initial flow supports Pine Script, Python and compatible result exports."], ["Can I use it without an account?", "The limited diagnostic is designed without an account. A verified email delivers the report."]] },
    search: { title: "Search StratVerity", placeholder: "Audit, drawdown, Pine, robustness…", empty: "No result. Try another term.", close: "Close" },
    login: { title: "StratVerity access", body: "Sign-in will open with the first private accounts.", email: "Email address", password: "Password", submit: "Request access", note: "Prototype: authentication is not connected yet.", success: "Simulated request — accounts will be connected in a later block.", close: "Close" },
    footer: { line: "Verify. Improve. Monitor.", risk: "No future return is guaranteed. Examples shown are illustrative." },
  },
  es: {
    nav: { product: "Producto", research: "Investigación", pricing: "Planes", resources: "Recursos", faq: "FAQ", search: "Buscar", login: "Iniciar sesión" },
    hero: { status: "Motor de verificación · Vista privada", line1: "Convierte un backtest", line2: "en evidencia útil.", body: "Audita tu estrategia, mide su robustez y prueba mejoras sin confundir optimización con rendimiento futuro.", primary: "Auditar mi estrategia", secondary: "Explorar el método", trust: ["Sin cuenta", "Pine y Python", "Evidencia trazable"] },
    modes: { audit: "Auditoría", improve: "Mejora", monitor: "Monitorización" },
    console: { title: "Escenario de optimización controlada", subtitle: "Ejemplo interactivo · Datos simulados", before: "Antes", after: "Después", labels: { audit: ["Controles", "Riesgos detectados", "Evidencias"], improve: ["Rendimiento neto", "Winrate", "Drawdown máx."], monitor: ["Desviación", "Alertas activas", "Vigilancia"] }, values: { audit: ["27", "3", "100%"], improve: ["+34,6%", "+9,4 pts", "−21,8%"], monitor: ["2,7%", "4", "24/7"] }, note: "Solo ilustración: escenario simulado, no resultado de cliente ni garantía de rentabilidad." },
    audit: { kicker: "PRIMER DIAGNÓSTICO", title: "Sube. Verificamos.", body: "Ningún archivo sale del navegador en este prototipo privado.", choose: "Elegir archivo Pine o Python", selected: "Archivo seleccionado localmente", limit: "Máximo 2 MB · Sin ejecutar código", button: "Preparar diagnóstico" },
    method: { kicker: "EL ESTÁNDAR STRATVERITY", title: "Cada conclusión debe volver a su evidencia.", body: "Separamos narrativa, cifras declaradas, recálculos posibles y pruebas realmente realizadas.", items: [["01", "Inspeccionar", "Código, parámetros, fechas e hipótesis."], ["02", "Recalcular", "PF, Avg R neto, costes, drawdown y estabilidad."], ["03", "Poner a prueba", "Activos, periodos, temporalidades y fricciones."]] },
    improvement: { kicker: "STRATVERITY LAB", title: "Ve lo que mejora. Y lo que empeora.", body: "Cada variante se compara con la base. Subir el winrate no sirve si cae el Profit Factor o aumenta el drawdown.", before: "Estrategia enviada", after: "Variante probada", metrics: [["Rendimiento neto", "+34,6%", "ilustrativo"], ["Winrate", "+9,4 pts", "secundario"], ["Profit Factor", "1,18 → 1,46", "tras costes"], ["Drawdown máx.", "−21,8%", "reducción"]], disclaimer: "Datos de demostración. Los cambios reales dependen del código, mercado, periodo, costes y sobreoptimización." },
    research: { kicker: "INVESTIGACIÓN", title: "Método antes que marketing.", body: "Notas breves sobre robustez y por qué algunos backtests atractivos fallan en real.", cards: [["Robustez", "Cómo el test multi-activo revela dependencia de un mercado.", "7 min"], ["Sobreoptimización", "Distinguir una mejora real de un ajuste oportunista.", "9 min"], ["Costes de ejecución", "Medir comisiones, slippage y liquidez.", "6 min"]], read: "Leer nota" },
    suite: { kicker: "PLATAFORMA STRATVERITY", title: "De la primera prueba al seguimiento continuo.", body: "Los módulos futuros siguen claramente marcados hasta estar disponibles.", items: [["BacktestProof", "Auditoría", "Primero disponible"], ["StratVerity Lab", "Mejora", "Próximo módulo"], ["StratVerity Radar", "Monitorización", "En desarrollo"], ["StratVerity Market", "Estrategias verificadas", "Visión futura"]] },
    pricing: { kicker: "PLANES", title: "Empieza con el nivel de prueba que necesitas.", body: "Los precios finales se publicarán tras medir costes y completar el análisis competitivo.", plans: [["Diagnóstico", "Gratis", "Primera lectura limitada por email", "Empezar"], ["Auditoría completa", "Por análisis", "Informe, recálculos y riesgos", "Acceso privado"], ["Radar", "Suscripción futura", "Seguimiento y detección de deriva", "Recibir noticias"]], popular: "Producto inicial" },
    faq: { kicker: "FAQ", title: "Respuestas antes de subir.", items: [["¿Ejecutáis mi código automáticamente?", "No. El diagnóstico inicial inspecciona sin ejecutar código desconocido."], ["¿Se garantizan las mejoras?", "Nunca. Las cifras de esta página son ejemplos simulados."], ["¿Más winrate significa mejor estrategia?", "No. Priorizamos Profit Factor, Avg R neto, costes, drawdown y estabilidad."], ["¿Qué fuentes aceptáis?", "El flujo inicial admite Pine Script, Python y exportaciones compatibles."], ["¿Puedo usarlo sin cuenta?", "El diagnóstico limitado no requiere cuenta. Un email verificado entrega el informe."]] },
    search: { title: "Buscar en StratVerity", placeholder: "Auditoría, drawdown, Pine, robustez…", empty: "Sin resultados. Prueba otro término.", close: "Cerrar" },
    login: { title: "Acceso StratVerity", body: "El acceso se activará con las primeras cuentas privadas.", email: "Email", password: "Contraseña", submit: "Solicitar acceso", note: "Prototipo: la autenticación aún no está conectada.", success: "Solicitud simulada — las cuentas se conectarán más adelante.", close: "Cerrar" },
    footer: { line: "Verificar. Mejorar. Monitorizar.", risk: "No se garantiza ningún rendimiento futuro. Los ejemplos son ilustrativos." },
  },
  de: {
    nav: { product: "Produkt", research: "Research", pricing: "Angebote", resources: "Ressourcen", faq: "FAQ", search: "Suchen", login: "Anmelden" },
    hero: { status: "Prüfungs-Engine · Private Vorschau", line1: "Machen Sie aus Backtests", line2: "belastbare Evidenz.", body: "Prüfen Sie Ihre Strategie, messen Sie Robustheit und testen Sie Verbesserungen, ohne Optimierung mit künftiger Performance zu verwechseln.", primary: "Strategie prüfen", secondary: "Methode ansehen", trust: ["Ohne Konto", "Pine & Python", "Nachvollziehbare Evidenz"] },
    modes: { audit: "Audit", improve: "Verbessern", monitor: "Monitoring" },
    console: { title: "Kontrolliertes Optimierungsszenario", subtitle: "Interaktives Beispiel · Simulierte Daten", before: "Vorher", after: "Nach Tests", labels: { audit: ["Prüfungen", "Erkannte Risiken", "Verknüpfte Evidenz"], improve: ["Netto-Performance", "Trefferquote", "Max. Drawdown"], monitor: ["Beobachtete Drift", "Aktive Alarme", "Überwachung"] }, values: { audit: ["27", "3", "100%"], improve: ["+34,6%", "+9,4 Pkt.", "−21,8%"], monitor: ["2,7%", "4", "24/7"] }, note: "Nur Illustration: simuliertes Szenario, kein Kundenergebnis und keine Renditegarantie." },
    audit: { kicker: "ERSTE DIAGNOSE", title: "Hochladen. Wir prüfen.", body: "In diesem privaten Prototyp verlässt keine Datei den Browser.", choose: "Pine- oder Python-Datei wählen", selected: "Datei lokal ausgewählt", limit: "Maximal 2 MB · Kein Code ausgeführt", button: "Diagnose vorbereiten" },
    method: { kicker: "DER STRATVERITY-STANDARD", title: "Jede Schlussfolgerung muss zur Evidenz führen.", body: "Wir trennen Storytelling, deklarierte Zahlen, mögliche Neuberechnungen und tatsächlich ausgeführte Tests.", items: [["01", "Prüfen", "Code, Parameter, Daten und Marktannahmen."], ["02", "Neuberechnen", "PF, Netto-Avg-R, Gebühren, Drawdown und Stabilität."], ["03", "Belasten", "Assets, Perioden, Zeiteinheiten und Friktionen."]] },
    improvement: { kicker: "STRATVERITY LAB", title: "Sehen, was besser wird. Und was leidet.", body: "Jede Variante wird mehrdimensional verglichen. Eine höhere Trefferquote zählt nicht, wenn Profit Factor sinkt oder Drawdown steigt.", before: "Gelieferte Strategie", after: "Getestete Variante", metrics: [["Netto-Performance", "+34,6%", "illustrativ"], ["Trefferquote", "+9,4 Pkt.", "sekundär"], ["Profit Factor", "1,18 → 1,46", "nach Gebühren"], ["Max. Drawdown", "−21,8%", "Reduktion"]], disclaimer: "Demodaten. Reale Änderungen hängen von Code, Märkten, Zeitraum, Gebühren und Overfitting-Risiko ab." },
    research: { kicker: "RESEARCH", title: "Methode vor Marketing.", body: "Kurze Beiträge über Robustheit und warum schöne Backtests live scheitern können.", cards: [["Robustheit", "Wie Multi-Asset-Tests Marktabhängigkeit zeigen.", "7 Min."], ["Overfitting", "Echte Verbesserung von opportunistischem Tuning trennen.", "9 Min."], ["Ausführungskosten", "Gebühren, Slippage und Liquidität messen.", "6 Min."]], read: "Beitrag lesen" },
    suite: { kicker: "STRATVERITY-PLATTFORM", title: "Vom ersten Beleg bis zum Monitoring.", body: "Zukünftige Module bleiben klar gekennzeichnet, bis sie verfügbar sind.", items: [["BacktestProof", "Audit", "Zuerst verfügbar"], ["StratVerity Lab", "Verbesserung", "Nächstes Modul"], ["StratVerity Radar", "Monitoring", "In Entwicklung"], ["StratVerity Market", "Geprüfte Strategien", "Zukunftsvision"]] },
    pricing: { kicker: "ANGEBOTE", title: "Starten Sie mit dem Evidenzniveau, das Sie brauchen.", body: "Finale Preise folgen nach realer Kostenmessung und Wettbewerbsanalyse.", plans: [["Diagnose", "Kostenlos", "Begrenzte Erstanalyse per E-Mail", "Starten"], ["Vollständiges Audit", "Pro Analyse", "Bericht, Neuberechnungen und Risiken", "Privatzugang"], ["Radar", "Künftiges Abo", "Kontinuierliches Tracking und Drift-Erkennung", "Updates erhalten"]], popular: "Erstes Produkt" },
    faq: { kicker: "FAQ", title: "Antworten vor dem Upload.", items: [["Wird mein Code automatisch ausgeführt?", "Nein. Die erste Diagnose prüft Dateien, ohne unbekannten Kundencode auszuführen."], ["Sind Verbesserungen garantiert?", "Nie. Die Zahlen auf dieser Seite sind simulierte Beispiele."], ["Ist eine höhere Trefferquote immer besser?", "Nein. Profit Factor, Netto-Avg-R, Kosten, Drawdown und Stabilität sind wichtiger."], ["Welche Quellen werden akzeptiert?", "Der erste Flow unterstützt Pine Script, Python und kompatible Ergebnisexporte."], ["Geht es ohne Konto?", "Die begrenzte Diagnose ist ohne Konto vorgesehen. Eine verifizierte E-Mail liefert den Bericht."]] },
    search: { title: "StratVerity durchsuchen", placeholder: "Audit, Drawdown, Pine, Robustheit…", empty: "Kein Ergebnis. Versuchen Sie einen anderen Begriff.", close: "Schließen" },
    login: { title: "StratVerity-Zugang", body: "Die Anmeldung startet mit den ersten privaten Konten.", email: "E-Mail-Adresse", password: "Passwort", submit: "Zugang anfragen", note: "Prototyp: Die Authentifizierung ist noch nicht verbunden.", success: "Simulierte Anfrage — Konten werden später verbunden.", close: "Schließen" },
    footer: { line: "Prüfen. Verbessern. Überwachen.", risk: "Keine künftige Rendite wird garantiert. Beispiele sind illustrativ." },
  },
} as const;

const barSets: Record<ProductMode, number[]> = {
  audit: [18, 28, 24, 40, 36, 51, 48, 61, 57, 68, 73, 78],
  improve: [14, 22, 19, 33, 29, 46, 41, 58, 64, 72, 79, 91],
  monitor: [34, 40, 37, 46, 43, 55, 52, 61, 58, 68, 65, 72],
};

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "sv-brand sv-brand-compact" : "sv-brand"}>
      <span className="sv-monogram" aria-hidden="true">
        <b>S</b><i>/</i><b>V</b>
      </span>
      <span className="sv-wordmark">
        <strong>STRATVERITY</strong>
        <small>BACKTESTPROOF</small>
      </span>
    </span>
  );
}

export default function StratVeritySite() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [locale, setLocale] = useState<Locale>("fr");
  const [mode, setMode] = useState<ProductMode>("improve");
  const [fileName, setFileName] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const t = copy[locale];

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("stratverity-theme");
    const storedLocale = window.localStorage.getItem("stratverity-locale") as Locale | null;
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredDark ? "dark" : "light");
    if (storedLocale && languages.some((language) => language.code === storedLocale)) setLocale(storedLocale);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("stratverity-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("stratverity-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { rootMargin: "0px 0px -9% 0px", threshold: 0.1 },
    );
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [locale]);

  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(height > 0 ? window.scrollY / height : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setLoginOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const searchResults = useMemo(() => {
    const entries = [
      { title: t.nav.product, detail: t.hero.body, href: "#product" },
      { title: t.method.title, detail: t.method.body, href: "#method" },
      { title: t.improvement.title, detail: t.improvement.body, href: "#lab" },
      ...t.research.cards.map((card) => ({ title: card[0], detail: card[1], href: "#research" })),
      { title: t.pricing.title, detail: t.pricing.body, href: "#pricing" },
      { title: t.faq.title, detail: t.faq.items[0][1], href: "#faq" },
    ];
    const query = searchQuery.trim().toLocaleLowerCase(locale);
    return query
      ? entries.filter((entry) => `${entry.title} ${entry.detail}`.toLocaleLowerCase(locale).includes(query))
      : entries.slice(0, 5);
  }, [locale, searchQuery, t]);

  const moveSpotlight = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name ?? "");
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginMessage(t.login.success);
  };

  const closeOverlays = () => {
    setSearchOpen(false);
    setLoginOpen(false);
    setLoginMessage("");
  };

  return (
    <main className="strat-site" data-theme={theme}>
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} aria-hidden="true" />

      <header className="strat-header">
        <a href="#top" aria-label="StratVerity — BacktestProof"><BrandLogo /></a>

        <nav className={mobileOpen ? "strat-nav open" : "strat-nav"} aria-label="Navigation principale">
          <a href="#product" onClick={() => setMobileOpen(false)}>{t.nav.product}</a>
          <a href="#research" onClick={() => setMobileOpen(false)}>{t.nav.research}</a>
          <a href="#pricing" onClick={() => setMobileOpen(false)}>{t.nav.pricing}</a>
          <a href="#method" onClick={() => setMobileOpen(false)}>{t.nav.resources}</a>
          <a href="#faq" onClick={() => setMobileOpen(false)}>{t.nav.faq}</a>
        </nav>

        <div className="strat-header-actions">
          <button className="header-icon-button search-trigger" type="button" onClick={() => setSearchOpen(true)} aria-label={t.nav.search}>
            <span className="search-glyph" aria-hidden="true" />
            <span>{t.nav.search}</span>
          </button>
          <label className="language-control">
            <span className="globe-glyph" aria-hidden="true">◎</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label="Language">
              {languages.map((language) => <option key={language.code} value={language.code}>{language.short}</option>)}
            </select>
          </label>
          <button className="theme-toggle" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={theme === "light" ? "Dark mode" : "Light mode"}>
            <span className="theme-track"><i>☼</i><i>◐</i><b /></span>
          </button>
          <button className="login-button" type="button" onClick={() => setLoginOpen(true)}>{t.nav.login}</button>
          <button className="mobile-menu" type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu"><i /><i /></button>
        </div>
      </header>

      <section className="strat-hero" id="top" onPointerMove={moveSpotlight}>
        <div className="strat-hero-grid" aria-hidden="true" />
        <div className="strat-hero-copy" data-reveal>
          <div className="status-line"><span />{t.hero.status}</div>
          <h1>{t.hero.line1}<em>{t.hero.line2}</em></h1>
          <p>{t.hero.body}</p>
          <div className="hero-actions">
            <a className="primary-action" href="#audit"><span>{t.hero.primary}</span><i>→</i></a>
            <a className="secondary-action" href="#method">{t.hero.secondary}<span>↘</span></a>
          </div>
          <div className="hero-trust">
            {t.hero.trust.map((item, index) => <span key={item}><b>0{index + 1}</b>{item}</span>)}
          </div>
        </div>

        <div className="performance-console" id="product" data-reveal>
          <div className="console-top">
            <div><BrandLogo compact /><span>DEMO / OPT-024</span></div>
            <span className="simulated-badge">{t.console.subtitle}</span>
          </div>
          <div className="console-tabs" role="tablist" aria-label={t.console.title}>
            {(Object.keys(t.modes) as ProductMode[]).map((item) => (
              <button key={item} className={mode === item ? "active" : ""} type="button" onClick={() => setMode(item)} role="tab" aria-selected={mode === item}>
                {t.modes[item]}
              </button>
            ))}
          </div>
          <div className="console-heading">
            <div><span>{t.console.title}</span><strong>BTC · H1 / MULTI-ASSET</strong></div>
            <div className="before-after-legend"><span><i />{t.console.before}</span><span><i />{t.console.after}</span></div>
          </div>
          <div className="rising-chart" aria-label={t.console.title}>
            <div className="chart-scale"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
            <div className="chart-bars">
              {barSets[mode].map((height, index) => (
                <div className="bar-pair" key={`${mode}-${index}`}>
                  <i className="baseline-bar" style={{ height: `${Math.max(12, height - 18)}%` }} />
                  <i className="optimized-bar" style={{ height: `${height}%`, "--bar-delay": `${index * 45}ms` } as React.CSSProperties} />
                  <span>{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="console-metrics">
            {t.console.labels[mode].map((label, index) => (
              <article key={label}><span>{label}</span><strong>{t.console.values[mode][index]}</strong><i>{mode === "improve" ? "↑" : "•"}</i></article>
            ))}
          </div>
          <p className="console-disclaimer">{t.console.note}</p>
        </div>
      </section>

      <section className="quick-audit" id="audit" data-reveal>
        <div><span className="section-label">{t.audit.kicker}</span><h2>{t.audit.title}</h2><p>{t.audit.body}</p></div>
        <div className={fileName ? "quick-drop selected" : "quick-drop"}>
          <input ref={inputRef} type="file" accept=".pine,.py,.txt" onChange={selectFile} aria-label={t.audit.choose} />
          <button type="button" onClick={() => inputRef.current?.click()}>
            <i>{fileName ? "✓" : "↥"}</i>
            <span><strong>{fileName || t.audit.choose}</strong><small>{fileName ? t.audit.selected : t.audit.limit}</small></span>
          </button>
        </div>
        <button className="audit-submit primary-action" type="button" disabled={!fileName}><span>{t.audit.button}</span><i>→</i></button>
      </section>

      <section className="method-section-complete" id="method">
        <div className="section-heading-complete" data-reveal><span className="section-label">{t.method.kicker}</span><h2>{t.method.title}</h2><p>{t.method.body}</p></div>
        <div className="method-list-complete" data-reveal>
          {t.method.items.map(([number, title, body], index) => (
            <article key={number} style={{ "--item-delay": `${index * 90}ms` } as React.CSSProperties}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div><i>↗</i></article>
          ))}
        </div>
      </section>

      <section className="improvement-section" id="lab" onPointerMove={moveSpotlight}>
        <div className="improvement-copy" data-reveal>
          <span className="section-label">{t.improvement.kicker}</span>
          <h2>{t.improvement.title}</h2>
          <p>{t.improvement.body}</p>
          <div className="improvement-metrics">
            {t.improvement.metrics.map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
          </div>
          <p className="section-disclaimer">{t.improvement.disclaimer}</p>
        </div>
        <div className="comparison-visual" data-reveal>
          <div className="comparison-head"><span>{t.improvement.before}</span><i>VS</i><span>{t.improvement.after}</span></div>
          <div className="comparison-chart">
            <div className="comparison-grid" />
            <div className="comparison-columns before-columns">{[30, 38, 34, 47, 43, 52, 48, 60, 55, 62].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
            <div className="comparison-columns after-columns">{[33, 44, 41, 55, 61, 67, 72, 78, 86, 94].map((height, index) => <i key={index} style={{ height: `${height}%`, "--bar-delay": `${index * 70}ms` } as React.CSSProperties} />)}</div>
            <span className="performance-lift">+34,6%<small>NET PERFORMANCE · DEMO</small></span>
          </div>
          <div className="comparison-foot"><span><i />{t.improvement.before}</span><span><i />{t.improvement.after}</span><b>SIMULATED DATA</b></div>
        </div>
      </section>

      <section className="research-section-complete" id="research">
        <div className="section-heading-complete" data-reveal><span className="section-label">{t.research.kicker}</span><h2>{t.research.title}</h2><p>{t.research.body}</p></div>
        <div className="research-grid" data-reveal>
          {t.research.cards.map(([title, body, time], index) => (
            <article key={title}>
              <div><span>0{index + 1}</span><small>{time}</small></div>
              <span className="research-icon">{index === 0 ? "⌁" : index === 1 ? "∆" : "≋"}</span>
              <h3>{title}</h3><p>{body}</p>
              <button type="button" onClick={() => setSearchOpen(true)}>{t.research.read}<span>↗</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="suite-section-complete">
        <div className="section-heading-complete" data-reveal><span className="section-label">{t.suite.kicker}</span><h2>{t.suite.title}</h2><p>{t.suite.body}</p></div>
        <div className="suite-grid-complete" data-reveal>
          {t.suite.items.map(([name, role, status], index) => (
            <article className={index === 0 ? "available" : ""} key={name}><span>0{index + 1}</span><small>{role}</small><h3>{name}</h3><p>{status}</p><i>↗</i></article>
          ))}
        </div>
      </section>

      <section className="pricing-section-complete" id="pricing">
        <div className="section-heading-complete centered" data-reveal><span className="section-label">{t.pricing.kicker}</span><h2>{t.pricing.title}</h2><p>{t.pricing.body}</p></div>
        <div className="pricing-grid" data-reveal>
          {t.pricing.plans.map(([name, price, detail, action], index) => (
            <article className={index === 1 ? "featured" : ""} key={name}>
              {index === 1 && <span className="plan-badge">{t.pricing.popular}</span>}
              <small>0{index + 1}</small><h3>{name}</h3><strong>{price}</strong><p>{detail}</p>
              <a href={index === 0 ? "#audit" : "#top"}>{action}<span>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section-complete" id="faq">
        <div className="section-heading-complete" data-reveal><span className="section-label">{t.faq.kicker}</span><h2>{t.faq.title}</h2></div>
        <div className="faq-complete" data-reveal>
          {t.faq.items.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
        </div>
      </section>

      <footer className="strat-footer">
        <div className="footer-main"><BrandLogo /><h2>{t.footer.line}</h2><a href="#audit">{t.hero.primary}<span>↗</span></a></div>
        <div className="footer-bottom-complete"><span>© 2026 STRATVERITY · BACKTESTPROOF</span><p>{t.footer.risk}</p><div><a href="#faq">FAQ</a><a href="#top">LEGAL</a><a href="#top">PRIVACY</a></div></div>
      </footer>

      {searchOpen && (
        <div className="site-overlay" role="dialog" aria-modal="true" aria-label={t.search.title} onMouseDown={(event) => event.target === event.currentTarget && closeOverlays()}>
          <div className="search-panel">
            <div className="overlay-head"><BrandLogo compact /><button type="button" onClick={closeOverlays}>{t.search.close} ×</button></div>
            <label><span className="search-glyph" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t.search.placeholder} /></label>
            <div className="search-results">
              {searchResults.length ? searchResults.map((result, index) => (
                <a href={result.href} key={`${result.title}-${index}`} onClick={closeOverlays}><span>0{index + 1}</span><div><strong>{result.title}</strong><p>{result.detail}</p></div><i>↗</i></a>
              )) : <p className="empty-search">{t.search.empty}</p>}
            </div>
          </div>
        </div>
      )}

      {loginOpen && (
        <div className="site-overlay" role="dialog" aria-modal="true" aria-label={t.login.title} onMouseDown={(event) => event.target === event.currentTarget && closeOverlays()}>
          <form className="login-panel" onSubmit={submitLogin}>
            <div className="overlay-head"><BrandLogo compact /><button type="button" onClick={closeOverlays}>{t.login.close} ×</button></div>
            <span className="section-label">PRIVATE ACCESS</span><h2>{t.login.title}</h2><p>{t.login.body}</p>
            <label>{t.login.email}<input type="email" required placeholder="you@company.com" /></label>
            <label>{t.login.password}<input type="password" required placeholder="••••••••" /></label>
            <button className="primary-action" type="submit"><span>{t.login.submit}</span><i>→</i></button>
            <small>{loginMessage || t.login.note}</small>
          </form>
        </div>
      )}
    </main>
  );
}

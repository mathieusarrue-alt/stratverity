import { getSupabaseBrowserClient } from "../supabase/browser";

/**
 * Upload réel d'images vendeur (avatar + screenshots) via Supabase Storage —
 * décision fondateur 2026-09-02 (AskUserQuestion : "Upload réel via Supabase
 * Storage", plutôt que coller une URL externe). Le navigateur uploade
 * l'octet-stream directement dans le bucket, sous la session Supabase
 * authentifiée de l'utilisateur — c'est la policy RLS du bucket (write:
 * authenticated only, sous son propre dossier `${user.id}/...`) qui autorise
 * l'écriture, jamais ce backend. Le backend
 * (`audit_app/marketplace/marketplace_v1.py::validate_media`) ne reçoit et
 * ne valide QUE l'URL publique https résultante.
 *
 * Bucket requis (à créer manuellement une fois dans le dashboard Supabase —
 * voir SAAS_AUDIT_BACKTEST/00_GOVERNANCE/SUPABASE_STORAGE_BUCKET_SETUP.md) :
 *   nom: "marketplace-media", public: true (lecture publique, écriture RLS)
 */
export const MARKETPLACE_MEDIA_BUCKET = "marketplace-media";

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024; // 5 Mo/image
const ALLOWED_MEDIA_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export class MediaUploadError extends Error {}

function sanitizeFileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return ext && ext.length <= 5 ? ext : "png";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Valide localement (type/taille) puis uploade un fichier image vers le
 * bucket Supabase Storage marketplace-media, sous le dossier de
 * l'utilisateur connecté. Retourne l'URL publique https à envoyer au
 * backend dans `avatar_url` ou `screenshots[]`.
 */
export async function uploadMarketplaceMedia(
  file: File,
  kind: "avatar" | "screenshot",
): Promise<string> {
  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    throw new MediaUploadError("Format non supporté (PNG, JPEG, WebP ou GIF uniquement).");
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new MediaUploadError("Image trop lourde (5 Mo max).");
  }
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new MediaUploadError("Session expirée — reconnectez-vous avant d'ajouter des images.");
  }
  const path = `${userData.user.id}/${kind}-${randomId()}.${sanitizeFileExt(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(MARKETPLACE_MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (uploadError) {
    throw new MediaUploadError("Échec de l'upload — réessayez dans un instant.");
  }
  const { data: publicUrlData } = supabase.storage.from(MARKETPLACE_MEDIA_BUCKET).getPublicUrl(path);
  if (!publicUrlData?.publicUrl) {
    throw new MediaUploadError("Upload réussi mais URL publique indisponible.");
  }
  return publicUrlData.publicUrl;
}

/** Supprime un objet précédemment uploadé (ex. retrait d'un screenshot avant
 * soumission du formulaire). Best-effort : une erreur ici ne doit jamais
 * bloquer l'utilisateur — l'objet orphelin sera nettoyé côté lifecycle
 * bucket, pas critique pour la fonctionnalité. */
export async function deleteMarketplaceMedia(publicUrl: string): Promise<void> {
  const marker = `/object/public/${MARKETPLACE_MEDIA_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return;
  const path = publicUrl.slice(idx + marker.length);
  if (!path) return;
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.storage.from(MARKETPLACE_MEDIA_BUCKET).remove([path]);
  } catch {
    // best-effort, cf. commentaire ci-dessus
  }
}

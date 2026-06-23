import { PlayCircle } from "lucide-react";

/**
 * Domínios de players confiáveis. Só iframes apontando para estes hosts
 * são renderizados diretamente — barreira contra XSS via embed colado.
 */
const ALLOWED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "pandavideo.com.br",
  "player-vz", // Panda usa subdomínios player-vz-*.tv.pandavideo.com.br
  "tv.pandavideo.com.br",
  "vturb.com.br",
  "converteai.net", // VTurb/Converte.ai
  "scripts.converteai.net",
];

function hostAllowed(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h) || host.includes(h));
  } catch {
    return false;
  }
}

/** Extrai o primeiro src de <iframe ...> de um trecho de HTML. */
function extractIframeSrc(html: string): string | null {
  const match = html.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Renderiza o vídeo de uma aula a partir do campo `video_embed`.
 * Aceita 3 formatos vindos do admin:
 *   1. URL de embed direto (ex.: https://www.youtube.com/embed/ID)
 *   2. Código <iframe ...> colado (Panda/VTurb/YouTube)
 *   3. Qualquer outro → mostra aviso (não renderiza HTML arbitrário)
 *
 * SEGURANÇA: nunca injetamos HTML cru do admin. Sempre extraímos a URL e,
 * se o host estiver na allowlist, montamos NÓS um <iframe> limpo. Assim
 * scripts/atributos maliciosos colados junto são descartados.
 */
export function VideoEmbed({ embed }: { embed: string | null }) {
  if (!embed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border bg-surface-2 text-muted">
        <div className="flex flex-col items-center gap-2">
          <PlayCircle className="h-10 w-10" />
          <span className="text-sm">Vídeo ainda não disponível.</span>
        </div>
      </div>
    );
  }

  const trimmed = embed.trim();
  const src = trimmed.startsWith("<")
    ? extractIframeSrc(trimmed)
    : trimmed;

  if (!src || !hostAllowed(src)) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-danger/40 bg-surface-2 text-center text-sm text-danger px-6">
        Embed de vídeo inválido ou de origem não permitida. Verifique o código
        no painel admin (apenas YouTube, Vimeo, Panda Video e VTurb são
        aceitos).
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
      {/*
        iframe construído por nós (não é HTML cru do admin).
        sandbox + referrerPolicy reduzem a superfície de ataque.
      */}
      <iframe
        src={src}
        title="Vídeo da aula"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  );
}

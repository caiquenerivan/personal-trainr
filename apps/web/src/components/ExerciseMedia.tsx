import { useState } from 'react';

type ExerciseMediaProps = {
  videoUrl: string | null | undefined;
  gifUrl: string | null | undefined;
  name: string;
};

function getEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (parsed.pathname === '/watch') {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.pathname.startsWith('/embed/')) return url;
    if (parsed.pathname.startsWith('/shorts/')) {
      const id = parsed.pathname.split('/')[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  }

  if (host === 'player.vimeo.com') return url;
  if (host === 'vimeo.com') {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}

// Prioriza vídeo (embutido, não só o link) sobre gif, com opção de alternar
// quando os dois existem. Sem nenhum dos dois, avisa que falta o tutorial.
export function ExerciseMedia({ videoUrl, gifUrl, name }: ExerciseMediaProps) {
  const [showGif, setShowGif] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);

  const hasVideo = !!videoUrl;
  const hasGif = !!gifUrl && !gifFailed;

  if (!hasVideo && !hasGif) {
    return (
      <p className="rounded-lg border border-border bg-base px-4 py-6 text-center text-sm text-text-secondary">
        Ainda não há vídeo ou gif de demonstração para este exercício.
      </p>
    );
  }

  // Cai de volta pro vídeo automaticamente se o gif estava selecionado mas
  // falhou ao carregar (hasGif já reflete gifFailed).
  const displayGif = hasGif && (showGif || !hasVideo);
  const embedUrl = hasVideo ? getEmbedUrl(videoUrl!) : null;

  return (
    <div className="space-y-2">
      {displayGif ? (
        <img
          src={gifUrl!}
          alt={name}
          className="w-full rounded-lg bg-base object-cover"
          onError={() => setGifFailed(true)}
        />
      ) : embedUrl ? (
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            src={embedUrl}
            title={name}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={videoUrl!} controls className="w-full rounded-lg bg-black" />
      )}

      {hasVideo && hasGif && (
        <button
          type="button"
          onClick={() => setShowGif((v) => !v)}
          className="text-xs uppercase text-accent underline transition hover:opacity-80"
        >
          {displayGif ? 'Ver vídeo' : 'Ver gif'}
        </button>
      )}
    </div>
  );
}

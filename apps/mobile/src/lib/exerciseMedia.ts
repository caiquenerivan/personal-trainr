// Miniatura estática publicada junto com cada animação (ver build_media.py no
// projeto exercise-3d): mesmo arquivo em /exercicios/thumbs/, mesmo ?v=.
// Animações de fora do nosso /media (gifUrl próprio do personal) não têm
// miniatura: a lista mostra o ícone em vez de decodificar a animação inteira.
const MEDIA_PATTERN = /\/media\/exercicios\/([^/?#]+\.webp)(\?[^#]*)?$/;

export function thumbnailUrl(gifUrl: string | null | undefined): string | null {
  if (!gifUrl) return null;
  const match = gifUrl.match(MEDIA_PATTERN);
  if (!match) return null;
  return gifUrl.replace(MEDIA_PATTERN, `/media/exercicios/thumbs/${match[1]}${match[2] ?? ''}`);
}

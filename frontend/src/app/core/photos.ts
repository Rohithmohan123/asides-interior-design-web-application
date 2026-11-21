// Site photography: Unsplash (https://unsplash.com/license), served from the Unsplash CDN by photo ID.
// Project photos live in the project records; these are the page-level images.
export const photoUrl = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Resize an Unsplash CDN URL; local paths are returned unchanged. */
export const sized = (src: string, w: number) =>
  src.startsWith('https://images.unsplash.com/') ? src.replace(/([?&])w=\d+/, `$1w=${w}`) : src;

export const HERO_PHOTO = '1631679706909-1844bbd07221';
export const STUDIO_PHOTO = '1664711942326-2c3351e215e6';

/**
 * URL of a file in `public/` (models, textures, images). Works on any base path, so the site can live at
 * the root of a domain or in a sub-folder such as GitHub Pages' `/repo-name/` (D-103).
 * `path` has no leading slash: `asset("models/jar.glb")`.
 */
export const asset = (path: string): string => import.meta.env.BASE_URL + path;

import { SITE_LEGAL } from "@/lib/legal";

export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="hu">
  <head>
    <meta charset="utf-8" />
    <title>Az oldal most nem töltött be | Jövőd.hu</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <style>
      body { font: 15px/1.6 system-ui, -apple-system, sans-serif; background: #100c18; color: #f6efe3; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 31rem; width: 100%; text-align: center; padding: 2rem; border: 1px solid rgba(213, 181, 105, 0.2); border-radius: 0.5rem; background: rgba(24, 18, 36, 0.82); }
      .eyebrow { color: rgba(213, 181, 105, 0.78); font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.75rem; }
      h1 { font-size: 1.35rem; margin: 0 0 0.5rem; font-weight: 600; }
      p { color: rgba(246, 239, 227, 0.68); margin: 0 0 1.5rem; }
      .support { font-size: 0.82rem; color: rgba(246, 239, 227, 0.56); margin-top: 1.25rem; margin-bottom: 0; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #d5b569; color: #16110b; }
      .secondary { background: transparent; color: #f6efe3; border-color: rgba(213, 181, 105, 0.34); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="eyebrow">Jövőd.hu</div>
      <h1>Most nem töltött be az oldal</h1>
      <p>Valami megakadt az oldal betöltésénél. A rendelésed vagy olvasatod ettől nem vész el; frissíts rá az oldalra, vagy térj vissza a főoldalra.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Újrapróbálom</button>
        <a class="secondary" href="/">Vissza a főoldalra</a>
      </div>
      <p class="support">Ha fizetés vagy elkészült olvasat közben akadtál el, írj a vásárlási email címedről: <a href="mailto:${SITE_LEGAL.supportEmail}">${SITE_LEGAL.supportEmail}</a></p>
    </div>
  </body>
</html>`;
}

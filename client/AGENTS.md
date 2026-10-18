<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Use Next.js App Router routes for each dashboard module, with a shared dashboard shell, so sections have distinct URLs and source-specific metadata.
- Keep uploaded report statistics in a typed data module and never derive missing market or agronomic metrics without complete inputs, to preserve statistical integrity.
- Keep filters in a session-only Zustand store and generate documents in the browser, because the current report-based dashboard has no connected account or live-data service.
- Lazy-load React Three Fiber province geometry from geoBoundaries ADM1 data on client-only routes, because WebGL must not run during server rendering.
- Define all visual roles and 3D material colors in the global semantic-token design system so the palette remains consistent.
- Keep homepage crop animation in a dedicated Recharts component, starting on visibility and honoring reduced motion, so report values stay fixed and animation does not run unseen.

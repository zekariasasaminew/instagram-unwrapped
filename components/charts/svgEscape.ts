// Used only by the chart components below that build raw SVG/HTML strings
// (dangerouslySetInnerHTML) for pixel-identical porting of the original
// vanilla-JS chart drawing code. Everywhere else in the dashboard, plain JSX
// text content is used instead, which React already escapes automatically.
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

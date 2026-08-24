/**
 * 电影级胶片颗粒层（Film Grain）
 * 全站最外层覆盖：fixed / pointer-events:none / z-999 / opacity 0.035。
 * 质感由 index.css 的 `.film-grain-overlay` 用 SVG feTurbulence 噪声 + 步进动画实现，
 * 制造安藤忠雄清水混凝土般的粗粝物质感，打破数字网页的生硬感。
 */
export default function FilmGrain() {
  return <div className="film-grain-overlay" aria-hidden="true" />
}

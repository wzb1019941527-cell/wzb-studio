/**
 * Marquee —— 横向无限滚动条（Awwwards 常见编辑手法）
 * 用作区块间的「运动分隔带」，纯 CSS 动画驱动（不依赖 GSAP，零性能负担）。
 * 内容以 display-serif 斜体呈现，国际编辑感；hover 暂停以便阅读。
 */
const ITEMS = [
  'SELECTED WORKS',
  'BESPOKE INTERIORS',
  'EMOTIONAL SPACES',
  'SPACE STYLIST & INTERIOR CURATOR',
]

function Track() {
  return (
    <div className="marquee-track flex shrink-0 items-center">
      {ITEMS.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="marquee-item font-display italic text-bone/85">{t}</span>
          <span className="mx-8 text-khaki/70" style={{ fontSize: '1.1rem' }}>
            ✺
          </span>
        </span>
      ))}
    </div>
  )
}

export default function Marquee() {
  return (
    <section className="relative w-full overflow-hidden border-y border-khaki/15 bg-void py-7">
      <div className="marquee flex w-max whitespace-nowrap">
        <Track />
        <Track />
      </div>
    </section>
  )
}

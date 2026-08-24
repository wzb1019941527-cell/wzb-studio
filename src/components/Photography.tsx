import { useState, useEffect } from 'react'
import { useMenu } from './MenuContext'
import SubGallery, { type SGSeries } from './SubGallery'

/**
 * 城市摄影作品集 —— Booooooom 风格（对标截图精确对齐）
 * 一级：每个系列单张精选封面（~62% 列宽相纸衬纸）+ 纯净单列文字流
 *      （标题 / 中文副标 / 一行微型元数据），3 列自适应瀑布流；
 *      点击整张卡片进入二级沉浸展厅。无彩色装饰线、无侧边角标、无 VIEW GALLERY 按钮。
 * 二级：SubGallery 全屏暗黑网格展厅。
 * 数据：public/photos/city/cityManifest.json + public/photos/city/<slug>/
 */

/* ── 全部城市摄影系列目录（与源文件夹一一对应；仅北京有图，其余为占位） ── */
const CATALOG = [
  { slug: 'beijing',  en: 'BEIJING',   cn: '北京', place: '北京 · 2022–2024', year: '2022–2024' },
  { slug: 'shanghai', en: 'SHANGHAI',  cn: '上海', place: '上海 · 2025',      year: '2025' },
  { slug: 'shenzhen', en: 'SHENZHEN',  cn: '深圳', place: '深圳 · 2025',      year: '2025' },
  { slug: 'hangzhou', en: 'HANGZHOU',  cn: '杭州', place: '杭州 · 2024',      year: '2024' },
  { slug: 'yunnan',   en: 'YUNNAN',    cn: '云南', place: '云南 · 2023',      year: '2023' },
  { slug: 'xinjiang', en: 'XINJIANG',  cn: '新疆', place: '新疆 · 2024',      year: '2024' },
  { slug: 'japan',    en: 'JAPAN',     cn: '日本', place: '日本 · 2024',      year: '2024' },
  { slug: 'korea',    en: 'KOREA',     cn: '韩国', place: '韩国 · 2024',      year: '2024' },
] as const

type Chapter = {
  city: string
  en: string
  place: string
  year: string
  items: Array<{ f: string; w: number; h: number; thumb: string }>
}

function useCityManifest(): Record<string, Chapter> {
  const [m, setM] = useState<Record<string, Chapter>>({})
  useEffect(() => {
    let alive = true
    fetch('/photos/city/cityManifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        if (alive) setM(d)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return m
}

/* ══════════════════════════════════════
   一级封面卡片（Booooooom 风格）
   相纸衬纸 (~62% 列宽) + 纯净单列文字流
   ══════════════════════════════════════ */
function CoverCard({
  cover,
  en,
  cn,
  count,
  year,
  placeholder,
  onClick,
}: {
  cover?: string
  en: string
  cn: string
  count: number
  year: string
  placeholder?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={placeholder}
      className={`group/cover mb-[2rem] block w-full cursor-pointer select-none text-center focus-visible:outline-none [will-change:transform] [transform:translateZ(0)] ${placeholder ? 'cursor-default opacity-70' : ''}`}
    >
      {/* ── 相纸区域：图 92% 列宽居中；外层 hover 色块垫底（Booooooom 风格实色衬纸） ── */}
      <div
        className="mx-auto transition-all duration-500 ease-out"
        style={{
          maxWidth: '92%',
          padding: cover ? '0' : undefined,
        }}
      >
        {/* 悬停时显现的实色色块垫底（默认完全透明无框，hover 浮现 #E8E2D6 衬纸） */}
        <div
          className="rounded-[3px] bg-transparent p-0 transition-all duration-500 ease-out group-hover/cover:bg-[#1A1A1A] group-hover/cover:p-[10px]"
        >
          <div
            className="overflow-hidden rounded-[2px] bg-transparent"
            style={{
              aspectRatio: placeholder ? '4/5' : undefined,
              minHeight: placeholder ? '220px' : undefined,
            }}
          >
        {cover ? (
          <img
            src={cover}
            alt={`${en} cover`}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full transition-[transform,filter] duration-[700ms] ease-out group-hover/cover:scale-[1.02] group-hover/cover:brightness-110"
            style={{ imageOrientation: 'none' }}
          />
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center">
            <span
              className="font-mono uppercase tracking-[0.3em]"
              style={{ fontWeight: 300, fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)' }}
            >
              COMING SOON
            </span>
          </div>
        )}
      </div>
      </div>{/* / 色块垫底 */}
      </div>{/* / 外层 maxWidth 容器 */}

      {/* ── 文字区：Booooooom 单列居中流（标题 → 中文副标 → 一行微型元数据） ── */}
      <div className="pointer-events-none mx-auto mt-4 max-w-[92%]" style={{ textAlign: 'center' }}>
        {/* 主标题（Syne 加粗，对标 Booooooom 的 "Title" by Author） */}
        <h3
          className="font-display leading-snug text-white"
          style={{ fontWeight: 700, fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)', letterSpacing: '0.01em' }}
        >
          {en}
        </h3>
        {/* 中文副标（更轻更小，退为铭牌） */}
        <p className="mt-0.5 font-cjk text-white/40" style={{ fontWeight: 400, fontSize: '0.62rem', letterSpacing: '0.08em' }}>
          {cn}
        </p>
        {/* 单行元数据（对标 Booooooom 的 "22.07.26 — STAFF"，居中） */}
        {!placeholder && (
          <p
            className="mt-2 font-mono tabular-nums text-white/35"
            style={{ fontWeight: 300, fontSize: '0.52rem', letterSpacing: '0.16em' }}
          >
            {count} PHOTOS — {year}
          </p>
        )}
        {placeholder && (
          <p
            className="mt-2 font-mono text-white/15"
            style={{ fontWeight: 300, fontSize: '0.52rem', letterSpacing: '0.16em' }}
          >
            PHOTOS COMING SOON — {year}
          </p>
        )}
      </div>
    </button>
  )
}

/* ══════════════════════════════════════
   主组件
   ══════════════════════════════════════ */
export default function Photography() {
  const { setModal } = useMenu()
  const manifest = useCityManifest()
  const [active, setActive] = useState<SGSeries | null>(null)

  /* 合并 CATALOG（全部系列）与 manifest（有图数据）：每个条目都展示，无图则占位 */
  const cards = CATALOG.map((entry) => {
    const m = manifest[entry.slug]
    const hasImages = m && m.items.length > 0
    return {
      ...entry,
      items: m?.items ?? [],
      hasImages,
    }
  })

  return (
    <section id="photography" className="relative w-full bg-[#0D0D0D]">
      <div className="mx-auto w-full px-[3vw]">
      {/* ── 顶栏 ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-white/40" style={{ fontWeight: 300, letterSpacing: '0.22em', fontSize: '0.68rem' }}>
            ← INDEX
          </span>
          <div className="hidden font-mono text-white/30 sm:block" style={{ fontWeight: 300, fontSize: '0.62rem', letterSpacing: '0.12em' }}>
            CHAPTER 03 — CITY PHOTOGRAPHY
          </div>
        </div>
        <span
          className="font-mono text-white/35 tabular-nums"
          style={{ fontWeight: 300, fontSize: '0.62rem', letterSpacing: '0.16em' }}
        >
          {CATALOG.length} SERIES
        </span>
      </div>

      {/* ── 一级：Booooooom 风格封面瀑布流（3 列自适应） ── */}
      <div className="columns-1 gap-x-12 sm:columns-2 lg:columns-3">
        {cards.map((ch) => {
          /* 有图时构建封面路径和 items；统一使用 1200px 缩略图（th/），避免加载数兆字节原图
             占位模式不传 cover */
          const cover = ch.hasImages
            ? (() => {
                const idx = Math.max(0, ch.items.findIndex((i: { w: number; h: number }) => i.w >= i.h))
                return `/photos/city/${ch.slug}/${ch.items[idx].thumb}`
              })()
            : undefined

          const items = ch.items.map((img: { f: string; thumb: string }) => ({
            src: `/photos/city/${ch.slug}/${img.thumb}`,
            alt: `${ch.cn} ${img.f}`,
          }))

          return (
            <CoverCard
              key={ch.slug}
              cover={cover}
              en={ch.en}
              cn={ch.cn}
              count={ch.items.length}
              year={ch.year}
              placeholder={!ch.hasImages}
              onClick={() =>
                ch.hasImages &&
                setActive({
                  en: ch.en,
                  cn: ch.cn,
                  place: ch.place,
                  year: ch.year,
                  count: ch.items.length,
                  items,
                })
              }
            />
          )
        })}
      </div>
      </div>

      {/* ── 二级：沉浸展厅（全屏网格） ── */}
      {active && (
        <SubGallery
          series={active}
          onBack={() => setActive(null)}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  )
}

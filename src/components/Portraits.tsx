import { useState, useEffect } from 'react'
import { useLightbox } from './Lightbox'

/**
 * 个人形象照专区
 * 职责：展示不同风格的你本人，建立信任与辨识度。按风格分组（工作 / 生活 / 艺术）。
 * 数据驱动：将形象照放入 public/photos/portraits/<风格>/ 即展示（由 portraitsManifest.json 驱动）。
 * 条件渲染：无图片的分组直接收起，绝不展示「待添加」虚线空框。
 */
type PItem = { f: string; w: number; h: number }
type PGroup = { label: string; desc: string; items: PItem[] }

const GROUPS: Array<{ key: string; label: string; desc: string }> = [
  { key: 'all', label: '形象画廊', desc: '不同场景下的个人形象照' },
]

function usePortraitsManifest(): Record<string, PItem[]> {
  const [m, setM] = useState<Record<string, PItem[]>>({})
  useEffect(() => {
    let alive = true
    fetch('/photos/portraits/portraitsManifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: Record<string, PItem[]>) => { if (alive) setM(d ?? {}) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  return m
}

export default function Portraits() {
  const open = useLightbox()
  const manifest = usePortraitsManifest()

  // 仅渲染有图片的分组（无数据分组直接收起）
  const groups = GROUPS
    .map((g) => ({ ...g, items: manifest[g.key] ?? [] }))
    .filter((g) => g.items.length > 0) as Array<PGroup & { key: string }>

  return (
    <section id="portraits" className="relative w-full bg-void px-[7vw] pt-[6vh] pb-[8vh]">
      {/* 板块标头 */}
      <div className="mb-[8vh] flex items-baseline justify-between border-b border-line pb-5">
        <h2 className="font-cjk text-one" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
          个人形象照
        </h2>
        <span
          className="font-mono uppercase text-one/45"
          style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.7rem' }}
        >
          PORTRAITS
        </span>
      </div>

      {/* 有数据的分组才渲染；无图片分组彻底收起，不留空框 */}
      {groups.length > 0 ? (
        <div className="flex flex-col gap-[12vh]">
          {groups.map((g) => {
            const items = g.items.map((im) => ({
              src: `/photos/portraits/${g.key}/${im.f}`,
              alt: `${g.label} ${im.f}`,
            }))
            return (
              <div key={g.key}>
                <div className="mb-5 flex flex-wrap items-baseline gap-4">
                  <h3 className="font-display text-one" style={{ fontWeight: 300, fontSize: 'clamp(1.4rem, 2.6vw, 2rem)' }}>
                    {g.label}
                  </h3>
                  <span
                    className="font-cjk text-one/45"
                    style={{ fontWeight: 300, fontSize: '0.82rem', letterSpacing: '0.05em' }}
                  >
                    {g.desc}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {g.items.map((im, ii) => (
                    <button
                      key={im.f}
                      type="button"
                      onClick={() => open(items, ii)}
                      className="group/card relative aspect-[3/4] cursor-pointer select-none overflow-hidden rounded-[2px] bg-mist transition-shadow duration-300 ease-out hover:shadow-[0_16px_44px_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-khaki/60"
                      style={{ border: '1px solid #222222' }}
                    >
                      <img
                        src={`/photos/portraits/${g.key}/${im.f}`}
                        alt={`${g.label} ${ii + 1}`}
                        draggable={false}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.05]"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // 完全无数据时，仅保留干净标头，不展示任何「待添加」占位
        <div className="h-px w-full bg-line/30" aria-hidden="true" />
      )}
    </section>
  )
}

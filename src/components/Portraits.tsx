import { useState, useEffect } from 'react'
import { useLightbox } from './Lightbox'

/**
 * 个人形象照专区 —— 固定一屏版
 * 图不多，采用 fixedStage 全屏固定布局：顶栏 + 标题 + 居中图片列，杜绝滚动。
 * 点击图片进入灯箱浏览；ESC / CLOSE 关闭模态。
 */
type PItem = { f: string; w: number; h: number }

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

export default function Portraits({ onClose }: { onClose: () => void }) {
  const open = useLightbox()
  const manifest = usePortraitsManifest()
  const items = manifest['all'] ?? []

  const lightboxItems = items.map((im) => ({
    src: `/photos/portraits/all/${im.f}`,
    alt: `形象照 ${im.f}`,
  }))

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-void px-[3.5vw]">
      {/* ═══ 顶栏：PORTRAITS 标 + CLOSE ═══ */}
      <div className="flex shrink-0 items-center justify-between py-[5vh]">
        <span
          className="font-mono uppercase text-one/40"
          style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.66rem' }}
        >
          PORTRAITS
        </span>
        <button
          type="button"
          onClick={onClose}
          className="group flex items-center gap-2 font-mono uppercase text-one/70 transition-colors duration-300 hover:text-one"
          style={{ fontWeight: 300, letterSpacing: '0.25em', fontSize: '0.72rem' }}
        >
          [ CLOSE <span aria-hidden>×</span> ]
        </button>
      </div>

      {/* ═══ 标题区 ═══ */}
      <div className="mb-[3vh] flex shrink-0 items-baseline justify-between border-b border-line pb-4">
        <h2
          className="font-cjk text-one"
          style={{ fontWeight: 300, fontSize: 'clamp(1.6rem, 3.2vw, 2.6rem)' }}
        >
          个人形象照
        </h2>
        <span
          className="hidden font-mono uppercase text-one/45 sm:inline-block"
          style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.7rem' }}
        >
          PORTRAITS
        </span>
      </div>

      {/* ═══ 图片区：flex-1 垂直居中；手机端横向滑动浏览，桌面端等高横排居中 ═══ */}
      <div className="flex flex-1 items-center overflow-hidden">
        {items.length > 0 ? (
          <div className="portraits-scroll flex w-full items-end gap-3 overflow-x-auto px-[3.5vw] py-2 sm:gap-4 md:gap-5 md:justify-center md:overflow-visible md:px-0">
            {items.map((im, ii) => (
              <button
                key={im.f}
                type="button"
                onClick={() => open(lightboxItems, ii)}
                className="group/card relative shrink-0 cursor-pointer select-none overflow-hidden rounded-[2px] bg-mist transition-shadow duration-500 ease-out hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-khaki/60"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <img
                  src={`/photos/portraits/all/${im.f}`}
                  alt={`形象照 ${ii + 1}`}
                  draggable={false}
                  loading="lazy"
                  className="h-[52vh] w-auto object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.04] sm:h-[56vh] md:h-[60vh]"
                />
                {/* 底部极细渐变，保证 hover 时边缘层次 */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)' }}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        ) : (
          // 无数据时保持干净，仅一条细分隔线
          <div className="h-px w-full bg-line/30" aria-hidden="true" />
        )}
      </div>

    </div>
  )
}

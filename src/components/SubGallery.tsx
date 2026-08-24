/**
 * SubGallery —— Booooooom 风格二级沉浸展厅
 * 从一级封面卡片点击进入：全屏暗黑（#0D0D0D）覆盖层，顶部 [ ← BACK TO SERIES ] / [ CLOSE × ]，
 * 主体为该系列全部照片的 3 列自适应瀑布流，严格保留原图比例（width:100% height:auto object-fit:contain），
 * 绝不硬性裁切；每张图下方带微型元数据（01 / 13 — SHENZHEN MUSEUM）。
 */

import { useEffect } from 'react'

export type SGItem = { src: string; alt?: string }
export type SGSeries = {
  en: string
  cn: string
  place: string
  year: string
  count: number
  items: SGItem[]
}

export default function SubGallery({
  series,
  onBack,
  onClose,
}: {
  series: SGSeries
  onBack: () => void
  onClose: () => void
}) {
  const total = series.items.length
  const place = series.place.toUpperCase()

  /* 进入展厅时暂停 Lenis（让原生滚轮接管内部滚动），退出时恢复 */
  useEffect(() => {
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis
    lenis?.stop()
    return () => { lenis?.start() }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#0D0D0D]"
      data-lenis-prevent=""
      style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
    >
      {/* ── 顶部控制栏：左返回 · 中系列标题 · 右关闭 ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0D0D0D]/95 px-[7vw] py-4 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="font-mono uppercase text-white/70 transition-colors duration-300 hover:text-white"
          style={{ fontWeight: 300, fontSize: '0.7rem', letterSpacing: '0.22em' }}
        >
          [ ← BACK TO SERIES ]
        </button>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center">
          <div
            className="font-display uppercase leading-none text-white"
            style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.1em' }}
          >
            {series.en}
          </div>
          <div className="font-cjk text-white/55" style={{ fontSize: '0.66rem', letterSpacing: '0.1em' }}>
            {series.cn}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-mono uppercase text-white/70 transition-colors duration-300 hover:text-white"
          style={{ fontWeight: 300, fontSize: '0.7rem', letterSpacing: '0.22em' }}
        >
          [ CLOSE × ]
        </button>
      </div>

      {/* ── 系列大标题区 ── */}
      <div className="px-[7vw] pt-9">
        <h2
          className="font-display uppercase leading-none text-white"
          style={{ fontWeight: 800, fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)', letterSpacing: '0.02em' }}
        >
          {series.en}
        </h2>
        <p className="mt-2 font-cjk text-white/70" style={{ fontSize: '0.9rem', letterSpacing: '0.12em' }}>
          {series.cn} · {series.year}
        </p>
        <p
          className="mt-1 font-mono uppercase text-white/45"
          style={{ fontWeight: 300, fontSize: '0.62rem', letterSpacing: '0.2em' }}
        >
          {total} EXHIBITION PHOTOS
        </p>
      </div>

      {/* ── Booooooom 网格：3 列自适应瀑布流，原图比例不裁切 ── */}
      <div className="columns-1 gap-5 px-[7vw] py-10 sm:columns-2 lg:columns-3 md:gap-7">
        {series.items.map((it, i) => (
          <figure key={it.src + i} className="mb-5 break-inside-avoid [will-change:transform] [transform:translateZ(0)]">
            <img
              src={it.src}
              alt={it.alt || ''}
              draggable={false}
              loading="lazy"
              decoding="async"
              className="block w-full rounded-[2px]"
              style={{
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
                imageOrientation: 'none',
              }}
            />
            <figcaption
              className="mt-2 font-mono uppercase text-white/45"
              style={{ fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.18em' }}
            >
              {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} — {place}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

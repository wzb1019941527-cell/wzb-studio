import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/** 出版级图注：放大查看器底部 editorial 信息条 */
export type EditorialCaption = {
  en: string
  cn: string
  line: string // 英文一行：分类 · 年份 · 地点 / 或 媒材 · 尺寸 · 年份
  storyEn?: string
  storyCn?: string
}

type Item = { src: string; alt?: string; caption?: EditorialCaption }
type OpenOpts = { title?: string }
type OpenFn = (items: Item[], index: number, opts?: OpenOpts) => void

const LightboxContext = createContext<OpenFn>(() => {})

/** 在任意图片上调用：openAt(group, index) 即可打开放大查看器 */
export const useLightbox = () => useContext(LightboxContext)

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState<string>('')

  const openAt = useCallback<OpenFn>((its, i, opts) => {
    setItems(its)
    setIndex(i)
    setTitle(opts?.title ?? '')
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + items.length) % items.length),
    [items.length],
  )
  const next = useCallback(() => setIndex((i) => (i + 1) % items.length), [items.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, close, prev, next])

  const cap = items[index]?.caption

  /* 底部微缩胶片条：当前缩略图自动滚入视区 */
  const stripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open || !stripRef.current) return
    const el = stripRef.current.children[index] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [open, index])

  return (
    <LightboxContext.Provider value={openAt}>
      {children}
      {open && (
        <div className="lb-overlay" onClick={close}>
          {/* ── 顶部极简控制栏：左返回 · 中系列标题 · 右关闭 ── */}
          <div className="lb-topbar" onClick={(e) => e.stopPropagation()}>
            <button className="lb-back" onClick={close} aria-label="返回摄影页">
              [ ← BACK ]
            </button>
            {title && <span className="lb-title v-mag-title">{title}</span>}
            <button className="lb-close" onClick={close} aria-label="关闭">
              [ CLOSE × ]
            </button>
          </div>
          {items.length > 1 && (
            <button
              className="lb-btn lb-prev"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              aria-label="上一张"
            >
              ‹
            </button>
          )}
          <img
            className="lb-img"
            src={items[index].src}
            alt={items[index].alt || ''}
            onClick={(e) => e.stopPropagation()}
          />
          {items.length > 1 && (
            <button
              className="lb-btn lb-next"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              aria-label="下一张"
            >
              ›
            </button>
          )}
          <div className="lb-count">
            {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </div>
          {/* 底部微缩胶片条：横向极细缩略图，hover 高亮，点击跳转 */}
          {items.length > 1 && (
            <div
              ref={stripRef}
              className="lb-strip"
              data-lenis-prevent
              onClick={(e) => e.stopPropagation()}
            >
              {items.map((it, i) => (
                <img
                  key={it.src + i}
                  src={it.src}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  className={`lb-thumb${i === index ? ' is-active' : ''}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
          {cap && (
            <div className="lb-caption">
              <div className="lb-cap-head">
                <span className="lb-cap-en">{cap.en}</span>
                <span className="lb-cap-cn">{cap.cn}</span>
              </div>
              <div className="lb-cap-line">{cap.line}</div>
              {cap.storyEn && (
                <p className="lb-cap-en-story">{cap.storyEn}</p>
              )}
              {cap.storyCn && (
                <p className="lb-cap-cn-story">{cap.storyCn}</p>
              )}
            </div>
          )}
        </div>
      )}
    </LightboxContext.Provider>
  )
}

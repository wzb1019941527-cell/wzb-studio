import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useLightbox, type EditorialCaption } from './Lightbox'
import { useMenu } from './MenuContext'

/**
 * 02 ART —— 100vh 全屏固定展台（与 01 WORK 语言一致）
 *  · 容器 w-screen h-screen relative overflow-hidden，锁定 100vh，绝不纵向滚动
 *  · 顶栏：左 WZB STUDIO [02] + 类别描述 / 中 16x16 克制艺术徽标 / 右 02 ARTWORKS ···· Menu（完全对齐 Header 视觉语言；关闭走 Menu 切换或 ESC）
 *  · 四角元数据：FINE ART & CURATION / SCROLL / DRAG / studio@wzb.art / SHENZHEN / CHINA
 *  · 中央作品画框（max 55vw × 60vh）几何居中、绝对平置、保留原比例不裁切
 *  · 展品铭牌：英文/拼音大字号（Syne 先锋宽体 + 字重700 + 极高字距）+ 极细宋体中文铭牌（卡其）+ 媒材行
 *  · 三段式切页控制：滚轮 / ‹ › 极细箭头 / 底部全宽连续刻度尺 [ 01 ]…[ 09 ]（点击跳转）
 *  · GSAP 驱动展台内画框平滑平移+淡入，100vh 内完成，无整页位移
 *  · 鼠标视差：画框 0.2 / 四角元数据 0.05
 *  · 出版级数据：每件作品含 medium / dimensions / year（博物馆级铭牌）
 */

type ArtItem = {
  file: string
  title: string
  en: string
  meta: string // 中文媒材行
  medium: string // 英文媒材（Glass & Mixed Media）
  dimensions: string // 80 × 120 cm
  year: string
  kind: 'own' | 'collection'
  group?: string
}

/** 出版级艺术品数据（对标 Radaville 博物馆铭牌） */
const ART: ArtItem[] = [
  // ── 手工艺术类（单件）──
  { file: '/photos/art/01.webp', title: '漆画《春作》', en: 'CHUN ZUO', meta: '大漆 · 60×60cm · 2015', medium: 'Natural Lacquer on Wood', dimensions: '60 × 60 cm', year: '2015', kind: 'own' },
  // ── 玻璃艺术（单件，7 件）──
  { file: '/photos/art/02.webp', title: '玻璃艺术 No.1', en: 'GLASS ART NO.1', meta: '玻璃 · 综合材料', medium: 'Glass & Mixed Media', dimensions: '80 × 120 cm', year: '2024', kind: 'own' },
  { file: '/photos/art/03.webp', title: '玻璃艺术 No.2', en: 'GLASS ART NO.2', meta: '玻璃 · 综合材料', medium: 'Glass & Mixed Media', dimensions: '80 × 120 cm', year: '2024', kind: 'own' },
  { file: '/photos/art/04.webp', title: '玻璃艺术 No.3', en: 'GLASS ART NO.3', meta: '玻璃 · 综合材料', medium: 'Glass & Mixed Media', dimensions: '80 × 120 cm', year: '2024', kind: 'own' },
  { file: '/photos/art/05.webp', title: '玻璃艺术 No.4', en: 'GLASS ART NO.4', meta: '玻璃 · 综合材料', medium: 'Glass & Mixed Media', dimensions: '80 × 120 cm', year: '2024', kind: 'own', group: 'glass67' },
  { file: '/photos/art/06.webp', title: '玻璃艺术 No.5', en: 'GLASS ART NO.5', meta: '玻璃 · 综合材料', medium: 'Glass & Mixed Media', dimensions: '80 × 120 cm', year: '2024', kind: 'own', group: 'glass67' },
  { file: '/photos/art/07.webp', title: '玻璃艺术 No.6', en: 'GLASS ART NO.6', meta: '玻璃 · 综合材料', medium: 'Glass & Mixed Media', dimensions: '80 × 120 cm', year: '2024', kind: 'own' },
  { file: '/photos/art/08.webp', title: '玻璃艺术 No.7', en: 'GLASS ART NO.7', meta: '玻璃 · 综合材料', medium: 'Glass & Mixed Media', dimensions: '80 × 120 cm', year: '2024', kind: 'own' },
  { file: '/photos/art/13.webp', title: '纤维软雕塑', en: 'FIBER SOFT SCULPTURE', meta: '纤维 · 软雕塑', medium: 'Fiber & Soft Sculpture', dimensions: '70 × 50 cm', year: '2023', kind: 'own' },
  // ── 一套（成对）──
  { file: '/photos/art/09.webp', title: '珠海地图 A', en: 'ZHUHAI MAP A', meta: '综合媒材 · 2016', medium: 'Mixed Media', dimensions: '100 × 70 cm', year: '2016', kind: 'own', group: 'zh' },
  { file: '/photos/art/10.webp', title: '珠海地图 B', en: 'ZHUHAI MAP B', meta: '综合媒材 · 2016', medium: 'Mixed Media', dimensions: '100 × 70 cm', year: '2016', kind: 'own', group: 'zh' },
  { file: '/photos/art/11.webp', title: '田中一光 作品研究（一）', en: 'TANAKA IKKO STUDY I', meta: '平面设计 · 藏', medium: 'Graphic Design', dimensions: '—', year: '2016', kind: 'collection', group: 'tnk' },
  { file: '/photos/art/12.webp', title: '田中一光 作品研究（二）', en: 'TANAKA IKKO STUDY II', meta: '平面设计 · 藏', medium: 'Graphic Design', dimensions: '—', year: '2016', kind: 'collection', group: 'tnk' },
]

/** 一套的展示标题/元信息（左右并排时只显示一条） */
type GroupMeta = { en: string; title: string; meta: string; medium: string; dimensions: string; year: string; kind: ArtItem['kind'] }
const GROUP_META: Record<string, GroupMeta> = {
  tnk: { en: 'TANAKA IKKO STUDY', title: '田中一光 作品研究', meta: '平面设计 · 藏', medium: 'Graphic Design', dimensions: '—', year: '2016', kind: 'collection' },
  zh: { en: 'ZHUHAI MAP', title: '珠海地图', meta: '综合媒材 · 2016', medium: 'Mixed Media', dimensions: '100 × 70 cm', year: '2016', kind: 'own' },
  glass67: { en: 'GLASS ART', title: '玻璃艺术', meta: '玻璃 · 综合材料', medium: 'Glass & Mixed Media', dimensions: '80 × 120 cm', year: '2024', kind: 'own' },
}

type Unit = { items: ArtItem[]; group?: string }

/** 把扁平列表按 group 折叠成「展示单元」：单件 = 1 单元，一套 = 1 单元（含 2 张） */
function buildUnits(items: ArtItem[]): Unit[] {
  const units: Unit[] = []
  const byGroup: Record<string, Unit> = {}
  for (const it of items) {
    if (it.group) {
      if (!byGroup[it.group]) {
        const u: Unit = { items: [it], group: it.group }
        byGroup[it.group] = u
        units.push(u)
      } else {
        byGroup[it.group].items.push(it)
      }
    } else {
      units.push({ items: [it] })
    }
  }
  return units
}

const GALLERY = {
  parallax: { amp: 26, damp: 0.9, ease: 'power2.out' },
  transition: { out: 0.32, in: 0.62, inEase: 'power3.out', slide: 8 },
}

export default function Artworks({ onClose: _onClose }: { onClose: () => void }) {
  const { setMenuOpen, menuOpen } = useMenu()
  const menuOpenRef = useRef(menuOpen); menuOpenRef.current = menuOpen
  const units = useMemo(() => buildUnits(ART), [])
  const [index, setIndex] = useState(0)
  const total = units.length
  const cur = units[index]
  const isPair = cur.items.length > 1
  const lead = cur.items[0]
  const meta = cur.group ? GROUP_META[cur.group] : lead

  const cap: EditorialCaption = {
    en: meta.en,
    cn: meta.title,
    line: `${meta.medium} · ${meta.dimensions} · ${meta.year}`,
  }
  const unitItems = useMemo(
    () => cur.items.map((it) => ({ src: it.file, alt: it.title, caption: cap })),
    [cur.items, meta.en, meta.title, meta.medium, meta.dimensions, meta.year],
  )
  const open = useLightbox()

  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const animating = useRef(false)
  const indexRef = useRef(index); indexRef.current = index

  // 首屏入场
  useEffect(() => {
    if (!stageRef.current) return
    gsap.fromTo(stageRef.current, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
  }, [])

  // 鼠标视差
  useEffect(() => {
    const make = (ref: React.RefObject<HTMLDivElement | null>) =>
      ref.current
        ? {
            x: gsap.quickTo(ref.current!, 'x', { duration: GALLERY.parallax.damp, ease: GALLERY.parallax.ease }),
            y: gsap.quickTo(ref.current!, 'y', { duration: GALLERY.parallax.damp, ease: GALLERY.parallax.ease }),
          }
        : null
    const imgQ = make(imgRef)
    const metaQ = make(metaRef)

    const onMove = (e: PointerEvent) => {
      if (menuOpenRef.current) return
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      const A = GALLERY.parallax.amp
      imgQ?.x(nx * A * 0.2); imgQ?.y(ny * A * 0.2)
      metaQ?.x(nx * A * 0.05); metaQ?.y(ny * A * 0.05)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [index])

  // 切页（展台内画框平滑平移+淡入，100vh 内完成）
  const go = (dir: number) => {
    if (animating.current) return
    const next = (indexRef.current + dir + total) % total
    const stage = stageRef.current
    if (!stage) { setIndex(next); return }
    const s = GALLERY.transition.slide
    animating.current = true
    gsap.to(stage, {
      xPercent: -s * dir, autoAlpha: 0, duration: GALLERY.transition.out, ease: 'power2.in',
      onComplete: () => {
        setIndex(next)
        requestAnimationFrame(() => {
          gsap.fromTo(stage, { xPercent: s * dir, autoAlpha: 0 }, {
            xPercent: 0, autoAlpha: 1, duration: GALLERY.transition.in, ease: GALLERY.transition.inEase,
            onComplete: () => { animating.current = false },
          })
        })
      },
    })
  }

  // 刻度尺跳转（直接跨步淡入淡出）
  const gotoTick = (i: number) => {
    if (i === indexRef.current || animating.current) return
    const stage = stageRef.current
    if (!stage) { setIndex(i); return }
    animating.current = true
    gsap.to(stage, {
      autoAlpha: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        setIndex(i)
        requestAnimationFrame(() => {
          gsap.fromTo(stage, { autoAlpha: 0 }, {
            autoAlpha: 1, duration: 0.6, ease: 'power3.out',
            onComplete: () => { animating.current = false },
          })
        })
      },
    })
  }

  // 滚轮切页（100vh 内，绝对不产生整页纵向位移）
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (menuOpenRef.current) return
      if (animating.current) { e.preventDefault(); return }
      e.preventDefault()
      go(e.deltaY > 0 ? 1 : -1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [total])

  // 触摸滑动（手机端左右滑动切换艺术品）
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    let startX = 0, startY = 0, tracking = false
    const onTouchStart = (e: TouchEvent) => {
      if (animating.current || menuOpenRef.current) return
      const t = e.touches[0]
      startX = t.clientX; startY = t.clientY; tracking = true
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault()
        go(dx < 0 ? 1 : -1)
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [total])

  // 展品铭牌掩码划出动效（与 01 WORK 语言统一：英文先滑出，中文副标题随后）
  useEffect(() => {
    const root = stageRef.current
    const lines = root?.querySelectorAll('.art-title-line, .art-sub-line')
    if (!lines || !lines.length) return
    const arr = Array.from(lines)
    gsap.killTweensOf(arr)
    gsap.set(arr, { yPercent: 100, opacity: 0 })
    gsap.to(arr, {
      yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.06,
    })
  }, [index])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <section ref={sectionRef} id="artworks" className="relative h-screen w-screen overflow-hidden bg-void">
      <div ref={stageRef} className="absolute inset-0">

        {/* 中央作品画框（几何居中，保留原比例不裁切） */}
        <div ref={imgRef} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center will-change-transform">
          <div className={`relative flex items-end gap-5 ${isPair ? 'flex-row' : 'flex-col'}`}>
            {cur.items.map((it, ii) => (
              <div key={it.file} className="relative shrink-0">
                <img
                  key={`${it.file}-${index}`}
                  src={it.file}
                  alt={it.title}
                  draggable={false}
                  decoding="async"
                  onError={(e) => { console.warn('[ART] img failed', it.file, e); }}
                  onLoad={() => console.log('[ART] img loaded', it.file)}
                  onClick={() => open(unitItems, ii)}
                  className="pointer-events-auto block cursor-pointer select-none rounded-sm bg-mist"
                  style={{
                    maxWidth: isPair ? '40vw' : '55vw',
                    maxHeight: '60vh',
                    width: 'auto',
                    height: 'auto',
                    boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.32)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
                {/* 分类小角标：作 / 藏（仅单件时显示在图上；一套时显示在首图） */}
                {(!isPair || ii === 0) && (
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 font-cjk backdrop-blur-sm ${
                      it.kind === 'collection'
                        ? 'border border-khaki/60 bg-paper/70 text-khaki'
                        : 'bg-clay/85 text-paper'
                    }`}
                    style={{ fontWeight: 300, fontSize: '0.62rem', letterSpacing: '0.25em' }}
                  >
                    {it.kind === 'collection' ? '藏' : '作'}
                  </span>
                )}
              </div>
            ))}
            {/* 底部暗向渐变打底：确保超细白字铭牌清晰 */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] rounded-sm"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 100%)' }}
              aria-hidden="true"
            />
            {/* 展品铭牌（对齐画框左缘，左下角收纳） */}
            <div className="pointer-events-none absolute bottom-0 left-0 flex flex-col items-start pb-6 pl-6 text-left md:pb-8 md:pl-8">
              {/* 英文/拼音大字号（Syne 先锋宽体 + 字重700 + 极高字距）；掩码容器 + 升起行 */}
              <div className="overflow-hidden py-1">
                <h3 className="art-title-line block font-display text-one uppercase"
                  style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 3.2vw, 2.6rem)', lineHeight: 1.05, letterSpacing: '0.22em', textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}>
                  {meta.en}
                </h3>
              </div>
              {/* 中文铭牌（极细宋体 + 卡其）；掩码容器 + 升起行 */}
              <div className="mt-2 overflow-hidden py-1">
                <span className="art-sub-line block font-cjk text-khaki/80"
                  style={{ fontWeight: 300, fontSize: '0.82rem', letterSpacing: '0.18em' }}>
                  {meta.title}
                </span>
              </div>
              <span className="mt-1 font-mono text-one/50"
                style={{ fontWeight: 300, fontSize: '0.62rem', letterSpacing: '0.16em' }}>
                {meta.medium} · {meta.dimensions} · {meta.year}
              </span>
              <button type="button" onClick={() => open(unitItems, 0)}
                className="pointer-events-auto mt-4 font-mono text-one/60 transition-colors duration-300 hover:text-khaki"
                style={{ fontWeight: 300, letterSpacing: '0.22em', fontSize: '0.6rem' }}>
                VIEW FULL <span aria-hidden className="ml-1">↗</span>
              </button>
            </div>
          </div>
        </div>

        {/* 四角元数据（Layer 1，极慢视差） */}
        <div ref={metaRef} className="pointer-events-none absolute inset-0 z-40 will-change-transform">
          {/* 左上：FINE ART & CURATION */}
          <div className="absolute left-[3.5vw] top-[12vh] flex flex-col gap-0.5">
            <span className="font-mono uppercase text-khaki/70" style={{ fontWeight: 500, letterSpacing: '0.3em', fontSize: '0.58rem' }}>
              FINE ART &amp; CURATION
            </span>
          </div>
          {/* 右上：SCROLL / DRAG */}
          <div className="absolute right-[3.5vw] top-[12vh] flex flex-col items-end gap-0.5 text-right">
            <span className="font-mono uppercase text-one/40" style={{ fontWeight: 300, letterSpacing: '0.28em', fontSize: '0.6rem' }}>
              SCROLL / DRAG
            </span>
          </div>
          {/* 左下：邮箱 */}
          <div className="absolute bottom-[7vh] left-[3.5vw]">
            <span className="font-mono text-one/45" style={{ fontWeight: 300, letterSpacing: '0.12em', fontSize: '0.66rem' }}>
              1019941527@qq.com
            </span>
          </div>
          {/* 右下：地点 */}
          <div className="absolute bottom-[7vh] right-[3.5vw] text-right">
            <span className="font-mono text-one/45" style={{ fontWeight: 300, letterSpacing: '0.18em', fontSize: '0.66rem' }}>
              SHENZHEN / CHINA
            </span>
          </div>
        </div>
      </div>

      {/* 顶栏对齐 Header 视觉语言：左 WZB STUDIO [02] + 类别 / 中 16x16 徽标 / 右 02 ARTWORKS ···· Menu */}
      <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-[3.5vw] py-5">
        {/* 左：WZB STUDIO | [02] | 类别描述 */}
        <div className="flex items-center gap-3">
          <span className="font-mono uppercase text-one" style={{ fontWeight: 500, letterSpacing: '0.24em', fontSize: '0.95rem' }}>
            WZB STUDIO
          </span>
          <span className="inline-block font-mono tabular-nums text-khaki/70" style={{ fontWeight: 400, letterSpacing: '0.2em', fontSize: '0.62rem' }}>
            [02]
          </span>
          <span className="hidden max-w-[28vw] truncate font-mono text-one/55 sm:inline-block" style={{ fontWeight: 300, letterSpacing: '0.06em', fontSize: '0.66rem' }}>
            玻璃艺术 · 漆画 · 综合媒材
          </span>
        </div>

        {/* 中：16x16 克制艺术徽标（装饰，禁用点击） */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="7" stroke="rgba(156,138,114,0.6)" strokeWidth="0.75" />
            <path d="M8 2.5 L8 13.5 M2.5 8 L13.5 8" stroke="rgba(156,138,114,0.45)" strokeWidth="0.5" />
            <circle cx="8" cy="8" r="2" stroke="rgba(245,243,239,0.55)" strokeWidth="0.6" />
          </svg>
        </div>

        {/* 右：02 ARTWORKS | ···· Menu */}
        <div className="flex items-center gap-4">
          <span className="hidden font-mono uppercase text-one/55 md:inline-block" style={{ fontWeight: 400, letterSpacing: '0.28em', fontSize: '0.62rem' }}>
            02 ARTWORKS
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="group relative flex items-center gap-1.5 font-mono uppercase text-khaki/80 transition-colors duration-300 hover:text-one"
            style={{ fontWeight: 300, letterSpacing: '0.22em', fontSize: '0.66rem' }}
          >
            <span className="text-one/35">····</span>
            <span>Menu</span>
            <span className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-khaki transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </button>
        </div>
      </div>

      {/* 左右极细箭头（底部居中） */}
      <div className="absolute bottom-[7vh] left-1/2 z-50 flex -translate-x-1/2 items-center gap-6">
        <button type="button" onClick={() => go(-1)} aria-label="上一个"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-one/25 text-one/80 transition-colors duration-300 hover:border-khaki hover:text-khaki">‹</button>
        <button type="button" onClick={() => go(1)} aria-label="下一个"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-one/25 text-one/80 transition-colors duration-300 hover:border-khaki hover:text-khaki">›</button>
      </div>

      {/* 底部全宽连续机械刻度尺（点击跳转） */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-40 w-full">
        {/* 致密垂直细刻度线（装饰轴） */}
        <div
          className="absolute inset-x-0 bottom-0 h-9"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(245,243,239,0.14) 0, rgba(245,243,239,0.14) 1px, transparent 1px, transparent 13px)',
          }}
          aria-hidden
        />
        {/* 项目数字轴（可点击跳转） */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-3 flex items-end justify-between px-[3.5vw]">
          {units.map((_u, i) => {
            const active = i === index
            return (
              <button key={i} type="button" onClick={() => gotoTick(i)}
                aria-label={`第 ${i + 1} 件作品`}
                className="group flex flex-col items-center"
                style={{ flex: '1 1 0' }}>
                <span className="block w-px transition-all duration-300"
                  style={{
                    height: active ? '14px' : '7px',
                    background: active ? 'rgba(156,138,114,0.95)' : 'rgba(245,243,239,0.3)',
                  }} />
                <span className="mt-1.5 font-mono tabular-nums transition-colors duration-300"
                  style={{
                    fontWeight: 300, fontSize: '0.5rem', letterSpacing: '0.05em',
                    color: active ? 'rgba(245,243,239,0.92)' : 'rgba(245,243,239,0.32)',
                  }}>
                  [ {pad(i + 1)} ]
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useMenu } from './MenuContext'

type LenisLike = {
  stop: () => void
  start: () => void
  scrollTo?: (target: string | HTMLElement, opts?: { offset?: number }) => void
}

const getLenis = (): LenisLike | undefined =>
  (window as unknown as { lenis?: LenisLike }).lenis

type Item = {
  num: string
  label: string
  sub: string
  target?: string
  modal?: 'portraits' | 'artworks' | 'contact'
}

const ITEMS: Item[] = [
  { num: '01', label: 'WORK', sub: '精选软装与空间案例', target: '#cases' },
  { num: '02', label: 'PORTRAITS', sub: '工作与生活形象', modal: 'portraits' },
  { num: '03', label: 'ART', sub: '艺术与材料研究', modal: 'artworks' },
  { num: '04', label: 'CONTACT', sub: '商务合作与社交媒体', modal: 'contact' },
]

/** 出版级品牌与服务文案（对标 Radaville Studio） */
const SERVICES = [
  { num: '01', label: 'Interior & Spatial Photography' },
  { num: '02', label: 'Art Direction & Spatial Styling' },
  { num: '03', label: 'Gallery & Exhibition Curation' },
]

/**
 * MenuOverlay —— 全屏报章式菜单（参考 Radaville Studio 目录结构）
 * 固定全屏 z-90 + 暗色 #0A0A0A 底盘 + 胶片颗粒层。
 * 布局：顶栏 WZB STUDIO + CLOSE / 中部 导航 + 右侧 editorial 栏（服务·地点）/ 底部三栏（品牌故事·品牌·触点）。
 * 入场：极轻自顶揭幕（5%）+ 整体淡入，目录项与面板近同步浮现（无长延迟），关闭反向渐隐。
 * 打开期间 lenis.stop() 挂起背景滚动；关闭恢复。
 * WORK / CONTACT 走锚点跳转；PHOTOGRAPHY / PORTRAITS / ART 走模态呼出。
 */
export default function MenuOverlay() {
  const { menuOpen, setMenuOpen, setModal, modal } = useMenu()
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lenis = getLenis()
    const panel = panelRef.current
    if (!panel) return

    if (menuOpen) {
      lenis?.stop()
      gsap.set(panel, { display: 'flex' })
      // 克制入场：极轻的自顶揭幕（仅 5%）+ 整体淡入，避免"整页下坠"观感
      gsap.fromTo(
        panel,
        { clipPath: 'inset(0 0 5% 0)', autoAlpha: 0 },
        { clipPath: 'inset(0 0 0% 0)', autoAlpha: 1, duration: 0.5, ease: 'power3.out' },
      )
      const lines = listRef.current?.querySelectorAll('.menu-line')
      if (lines && lines.length) {
        // 文字与面板几乎同步浮现，去掉原 0.28s 长延迟，消除"顿一下再出字"
        gsap.fromTo(
          lines,
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.05, delay: 0.08 },
        )
      }
    } else {
      gsap.to(panel, {
        clipPath: 'inset(0 0 100% 0)',
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power4.inOut',
        onComplete: () => gsap.set(panel, { display: 'none' }),
      })
      // 仅在无模态打开时恢复滚动；模态自身会再次挂起 Lenis
      if (!modal) lenis?.start()
    }
  }, [menuOpen, modal])

  const goTarget = (target: string) => {
    const lenis = getLenis()
    setModal(null) // 从模态内点导航项时一并关闭模态，露出主页目标区块
    lenis?.start()
    lenis?.scrollTo?.(target, { offset: -84 })
    setMenuOpen(false)
  }

  const openModal = (name: 'portraits' | 'artworks' | 'contact') => {
    setMenuOpen(false)
    setModal(name)
  }

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-[100] hidden flex-col overflow-hidden bg-[#0A0A0A]"
      style={{ willChange: 'clip-path', clipPath: 'inset(0 0 100% 0)' }}
      aria-hidden={!menuOpen}
    >
      {/* 极淡胶片颗粒（复用全站 noise 滤镜） */}
      <div className="film-grain-overlay pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden />

      {/* 顶部：WZB STUDIO + CLOSE —— 必须高于目录列表层 */}
      <div className="relative z-10 flex items-center justify-between px-[3.5vw] py-5">
        <span
          className="font-mono uppercase text-one"
          style={{ fontWeight: 500, letterSpacing: '0.24em', fontSize: '0.95rem' }}
        >
          WZB STUDIO
        </span>
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="group flex items-center gap-2 font-mono uppercase text-one/70 transition-colors duration-300 hover:text-one"
          style={{ fontWeight: 300, letterSpacing: '0.25em', fontSize: '0.72rem' }}
        >
          [ CLOSE <span aria-hidden>×</span> ]
        </button>
      </div>

      {/* 中部：导航 + 右侧 editorial 栏（桌面） */}
      <div className="relative z-10 flex flex-1 flex-col justify-center gap-10 px-[3.5vw] md:flex-row md:items-center md:gap-[6vw]">
        {/* 左侧大字号目录（收紧行高与外边距，给右侧留呼吸） */}
        <nav ref={listRef} className="flex flex-1 flex-col">
          {ITEMS.map((it) => (
            <button
              key={it.num}
              type="button"
              onClick={() => (it.target ? goTarget(it.target) : openModal(it.modal!))}
              className="menu-line pointer-events-auto group flex items-baseline gap-6 border-b border-one/10 py-3 text-left transition-colors duration-300 hover:border-khaki/40"
            >
              <span
                className="font-mono tabular-nums text-khaki"
                style={{ fontWeight: 400, fontSize: '0.8rem', letterSpacing: '0.2em' }}
              >
                {it.num}
              </span>
              <div className="flex flex-col gap-1.5">
                <span
                  className="font-display uppercase text-one transition-colors duration-300 group-hover:text-khaki"
                  style={{ fontWeight: 300, fontSize: 'clamp(2rem, 6vw, 4.5rem)', lineHeight: 1.0, letterSpacing: '0.02em' }}
                >
                  {it.label}
                </span>
                {/* 中文辅助说明：横排小字，收纳于英文标题下方（水平线条感） */}
                <span
                  className="font-cjk text-one/45"
                  style={{ fontWeight: 300, fontSize: '0.72rem', letterSpacing: '0.08em' }}
                >
                  {it.sub}
                </span>
              </div>
            </button>
          ))}
        </nav>

        {/* 右侧 editorial 栏（仅桌面，加宽留白） */}
        <aside className="hidden flex-col gap-14 md:flex md:w-[30vw]">
          {/* 01 SERVICES */}
          <div>
            <div
              className="mb-4 font-mono uppercase text-khaki/60"
              style={{ fontWeight: 300, letterSpacing: '0.1em', fontSize: '0.72rem' }}
            >
              01 — SERVICES
            </div>
            <ul className="space-y-2.5">
              {SERVICES.map((s) => (
                <li key={s.num} className="flex items-baseline gap-3">
                  <span
                    className="font-mono tabular-nums text-khaki/70"
                    style={{ fontWeight: 400, fontSize: '0.58rem', letterSpacing: '0.18em' }}
                  >
                    {s.num}
                  </span>
                  <span
                    className="font-sans text-one/70"
                    style={{ fontWeight: 300, fontSize: '0.82rem', letterSpacing: '0.01em' }}
                  >
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 02 LOCATION & STUDIO */}
          <div>
            <div
              className="mb-4 font-mono uppercase text-khaki/60"
              style={{ fontWeight: 300, letterSpacing: '0.1em', fontSize: '0.72rem' }}
            >
              02 — LOCATION &amp; STUDIO
            </div>
            <div className="space-y-1.5 font-mono text-one/70" style={{ fontWeight: 300, fontSize: '0.78rem', letterSpacing: '0.06em' }}>
              <div className="text-one">WZB STUDIO</div>
              <div>Shenzhen / Guangdong, China</div>
              <div className="text-one/45">Available for Global Assignments</div>
            </div>
          </div>
        </aside>
      </div>

    </div>
  )
}

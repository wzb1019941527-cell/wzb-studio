import { useEffect, useRef, useState } from 'react'
import { useMenu } from './MenuContext'
import gsap from 'gsap'

/**
 * Header —— 固定顶栏（九宫格对齐 Radaville）
 *  左：WZB STUDIO | [0X] | 当前案例标题（动态）
 *  中：16x16 克制艺术徽标
 *  右：01 Work | ···· Menu（按钮，平滑展开全屏菜单）
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { setMenuOpen, caseInfo } = useMenu()
  const idxRef = useRef<HTMLSpanElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > window.innerHeight * 0.5)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      ticking = false
    }
  }, [])

  // 计数器 / 案例标题随切页微浮动推入（yPercent 60→0 + 淡入，与全屏文字动态语言统一）
  useEffect(() => {
    const els = [idxRef.current, titleRef.current].filter(Boolean) as HTMLElement[]
    if (!els.length) return
    gsap.fromTo(els, { yPercent: 60, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out',
    })
  }, [caseInfo.index, caseInfo.title])

  const idx = String((caseInfo.index ?? 0) + 1).padStart(2, '0')

  return (
    <header className="site-header fixed inset-x-0 top-0 z-40 flex items-center justify-between px-[5vw] py-5">
      {/* 左：WZB STUDIO | [0X] | 标题 */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          className="font-mono uppercase text-one transition-opacity duration-500"
          style={{ fontWeight: 500, letterSpacing: '0.24em', fontSize: '0.95rem' }}
        >
          WZB STUDIO
        </a>
        <span ref={idxRef} className="inline-block font-mono tabular-nums text-khaki/70" style={{ fontWeight: 400, letterSpacing: '0.2em', fontSize: '0.62rem' }}>
          [{idx}]
        </span>
        <span ref={titleRef} className="hidden max-w-[28vw] truncate font-mono text-one/55 sm:inline-block" style={{ fontWeight: 300, letterSpacing: '0.06em', fontSize: '0.66rem' }}>
          {caseInfo.title}
        </span>
      </div>

      {/* 中：16x16 艺术徽标 */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="7" stroke="rgba(156,138,114,0.6)" strokeWidth="0.75" />
          <path d="M8 2.5 L8 13.5 M2.5 8 L13.5 8" stroke="rgba(156,138,114,0.45)" strokeWidth="0.5" />
          <circle cx="8" cy="8" r="2" stroke="rgba(245,243,239,0.55)" strokeWidth="0.6" />
        </svg>
      </div>

      {/* 右：01 Work | ···· Menu */}
      <div className="flex items-center gap-4">
        <span className="hidden font-mono uppercase text-one/55 md:inline-block" style={{ fontWeight: 400, letterSpacing: '0.28em', fontSize: '0.62rem' }}>
          01 Work
        </span>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="group relative flex items-center gap-1.5 font-mono uppercase text-khaki/80 transition-colors duration-300 hover:text-one"
          style={{ fontWeight: 300, letterSpacing: '0.22em', fontSize: '0.66rem' }}
        >
          <span className="text-one/35">····</span>
          <span>Menu</span>
          <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-khaki transition-transform duration-300 ease-out group-hover:scale-x-100" />
        </button>
      </div>

      {/* 滚过后才显示的半透明背景条 */}
      {scrolled && (
        <div
          className="absolute inset-0 -z-10 bg-paper/80 backdrop-blur-md transition-opacity duration-500"
          aria-hidden
        />
      )}
    </header>
  )
}

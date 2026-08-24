import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Loader from './components/Loader'
import Cases from './components/Cases'
import Contact from './components/Contact'
import Header from './components/Header'
import { LightboxProvider } from './components/Lightbox'
import FilmGrain from './components/FilmGrain'
import MenuOverlay from './components/Menu'
import { MenuContext, type ModalName } from './components/MenuContext'
import ModalShell from './components/Modal'
import Portraits from './components/Portraits'
import Artworks from './components/Artworks'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const loaderRoot = useRef<HTMLDivElement>(null)
  const loaderText = useRef<HTMLDivElement>(null)

  // ── 全站 Menu / Modal 状态 ──
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<ModalName | null>(null)
  const [caseInfo, setCaseInfo] = useState<{ index: number; total: number; title: string }>({
    index: 0,
    total: 22,
    title: '',
  })

  useEffect(() => {
    // ── Lenis 平滑滚动，与 GSAP 帧循环统一驱动，杜绝抖动 ──
    // anchors.offset: 负值抵消顶部固定导航栏高度，点击锚点后目标标题不被遮挡
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true, anchors: { offset: -84 } })
    // 暴露给各板块（如 Cases 切页时挂起/恢复全局平滑滚动），避免滚轮穿透
    ;(window as unknown as { lenis?: Lenis }).lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      // ── 开场时间线：Loader 揭幕 ──
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        loaderText.current,
        { autoAlpha: 0, letterSpacing: '-0.04em' },
        { autoAlpha: 1, letterSpacing: '0.42em', duration: 0.8, ease: 'power2.out' },
        0,
      )
      tl.to(loaderRoot.current, { yPercent: -100, duration: 0.6, ease: 'power4.inOut' }, 1.2)

      // ── Cases 随 Loader 揭幕顺滑浮现（开门见山，第一眼即核心作品）──
      gsap.fromTo(
        '#cases',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.4 },
      )
    })

    // 字体异步加载后修正触发点位置
    ScrollTrigger.refresh()
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh())
    }

    // 主页固定一屏，禁止预览滚动串到下一块（保护项目板块不被滚轮切走）
    document.body.style.overflow = 'hidden'

    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      lenis.destroy()
      ;(window as unknown as { lenis?: Lenis }).lenis = undefined
    }
  }, [])

  return (
    <MenuContext.Provider value={{ menuOpen, setMenuOpen, modal, setModal, caseInfo, setCaseInfo }}>
      <LightboxProvider>
        <FilmGrain />
        <Loader rootRef={loaderRoot} textRef={loaderText} />
        <Header />
        <MenuOverlay />

        {/* ═══ 主页仅 Cases 一屏，固定死不允许向下滚动（保护项目板块不被滚轮切走到联系板块）═══ */}
        <main className="h-screen overflow-hidden">
          <Cases />
        </main>

        {/* ═══ Contact 改回独立模态板块（Menu 05 CONTACT 呼出）—— 不与 Cases 混在同一滚动流，点开才覆盖上来 ═══ */}
        {modal === 'contact' && (
          <ModalShell label="CONTACT" onClose={() => setModal(null)}>
            <Contact />
          </ModalShell>
        )}

        {/* ═══ 全屏模态：从 Menu 抽屉呼出（不占主页滚动）═══ */}
        {modal === 'portraits' && (
          <ModalShell label="PORTRAITS" onClose={() => setModal(null)}>
            <Portraits />
          </ModalShell>
        )}
        {modal === 'artworks' && (
          <ModalShell label="ARTWORKS" fixedStage onClose={() => setModal(null)}>
            <Artworks onClose={() => setModal(null)} />
          </ModalShell>
        )}
      </LightboxProvider>
    </MenuContext.Provider>
  )
}

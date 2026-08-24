import { useEffect, useRef } from 'react'
import gsap from 'gsap'

type LenisLike = {
  stop: () => void
  start: () => void
  scrollTo?: (target: string | HTMLElement, opts?: { offset?: number }) => void
}

const getLenis = (): LenisLike | undefined =>
  (window as unknown as { lenis?: LenisLike }).lenis

/**
 * ModalShell —— 全屏模态壳（从 Menu 抽屉呼出的独立板块）
 * 固定全屏 z-95 + 原生纵向滚动；挂载即挂起 Lenis 防穿透，卸载恢复。
 * 右上角 [ CLOSE × ] 关闭；Esc 同效；入场 GSAP 轻微上浮淡入。
 * 内部包裹 Photography / Portraits / Artworks，使其以抽屉/模态形式呈现。
 */
export default function ModalShell({
  label,
  onClose,
  fixedStage,
  children,
}: {
  label: string
  onClose: () => void
  fixedStage?: boolean
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    const el = ref.current
    if (el) {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      )
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className={`fixed inset-0 z-[95] bg-void ${fixedStage ? 'overflow-hidden' : 'overflow-y-auto'}`}
      data-lenis-prevent=""
      style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
    >
      {/* 关闭按钮（非固定舞台模式由 Modal 提供；固定舞台模式由板块自带顶栏 CLOSE） */}
      {!fixedStage && (
        <button
          type="button"
          onClick={onClose}
          className="fixed right-[7vw] top-[4.5vh] z-[96] flex items-center gap-2 font-mono uppercase text-one/70 transition-colors duration-300 hover:text-one"
          style={{ fontWeight: 300, letterSpacing: '0.25em', fontSize: '0.72rem' }}
        >
          [ CLOSE <span aria-hidden>×</span> ]
        </button>
      )}
      {/* 板块微标（左上，与首页四角报章呼应；固定舞台模式由板块自带顶栏） */}
      {!fixedStage && (
        <span
          className="pointer-events-none fixed left-[7vw] top-[5vh] z-[96] font-mono uppercase text-one/40"
          style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.66rem' }}
        >
          {label}
        </span>
      )}
      {/* 内容容器：固定舞台模式锁定 100vh 全屏不滚动；普通模式可纵向滚动 */}
      <div ref={ref} className={fixedStage ? 'relative h-screen w-screen' : 'min-h-screen px-[7vw] pb-[12vh] pt-[14vh]'}>
        {children}
      </div>
    </div>
  )
}

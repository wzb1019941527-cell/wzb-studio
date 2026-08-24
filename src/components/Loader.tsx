import type { RefObject } from 'react'

type LoaderProps = {
  rootRef: RefObject<HTMLDivElement>
  textRef: RefObject<HTMLDivElement>
}

/**
 * 00 Loader —— 开场加载遮罩
 * 全屏 #111111，居中超细 WZB，动画由 App 的统一时间线驱动。
 */
export default function Loader({ rootRef, textRef }: LoaderProps) {
  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void"
    >
      <div
        ref={textRef}
        className="select-none font-display text-bone text-[18vw] leading-none"
        style={{ fontWeight: 100, letterSpacing: '0.42em', opacity: 0 }}
      >
        WZB
      </div>
    </div>
  )
}

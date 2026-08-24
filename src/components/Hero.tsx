import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const TEXTURE_VIDEO =
  '/textures/Abstract_editorial_texture_in__2026-08-10T15-59-50.mp4'

/**
 * 01 Hero —— 首屏：WZB 字母内嵌缓慢流动的抽象材质视频。
 *
 * 技术要点（CSS mask 方案，比 SVG<foreignObject> 跨浏览器稳）
 * ──────────────────────────────────────────────────────
 * · 一个真实 <video autoplay loop muted playsInline> 作为 DOM 元素
 * · 用一段"透明底 + 白色 WZB 字"的内联 SVG 做 CSS mask
 *   （mask 默认取 alpha 通道：白字区域显示视频，其余透明）
 * · 视频被字形裁切 → 字母内部就是流动的画面
 * · 鼠标移动：视频反向视差（让字母内的画面"对外探"）
 * · 闲置时：视频缓慢自漂（让字母内画面活着）
 * · 入场：GSAP 把整组从下方淡升上来（与 Loader 揭幕同步）
 */
const MASK_SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 360'>` +
    `<text x='500' y='290' text-anchor='middle' ` +
    `font-family='Helvetica Neue, Inter, Arial, sans-serif' ` +
    `font-size='380' font-weight='900' letter-spacing='-14' fill='white'>WZB</text>` +
    `</svg>`,
)
const MASK_URL = `url("data:image/svg+xml,${MASK_SVG}")`

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 1.45 })

      // 字母组入场：从下方升起 + 轻微 scale 收敛 + opacity
      tl.fromTo(
        wrapRef.current,
        { autoAlpha: 0, y: 48, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.4, ease: 'power4.out' },
        0,
      )

      // 副标题 / 角落微标淡入
      tl.fromTo(
        [subtitleRef.current, labelsRef.current],
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' },
        0.5,
      )
    })
    return () => ctx.revert()
  }, [])

  // 鼠标视差：视频反向位移（让字母里的"画面"对外探）
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!videoRef.current) return
      const nx = (e.clientX / window.innerWidth - 0.5) * 2 // -1..1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      gsap.to(videoRef.current, {
        x: -nx * 38,
        y: -ny * 24,
        duration: 1.4,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // 闲置自动漂：让视频持续"呼吸"，无鼠标时也不死寂
  useEffect(() => {
    if (!videoRef.current) return
    const drift = gsap.to(videoRef.current, {
      x: '+=14',
      y: '+=10',
      duration: 9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
    return () => {
      drift.kill()
    }
  }, [])

  return (
    <main
      ref={rootRef}
      id="hero"
      className="relative h-screen w-full overflow-hidden bg-paper"
    >
      {/* ── 视频纹理（被 WZB 字形 CSS mask 裁切，字母内就是流动的画面） ── */}
      <div ref={wrapRef} className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          src={TEXTURE_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="block w-[92vw] max-w-[1100px]"
          style={{
            aspectRatio: '1000 / 360',
            objectFit: 'cover',
            filter: 'saturate(0.95) contrast(1.04)',
            WebkitMaskImage: MASK_URL,
            maskImage: MASK_URL,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
      </div>

      {/* 编辑感角标 + 副标题（与原 Hero 版式一致：保留极简气质） */}
      <div
        className="pointer-events-none absolute top-[6vh] left-[7vw] font-sans uppercase text-ink/55"
        style={{ fontWeight: 300, letterSpacing: '0.42em', fontSize: '0.72rem' }}
      >
        WZB Studio
      </div>

      <div
        ref={labelsRef}
        className="pointer-events-none absolute inset-x-0 bottom-[6vh] flex items-end justify-between px-[7vw]"
      >
        <div
          className="font-sans uppercase text-ink/40"
          style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.68rem' }}
        >
          软装设计 · 空间策展
        </div>

        <div className="text-right" ref={subtitleRef}>
          <p
            className="font-sans uppercase text-clay"
            style={{
              fontWeight: 300,
              letterSpacing: '0.2em',
              lineHeight: 1.7,
              fontSize: 'clamp(0.95rem, 1.7vw, 1.3rem)',
            }}
          >
            Space Stylist &amp;
            <br />
            Interior Curator
          </p>
        </div>
      </div>

      {/* 底部滚动提示 */}
      <div className="pointer-events-none absolute bottom-[2vh] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-ink/40">
        <span
          className="font-sans uppercase"
          style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.6rem' }}
        >
          Scroll
        </span>
        <span className="h-8 w-px bg-ink/25" />
      </div>
    </main>
  )
}

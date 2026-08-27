import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * HeroLink —— 联系页主角可悬停链接
 * 下划线由中心向两端展开 + 字色暖白→卡其（纯 CSS，0.5s）
 */
function HeroLink({
  href,
  children,
  target,
  rel,
}: {
  href: string
  children: React.ReactNode
  target?: string
  rel?: string
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className="contact-link relative inline-block font-display text-bone transition-colors duration-300 ease-out hover:text-khaki
        after:absolute after:bottom-[-10px] after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-khaki
        after:transition-all after:duration-500 after:ease-out hover:after:w-full"
      style={{
        fontWeight: 300,
        fontSize: 'clamp(1.6rem, 4vw, 3.2rem)',
        letterSpacing: '0.01em',
        lineHeight: 1.25,
      }}
    >
      {children}
    </a>
  )
}

/**
 * 04 Contact —— 固定一屏版
 * 顶栏（CONTACT / CLOSE）+ 居中内容（标语 + 三行联系方式）+ 底部脚注。
 * 入场：标语淡入 → 联系方式 stagger 上浮 → 脚注淡入。
 */
export default function ContactSection({ onClose }: { onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const intro = rootRef.current?.querySelector('.contact-intro')
      const links = gsap.utils.toArray<HTMLElement>('.contact-link')
      const foot = gsap.utils.toArray<HTMLElement>('.contact-foot')

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (intro) {
        tl.from(intro, { opacity: 0, y: 14, duration: 0.9 })
      }
      if (links.length) {
        tl.from(
          links,
          { y: 32, opacity: 0, duration: 0.9, stagger: 0.16 },
          '<+0.2',
        )
      }
      if (foot.length) {
        tl.from(foot, { opacity: 0, duration: 0.7 }, '<+0.35')
      }
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-void px-[3.5vw]"
    >
      {/* ═══ 顶栏：CONTACT 标 + CLOSE ═══ */}
      <div className="flex shrink-0 items-center justify-between py-[5vh]">
        <span
          className="font-mono uppercase text-one/40"
          style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.66rem' }}
        >
          CONTACT
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

      {/* ═══ 内容区：flex-1 垂直居中 ═══ */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* 顶部微标 + 小标语 */}
        <div className="contact-intro mb-[7vh] flex flex-col items-center gap-4 text-center">
          <div
            className="font-mono uppercase text-khaki"
            style={{ fontWeight: 300, letterSpacing: '0.42em', fontSize: '0.7rem' }}
          >
            04 — CONTACT
          </div>
          <div
            className="font-display uppercase text-bone/65"
            style={{
              fontWeight: 300,
              fontSize: 'clamp(0.8rem, 1.1vw, 0.95rem)',
              letterSpacing: '0.32em',
            }}
          >
            LET&apos;S CREATE SOMETHING BEAUTIFUL.
          </div>
        </div>

        {/* 主体：三行联系方式垂直居中堆叠 */}
        <div className="flex flex-col items-center gap-8 text-center md:gap-11">
          <HeroLink href="mailto:1019941527@qq.com">1019941527@qq.com</HeroLink>
          <HeroLink href="tel:18123755082">微信 / 电话 · 18123755082</HeroLink>
          <HeroLink href="https://www.xiaohongshu.com/user/profile/5a902a54b1da142f14856de3" target="_blank" rel="noopener noreferrer">小红书 · wwwzzb</HeroLink>
        </div>
      </div>

      {/* ═══ 底部脚注 ═══ */}
      <div
        className="contact-foot flex shrink-0 w-full flex-col items-center gap-2 pb-[5vh] text-center font-mono uppercase text-khaki/55"
        style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.62rem' }}
      >
        <div>SHENZHEN / CHINA — AVAILABLE WORLDWIDE</div>
        <div>© 2026 WZB STUDIO · ALL RIGHTS RESERVED</div>
      </div>
    </div>
  )
}

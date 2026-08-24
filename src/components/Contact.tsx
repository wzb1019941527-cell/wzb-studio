import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * HeroLink —— 联系页主角可悬停链接
 * 下划线由中心向两端展开 + 字色暖白→卡其（纯 CSS，0.5s）
 * 字号 clamp(1.8rem, 4.5vw, 3.6rem)：在三块联系方式中作为视觉中心。
 */
function HeroLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="contact-link relative inline-block font-display text-bone transition-colors duration-300 ease-out hover:text-khaki
        after:absolute after:bottom-[-10px] after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-khaki
        after:transition-all after:duration-500 after:ease-out hover:after:w-full"
      style={{
        fontWeight: 300,
        fontSize: 'clamp(1.8rem, 4.5vw, 3.6rem)',
        letterSpacing: '0.01em',
        lineHeight: 1.25,
      }}
    >
      {children}
    </a>
  )
}

/**
 * 05 Contact & Footer —— 收尾板块（Editorial Contact Card）
 * 视觉层级反转：把"联系方式"提到真正的视觉中心，最大字号；原来的巨型
 * "LET'S CREATE" 谢幕大字压成一行小标语；地点/版权退到最底层脚注。
 * 布局：flex-col items-center justify-center —— 顶部微标 + 小标语、
 * 主体三行联系方式垂直居中堆叠、底部极小脚注。
 * 入场：标语先淡入 → 联系方式 stagger 上浮 → 脚注淡入（节奏感与原版一致）。
 */
export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const intro = sectionRef.current?.querySelector('.contact-intro')
      const links = gsap.utils.toArray<HTMLElement>('.contact-link')
      const foot = gsap.utils.toArray<HTMLElement>('.contact-foot')

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      })

      // 顶部微标 + 小标语：先轻轻淡入
      if (intro) {
        tl.from(intro, { opacity: 0, y: 14, duration: 0.9, ease: 'power3.out' })
      }

      // 主体三行联系方式：stagger 上浮，是这页的"主角登场"
      if (links.length) {
        tl.from(
          links,
          { y: 38, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.18 },
          '<+0.25',
        )
      }

      // 底部脚注：最后淡淡补上
      if (foot.length) {
        tl.from(foot, { opacity: 0, duration: 0.8, ease: 'power3.out' }, '<+0.45')
      }

      ScrollTrigger.refresh()
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative flex min-h-screen w-full flex-col items-center justify-center bg-void px-[7vw] py-[8vh]"
    >
      {/* 顶部：微标 + 压成一行的小标语（原巨型 CTA 三行字） */}
      <div className="contact-intro mb-[9vh] flex flex-col items-center gap-4 text-center">
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
            fontSize: 'clamp(0.85rem, 1.15vw, 1rem)',
            letterSpacing: '0.32em',
          }}
        >
          LET&apos;S CREATE SOMETHING BEAUTIFUL.
        </div>
      </div>

      {/* 主体：三行联系方式垂直居中堆叠 —— 这页真正的视觉中心 */}
      <div className="flex flex-col items-center gap-9 text-center md:gap-12">
        <HeroLink href="mailto:1019941527@qq.com">1019941527@qq.com</HeroLink>
        <HeroLink href="tel:18123755082">微信 / 电话 · 18123755082</HeroLink>
        <HeroLink href="https://www.xiaohongshu.com">小红书 · wwwzzb</HeroLink>
      </div>

      {/* 底部：极小脚注（地点 + 版权） */}
      <div
        className="contact-foot mt-[10vh] flex w-full flex-col items-center gap-2 text-center font-mono uppercase text-khaki/55"
        style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.66rem' }}
      >
        <div>SHENZHEN / CHINA — AVAILABLE WORLDWIDE</div>
        <div>© 2026 WZB STUDIO · ALL RIGHTS RESERVED</div>
      </div>
    </section>
  )
}
import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import manifest from '../data/projectsManifest.json'
import { useLightbox, type EditorialCaption } from './Lightbox'
import { useMenu } from './MenuContext'

type ImgRec = { f: string; w: number; h: number }
const MANIFEST = manifest as Record<string, ImgRec[]>

/**
 * Radaville 风格案例画廊 — 保留本站暗色调（void 底盘），只借鉴其互动骨架：
 *  · 四角报章排版（左上 Logo / 中上索引 / 右上 Work·Menu / 四角元数据）
 *  · 中央聚焦画框 + 左下角极简无衬线铭牌标题（去花哨、画面解耦、暗渐变打底）
 *  · 底部精密刻度尺（[01]…[17]，可点击跳转）
 *  · 三层平置视差（零旋转）：元数据 0.05 / 画框 0.2 / 标题 0.4
 *  · 滚轮滑行切换（X 轴吸附居中），首尾边界释放给整页滚动，不卡死站点
 *  · 背景固定全黑（尊重用户「全黑」偏好），themeColor 仅作数据字段保留、不驱动背景
 */

/** 出版级案例数据模版（对标 Radaville 结构化字段） */
type CaseStudy = {
  slug: string
  title: string // 中文名
  en: string // 英文/拼音大写名
  city: string
  year: string
  category: string // 英文服务范畴（出版级分类）
  location: string // 英文地点（City, China）
  storyEn: string // 英文项目叙述
  storyCn: string // 中文项目叙述
  themeColor: string // 数据字段保留（高奢暖调），当前不驱动背景
  kind?: string
}

/** 项目顺序 = 文件夹编号前缀 1~17；全部灌注出版级中英文案，零占位符 */
const CASES: CaseStudy[] = [
  {
    slug: 'p01', title: '邱锡鹏个人展览：河神的女儿', en: 'DAUGHTER OF THE RIVER GOD',
    city: '深圳', year: '2026', category: 'Exhibition & Gallery Curation', location: 'Shenzhen, China',
    storyEn: 'A solo exhibition by Qiuxipeng — "Daughter of the River God" — staged against deep neutral walls, where each soft-furnishing interval becomes a pause for the river to surface in the room.',
    storyCn: '邱锡鹏个展「河神的女儿」：深沉的中性底色承接每一件装置，软装于序列之间留出呼吸间隙，让河流走入空间。',
    themeColor: '#2E1914',
  },
  {
    slug: 'p02', title: '「放·起」黎鸿城&许锦龙双个展', en: 'FANG · QI',
    city: '深圳', year: '2026', category: 'Exhibition & Gallery Curation', location: 'Shenzhen, China',
    storyEn: 'A dual exhibition titled "Fang · Qi", framing the dialogue between Li Hongcheng and Xu Jinlong — restrained staging places the two practices on equal footing, the empty intervals between works letting their conversation breathe.',
    storyCn: '「放·起」黎鸿城与许锦龙双个展：以克制的展陈让两位艺术家的作品平起平坐，作品之间的留白即是他们对话的呼吸。',
    themeColor: '#2A2522',
  },
  {
    slug: 'p03', title: '成都国贸启樾天玺 245', en: 'CHENGDU GUOMAO QIYUE TIANXI 245',
    city: '成都', year: '2025', category: 'Commercial & Hospitality Space', location: 'Chengdu, China',
    storyEn: 'A hospitality-grade commercial styling: deep wood and brass anchor the luxury, while clustered seating forms stay-able social nodes that slow the transaction down.',
    storyCn: '酒店级商业软装：深木与黄铜锚定高级感，成簇的座椅构成可停留的社交节点，让交易空间也能慢下来。',
    themeColor: '#29201A',
  },
  {
    slug: 'p04', title: '广州侨鑫', en: 'GUANGZHOU QIAOXIN RESIDENCE',
    city: '广州', year: '2025', category: 'Residential Interior & Styling', location: 'Guangzhou, China',
    storyEn: 'Rooted in Lingnan’s humidity, the styling draws the outdoors in through airy lights and greenery, with movable pieces that let the home rearrange itself daily.',
    storyCn: '以岭南的湿热为底，用通透浅色与绿植把户外引渡进室内；可移动的软装让空间随日常随时重组。',
    themeColor: '#22252A',
  },
  {
    slug: 'p05', title: '济南金地 162', en: 'JINAN JINDI 162',
    city: '济南', year: '2024', category: 'Residential Interior & Styling', location: 'Jinan, China',
    storyEn: 'Spring-water as motif: cool slate-blue against warm timber, long-pile rugs and draped curtains softening the right angles into a quiet envelope.',
    storyCn: '以泉城的水意为题，用冷调灰蓝与暖木形成温度对比；长绒地毯与垂坠帘幕柔化直角，给硬装空间裹出一处安静。',
    themeColor: '#2B2228',
  },
  {
    slug: 'p06', title: '济南金地 235', en: 'JINAN JINDI 235',
    city: '济南', year: '2024', category: 'Model Home & Showflat', location: 'Jinan, China',
    storyEn: 'A younger, lighter reading of the same geography — an accent chair and geometric side table seed memory points within standardization.',
    storyCn: '同一地缘的另一种解法：更年轻、更轻盈，以跳色单椅与几何边几制造记忆点，让样板间在标准化中跳出个性。',
    themeColor: '#2C231E',
  },
  {
    slug: 'p07', title: '北京西红门 129', en: 'BEIJING XIHONGMEN 129',
    city: '北京', year: '2023', category: 'Residential Interior & Styling', location: 'Beijing, China',
    storyEn: 'A whole-home styling where earthy textiles and handmade ceramics compose a livable negative space, letting the finished base recede and lived traces take the lead.',
    storyCn: '一套城市住宅的整体软装：以大地色织物与手作陶器组织出可被居住的留白，让精装基底退后，生活痕迹成为主角。',
    themeColor: '#262A2C',
  },
  {
    slug: 'p08', title: '北京西红门 149', en: 'BEIJING XIHONGMEN 149',
    city: '北京', year: '2024', category: 'Residential Interior & Styling', location: 'Beijing, China',
    storyEn: 'A sibling plan to 129 — warmer oak and softer lighting, tuning the same footprint toward a calmer, more tactile domesticity.',
    storyCn: '与 129 同源的另一套方案：更暖的橡木与更柔的灯光，把同一户型调向更安静、更具触感的居家感。',
    themeColor: '#2A241E',
  },
  {
    slug: 'p09', title: '常熟合院', en: 'CHANGSHU COURTYARD HOUSE',
    city: '常熟', year: '2025', category: 'Model Home & Showflat', location: 'Changshu, China',
    storyEn: 'Borrowing the courtyard’s advancing-receding order, void outside meets fullness inside; bamboo, stone and plain linen answer the local temper.',
    storyCn: '借江南合院的进落秩序，把庭院的空与室内的满对置；竹、石与素麻呼应在地气质，让样板间像一户真正住着的人家。',
    themeColor: '#23262A',
  },
  {
    slug: 'p10', title: '华润北京瑞府会所', en: 'CHINA RESOURCES BEIJING RUIFU CLUB',
    city: '北京', year: '2023', category: 'Club & Hospitality Space', location: 'Beijing, China',
    storyEn: 'A members’ club styling where sober stone and lacquer build weight, and a single warm glow retains the privacy and ease of a private residence.',
    storyCn: '会所软装以沉稳石材与大漆构建分量，一抹暖光保留私家住宅般的私密与松弛。',
    themeColor: '#2D2018',
  },
  {
    slug: 'p11', title: '苏州龙湖山河颂', en: 'SUZHOU LONGHU SHANHE SONG',
    city: '苏州', year: '2025', category: 'Model Home & Showflat', location: 'Suzhou, China',
    storyEn: 'A showflat strategy that seeds local character into a standardized plan; warm wood and handmade objects dissolve uniformity into lived-in warmth.',
    storyCn: '样板间软装策略：在标准化户型中植入在地气质，以暖木与手作器物消解精装房的均质，营造有人住过的温度。',
    themeColor: '#292420',
  },
  {
    slug: 'p12', title: '深圳中海云颂玖章花园 128', en: 'SHENZHEN ZHONGHAI YUNSONG 128',
    city: '深圳', year: '2026', category: 'Model Home & Showflat', location: 'Shenzhen, China',
    storyEn: 'Compact yet generous — a 128-plan tuned with light oak and curved textiles, proving refinement needs no square-meter surplus.',
    storyCn: '紧凑而慷慨：以浅橡木与弧形织物调校 128 户型，证明精致无需面积的富余。',
    themeColor: '#25282B',
  },
  {
    slug: 'p13', title: '福州龙湖商墅', en: 'FUZHOU LONGHU VILLA',
    city: '福州', year: '2021', category: 'Commercial & Hospitality Space', location: 'Fuzhou, China',
    storyEn: 'A “workable yet livable” brief for a commercial villa — dark wood and leather define the weight of hosting, a warm glow keeping domestic ease.',
    storyCn: '商墅的软装以可商可居为命题：沉稳深木与皮革定义会客的厚重，一抹暖光保留居家的私密与松弛。',
    themeColor: '#2C2620',
  },
  {
    slug: 'p14', title: '太原金地', en: 'TAIYUAN JINDI RESIDENCE',
    city: '太原', year: '2022', category: 'Residential Interior & Styling', location: 'Taiyuan, China',
    storyEn: 'Warm orange and ochre punctuate a neutral grey; a curved sofa and plush textile soften the architecture’s hardness, conjuring northern warmth.',
    storyCn: '用暖橘与赭石的局部点亮中性灰调，弧形沙发与毛绒织物软化建筑的硬朗，营造北方居所应有的温度。',
    themeColor: '#262220',
  },
  {
    slug: 'p15', title: '龙湖扬州 143 户型', en: 'LONGHU YANGZHOU 143',
    city: '扬州', year: '2021', category: 'Model Home & Showflat', location: 'Yangzhou, China',
    storyEn: 'A showflat that seeds Yangzhou’s gentleness into a standard plan; handmade objects and warm wood dissolve the finished shell into lived-in warmth.',
    storyCn: '样板间软装：在扬州的标准户型中植入温润气质，以手作器物与暖木消解精装房的均质。',
    themeColor: '#2A2326',
  },
  {
    slug: 'p16', title: '北京龙湖下跃', en: 'BEIJING LONGHU LOWER RESIDENCE',
    city: '北京', year: '2023', category: 'Residential Interior & Styling', location: 'Beijing, China',
    storyEn: 'Centered on “sunken living”, low-saturation warm greys and natural wood build depth; layered textiles balance the void without closing off.',
    storyCn: '以下沉式起居为核心，用低饱和的暖灰与天然木质构建纵深；织物层叠平衡挑空，既有包裹感又不失通透。',
    themeColor: '#262A2C',
  },
  {
    slug: 'p17', title: '成都绵阳 100 亩', en: 'CHENGDU MIANYANG 100MU',
    city: '成都', year: '2021', category: 'Model Home & Showflat', location: 'Chengdu, China',
    storyEn: 'A showflat for a hundred-mu development, laid in warm white and oak; tasteful singular objects voice a “less but finer” way of living.',
    storyCn: '百亩大盘的展示样板：以暖白与橡木铺陈松弛的生活底色，用品味单品传达少而精的居住主张。',
    themeColor: '#292420',
  },
  {
    slug: 'p18', title: '北京龙湖御湖境售楼处', en: "BEIJING LONGHU YUHUJING",
    city: '北京', year: '2022', category: 'Commercial & Hospitality Space', location: 'Beijing, China',
    storyEn: "A sales pavilion where architecture meets water — stone and lacquer set a calm luxury, while soft light keeps the space open and unhurried.",
    storyCn: '售楼处以水为境，石材与大漆铺陈沉静的高级感，柔光让空间通透而不迫促，让看房成为一场从容的游走。',
    themeColor: '#26282C',
  },
  {
    slug: 'p19', title: '青岛金地样板间 140 户型', en: "QINGDAO JINDI 140",
    city: '青岛', year: '2024', category: 'Model Home & Showflat', location: 'Qingdao, China',
    storyEn: "A 140-plan showflat tuned with coastal light — airy linens and pale oak answer Qingdao's sea breeze, making compactness feel generous.",
    storyCn: '140 户型样板间以海风为引，用通透亚麻与浅橡木呼应青岛的海，让紧凑户型也显得从容宽敞。',
    themeColor: '#232A2B',
  },
  {
    slug: 'p20', title: '青岛金地样板间 190 户型', en: "QINGDAO JINDI 190",
    city: '青岛', year: '2024', category: 'Model Home & Showflat', location: 'Qingdao, China',
    storyEn: "A larger 190-plan where layered textures and a quiet palette stage a family rhythm — restraint as the truest luxury.",
    storyCn: '190 户型以层叠质感与克制配色铺陈一家人的节奏，把适度当作真正的奢侈。',
    themeColor: '#29231F',
  },
  {
    slug: 'p21', title: '青岛金地售楼处', en: "QINGDAO JINDI SALES CENTER",
    city: '青岛', year: '2024', category: 'Commercial & Hospitality Space', location: 'Qingdao, China',
    storyEn: "A sales center that borrows the sea — cool marble and warm timber hold the room, a single glow easing the threshold between public and private.",
    storyCn: '售楼处以海为邻，冷峻大理石与暖木共筑空间骨架，一抹暖光柔化公共与私属的边界。',
    themeColor: '#25282B',
  },
  {
    slug: 'p22', title: '上海国贸售楼处', en: "SHANGHAI GUOMAO SALES CENTER",
    city: '上海', year: '2023', category: 'Commercial & Hospitality Space', location: 'Shanghai, China',
    storyEn: "A Shanghai sales pavilion with metropolitan polish — brushed metal and deep tones frame the city's ambition in a single, quiet breath.",
    storyCn: '上海售楼处以都市质感为底，拉丝金属与深色调框住这座城市的雄心，于安静中见锋芒。',
    themeColor: '#23262A',
  },
]

const GALLERY = {
  img: { w: '66vw', h: '68vh' },
  parallax: { amp: 26, damp: 0.9, ease: 'power2.out' },
  transition: { out: 0.32, in: 0.62, inEase: 'power3.out', slide: 7 },
}

// 类型标签：把 CASES.category 精简成 1–2 个极简短标签，帮客户快速筛选项目类型
const TAG_MAP: Record<string, string[]> = {
  'Exhibition & Gallery Curation': ['Exhibition'],
  'Commercial & Hospitality Space': ['Commercial', 'Hospitality'],
  'Residential Interior & Styling': ['Residential', 'Interior'],
  'Model Home & Showflat': ['Model Home'],
  'Club & Hospitality Space': ['Club', 'Hospitality'],
}

export default function Cases() {
  const [index, setIndex] = useState(0)
  const [hoverIndex, setHoverIndex] = useState(-1)
  const [dockActive, setDockActive] = useState(false)
  const [thumbsLoaded, setThumbsLoaded] = useState(false)
  const total = CASES.length
  const cur = CASES[index]

  const indexRef = useRef(index); indexRef.current = index
  const animating = useRef(false)

  const imgs = MANIFEST[cur.slug] ?? []
  const heroSrc = imgs.length > 0 ? `/photos/${cur.slug}/${imgs[0].f}` : ''
  // 所有项目画框高度统一（不按比例变），让翻页节奏齐整；
  // width: auto + object-contain 让图片在固定高度框内等比缩放。

  const cap: EditorialCaption = {
    en: cur.en,
    cn: cur.title,
    line: `${cur.category} · ${cur.year} · ${cur.location}`,
    storyEn: cur.storyEn,
    storyCn: cur.storyCn,
  }
  const items = useMemo(
    () => imgs.map((im) => ({ src: `/photos/${cur.slug}/${im.f}`, alt: cur.title, caption: cap })),
    [cur.slug, cur.en, cur.title, cur.category, cur.year, cur.location, cur.storyEn, cur.storyCn],
  )
  const open = useLightbox()
  const { setCaseInfo } = useMenu()

  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const firstReveal = useRef(true)

  // ── 首屏入场 ──
  useEffect(() => {
    if (!stageRef.current) return
    gsap.fromTo(stageRef.current, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
  }, [])

  // ── 同步当前案例信息给 Header + 标题掩码划出动效（复刻 Radaville 律动）──
  useEffect(() => {
    setCaseInfo({ index, total, title: cur.title })

    // 掩码升起：英文主标题先滑出，中文副标题随后（阶梯时差 Stagger），像从暗处滑门背后顺滑升起
    const root = stageRef.current
    const lines = root?.querySelectorAll('.title-line, .subtitle-line')
    if (lines && lines.length) {
      const arr = Array.from(lines)
      gsap.killTweensOf(arr)
      gsap.set(arr, { yPercent: 100, opacity: 0 })
      gsap.to(arr, {
        yPercent: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        delay: firstReveal.current ? 1.5 : 0.06,
      })
    }
    firstReveal.current = false
  }, [index])

  // ── 三层平置视差（零旋转）──
  useEffect(() => {
    const make = (ref: React.RefObject<HTMLDivElement | null>) =>
      ref.current
        ? {
            x: gsap.quickTo(ref.current!, 'x', { duration: GALLERY.parallax.damp, ease: GALLERY.parallax.ease }),
            y: gsap.quickTo(ref.current!, 'y', { duration: GALLERY.parallax.damp, ease: GALLERY.parallax.ease }),
          }
        : null
    const metaQ = make(metaRef)
    const imgQ = make(imgRef)

    const A = GALLERY.parallax.amp
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      metaQ?.x(nx * A * 0.05); metaQ?.y(ny * A * 0.05)
      imgQ?.x(nx * A * 0.2);  imgQ?.y(ny * A * 0.2)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [index])

  // ── 切换（X 轴滑行吸附居中）──
  const go = (dir: number) => {
    if (animating.current) return
    const cur_i = indexRef.current
    const next = (cur_i + dir + total) % total
    const stage = stageRef.current
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis
    if (!stage) { setIndex(next); return }
    const s = GALLERY.transition.slide
    animating.current = true
    lenis?.stop()   // 切页期间挂起全局平滑滚动，杜绝滚轮穿透到下一板块
    gsap.to(stage, {
      xPercent: -s * dir, autoAlpha: 0.0, duration: GALLERY.transition.out, ease: 'power2.in',
      onComplete: () => {
        setIndex(next)
        requestAnimationFrame(() => {
          gsap.fromTo(stage, { xPercent: s * dir, autoAlpha: 0 }, {
            xPercent: 0, autoAlpha: 1, duration: GALLERY.transition.in, ease: GALLERY.transition.inEase,
            onComplete: () => {
              animating.current = false
              lenis?.start()  // 切页完成，恢复全局滚动（边界时由滚轮 handler 放行）
            },
          })
        })
      },
    })
  }

  // ── 滚轮滑行（带边界释放，不卡死整页滚动）──
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (animating.current) { e.preventDefault(); return }
      const dir = e.deltaY > 0 ? 1 : -1
      const cur_i = indexRef.current
      if (dir > 0 && cur_i === total - 1) return   // 末项向下 → 放开，滚向下一板块
      if (dir < 0 && cur_i === 0) return          // 首项向上 → 放开，滚回上一板块
      e.preventDefault()
      e.stopPropagation()
      go(dir)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [total])

  // ── 触摸滑动（手机端左右滑动切换项目）──
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    let startX = 0, startY = 0, tracking = false
    const onTouchStart = (e: TouchEvent) => {
      if (animating.current) return
      const t = e.touches[0]
      startX = t.clientX; startY = t.clientY; tracking = true
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      // 水平滑动阈值 60px，且水平位移大于垂直位移的1.5倍（避免与浏览器上下滚动冲突）
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        e.preventDefault()
        go(dx < 0 ? 1 : -1) // 左滑→下一个，右滑→上一个
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [total])

  // 刻度尺跳转到指定项（直接跨步淡入淡出，不做多步滑行）
  const gotoTick = (i: number) => {
    if (i === indexRef.current || animating.current) return
    const stage = stageRef.current
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis
    if (!stage) { setIndex(i); return }
    animating.current = true
    lenis?.stop()
    gsap.to(stage, {
      autoAlpha: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        setIndex(i)
        requestAnimationFrame(() => {
          gsap.fromTo(stage, { autoAlpha: 0 }, {
            autoAlpha: 1, duration: 0.6, ease: 'power3.out',
            onComplete: () => { animating.current = false; lenis?.start() },
          })
        })
      },
    })
  }

  return (
    <section ref={sectionRef} id="cases" className="relative h-screen w-full overflow-hidden bg-paper">
      {/* Flex 全屏居中骨架：确保画框永远几何居中，不受 GSAP transform 干扰 */}
      <div ref={stageRef} className="absolute inset-0 flex items-center justify-center">

        {/* ═══ 中央聚焦画框 ═══ */}
        <div ref={imgRef} className="pointer-events-none relative z-10 will-change-transform">
          {heroSrc && (
            <>
              <img key={`hero-${cur.slug}`} src={heroSrc} alt={cur.title} draggable={false}
                onClick={() => open(items, 0)}
                className="pointer-events-auto block cursor-pointer select-none rounded-[2px] bg-mist h-[54vh] max-w-[96vw] sm:h-[58vh] sm:max-w-[92vw] md:h-[68vh] md:max-w-[88vw]"
                style={{
                  width: 'auto',
                  objectFit: 'contain',
                  boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.32)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
              {/* 底部暗色渐变打底：确保超细白字在任意光影写真上都清透可读 */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[2px]"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 50%)' }}
                aria-hidden="true"
              />
              {/* 标题层级：英文 Syne 先锋宽体铭牌（左下角收纳）/ 中文微型宋体副标题 */}
              <div className="pointer-events-none absolute bottom-0 left-0 flex max-w-full flex-col items-start pb-5 pl-4 pr-3 text-left sm:pb-6 sm:pl-6 md:pb-8 md:pl-8">
                {/* 英文主标题：Syne 先锋宽体 + 字重700 + 极高字距；掩码容器 + 升起行（切页划出） */}
                <div className="overflow-hidden py-1">
                  <h2 className="title-line block break-words font-display text-one uppercase text-base leading-tight sm:text-lg md:text-2xl lg:text-3xl"
                    style={{ fontWeight: 700, letterSpacing: '0.18em',
                      textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}>
                    {cur.en}
                  </h2>
                </div>
                {/* 中文微型铭牌副标题（极细宋体 + 宽字距）；掩码容器 + 升起行 */}
                <div className="mt-1.5 overflow-hidden py-1">
                  <span className="subtitle-line block font-cjk text-one/55"
                    style={{ fontWeight: 300, fontSize: 'clamp(0.7rem, 2.2vw, 0.85rem)', letterSpacing: '0.3em' }}>
                    {cur.title}
                  </span>
                </div>

                {/* 类型标签：极简 mono 短标签，帮客户快速筛选项目类型 */}
                {(TAG_MAP[cur.category] ?? []).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    {(TAG_MAP[cur.category] ?? []).map((t, i, arr) => (
                      <span key={t} className="flex items-center gap-x-1.5">
                        <span
                          className="font-mono uppercase text-khaki/75"
                          style={{ fontWeight: 400, fontSize: '0.52rem', letterSpacing: '0.16em' }}
                        >
                          {t}
                        </span>
                        {i < arr.length - 1 && (
                          <span className="text-one/30" style={{ fontSize: '0.52rem' }}>/</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                <button type="button" onClick={() => open(items, 0)}
                  className="pointer-events-auto mt-4 rounded px-2 py-2 font-mono text-one/60 transition-colors duration-300 hover:text-khaki md:px-0 md:py-0"
                  style={{ fontWeight: 400, letterSpacing: '0.22em', fontSize: 'clamp(0.62rem, 2vw, 0.7rem)' }}>
                  VIEW FULL PROJECT <span aria-hidden className="ml-1">↗</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* ═══ 四角报章元数据（Layer 1，极慢视差）═══ */}
        <div ref={metaRef} className="pointer-events-none absolute inset-0 z-40 will-change-transform">

          {/* 左上：YEAR（随当前案例动态） */}
          <div className="absolute left-[3.5vw] top-[10vh] flex flex-col gap-0.5 md:top-[12vh]">
            <span className="font-mono uppercase text-khaki/70" style={{ fontWeight: 500, letterSpacing: '0.3em', fontSize: 'clamp(0.6rem, 2vw, 0.7rem)' }}>
              Year
            </span>
            <span className="font-mono text-bone/75" style={{ fontWeight: 300, fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>
              {cur.year}
            </span>
          </div>

          {/* 右上：SCROLL（手机端隐藏，改为左右滑动） */}
          <div className="absolute right-[3.5vw] top-[12vh] hidden flex-col items-end gap-0.5 md:flex">
            <span className="font-mono uppercase text-bone/40" style={{ fontWeight: 300, letterSpacing: '0.28em', fontSize: '0.6rem' }}>
              Scroll
            </span>
            <span className="text-bone/40" style={{ fontSize: '0.7rem' }}>↓</span>
          </div>

          {/* 左下：邮箱 */}
          <div className="absolute bottom-[10vh] left-[3.5vw] md:bottom-[7vh]">
            <span className="font-mono text-bone/45" style={{ fontWeight: 300, letterSpacing: '0.12em', fontSize: 'clamp(0.6rem, 2vw, 0.72rem)' }}>
              1019941527@qq.com
            </span>
          </div>

          {/* 右下：地点（随当前案例动态） */}
          <div className="absolute bottom-[10vh] right-[3.5vw] md:bottom-[7vh]">
            <span className="font-mono text-bone/45" style={{ fontWeight: 300, letterSpacing: '0.18em', fontSize: 'clamp(0.6rem, 2vw, 0.72rem)' }}>
              {cur.location}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ 左右极细切换箭头（淡雅版，刻度条激活时淡出避免冲突；手机端上移避开手势条）═══ */}
      <div className={`pointer-events-none absolute bottom-[14vh] left-1/2 z-50 flex -translate-x-1/2 items-center gap-5 transition-opacity duration-300 md:bottom-[7vh] ${dockActive ? 'opacity-0' : 'opacity-100'}`}>
        <button type="button" onClick={() => go(-1)} aria-label="上一个项目"
          className={`flex h-11 w-11 items-center justify-center rounded-full border border-one/15 text-one/40 transition-all duration-500 hover:border-khaki/60 hover:text-khaki/80 md:h-9 md:w-9 ${dockActive ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button type="button" onClick={() => go(1)} aria-label="下一个项目"
          className={`flex h-11 w-11 items-center justify-center rounded-full border border-one/15 text-one/40 transition-all duration-500 hover:border-khaki/60 hover:text-khaki/80 md:h-9 md:w-9 ${dockActive ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ═══ 底部 Dock 风格刻度尺（缩略图预览 + 悬停磁性放大；适配手机安全区）═══ */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-40 w-full" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* 致密垂直细刻度线（装饰轴） */}
        <div
          className="absolute inset-x-0 bottom-0 h-9"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(245,243,239,0.14) 0, rgba(245,243,239,0.14) 1px, transparent 1px, transparent 13px)',
          }}
          aria-hidden
        />
        {/* Dock 缩略图条（默认仅显示长指针+数字，鼠标进入时缩略图从上方升起） */}
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-2 flex items-end justify-between px-[3.5vw]"
          onMouseEnter={() => { setDockActive(true); setThumbsLoaded(true) }}
          onMouseLeave={() => { setDockActive(false); setHoverIndex(-1) }}
        >
          {CASES.map((c, i) => {
            const active = i === index
            const thumb = MANIFEST[c.slug]?.[0]
            const thumbSrc = thumb ? `/photos/${c.slug}/${thumb.f}` : ''
            const dist = hoverIndex >= 0 ? Math.abs(i - hoverIndex) : 999
            const scale = hoverIndex >= 0 ? Math.max(1, 1 + Math.max(0, 1 - dist / 2.5) * 1.4) : 1
            const isHovered = hoverIndex === i
            return (
              <div
                key={c.slug}
                onClick={() => gotoTick(i)}
                onMouseEnter={() => setHoverIndex(i)}
                className="group relative flex flex-1 cursor-pointer flex-col items-center"
              >
                {/* 放大层：仅缩略图+长指针参与 scale，数字不放大 */}
                <div
                  className="relative flex flex-col items-center"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'bottom center',
                    zIndex: isHovered ? 60 : active ? 20 : 1,
                    transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {/* 缩略图（绝对定位不占布局，默认隐藏，dockActive 时从上方滑入；首次进入才加载图片） */}
                  <div
                    className={`pointer-events-none absolute bottom-full mb-1.5 overflow-hidden rounded-sm border transition-all duration-400 ease-out ${active ? 'border-khaki/60' : 'border-one/10'}`}
                    style={{
                      width: '30px',
                      height: '45px',
                      opacity: dockActive ? 1 : 0,
                      transform: dockActive ? 'translateY(0)' : 'translateY(10px)',
                      willChange: 'transform, opacity',
                    }}
                  >
                    {thumbsLoaded && thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt={c.title}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-mist" />
                    )}
                  </div>
                  {/* 长指针刻度线（始终保留，默认6px，激活态12px纯白） */}
                  <span
                    className="relative block w-px origin-bottom transition-all duration-300 ease-out group-hover:-translate-y-0.5"
                    style={{
                      height: active ? '12px' : '6px',
                      background: active ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
                {/* 数字（始终显示，不参与放大） */}
                <span
                  className={`mt-1.5 font-mono tabular-nums transition-colors duration-300 ${active ? 'text-one font-bold' : 'text-one/40 group-hover:text-one'}`}
                  style={{ fontSize: 'clamp(0.55rem, 2vw, 0.65rem)', letterSpacing: '0.05em' }}
                >
                  [ {String(i + 1).padStart(2, '0')} ]
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

type LabelPos = 'below' | 'above' | 'right'

type ProjectCardProps = {
  image: string
  alt: string
  /** Tailwind 比例类，如 'aspect-[3/4]' / 'aspect-[16/10]' / 'aspect-square' */
  ratioClass: string
  /** Tailwind 列宽/对齐类，如 'md:col-span-7' */
  alignClass: string
  /** 纵向错位，如 'md:-mt-[10vh]'（可选） */
  offsetClass?: string
  /** 视差速度系数（≤1，避免露边） */
  speed: number
  index: string
  kicker: string
  title: string
  labelPos: LabelPos
}

/**
 * ProjectCard —— 04 Projects 的无状态子组件
 * 仅负责排版与 DOM 结构，所有 GSAP 动效（视差 + 悬停）由父级 ProjectsSection 统一绑定。
 * 图片容器 .project-media（overflow-hidden）+ 内部 .project-img（h-[130%] top-[-15%]），
 * 预留 ±15% 的溢出余量，配合父级 yPercent:[-10,10] 视差位移时绝不会露边。
 */
export default function ProjectCard({
  image,
  alt,
  ratioClass,
  alignClass,
  offsetClass = '',
  speed,
  index,
  kicker,
  title,
  labelPos,
}: ProjectCardProps) {
  const meta = (
    <div className={labelPos === 'right' ? 'text-right' : ''}>
      <div
        className="text-khaki uppercase"
        style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.7rem' }}
      >
        {index} / {kicker}
      </div>
      <div
        className="mt-3 font-sans uppercase text-bone"
        style={{
          fontWeight: 200,
          letterSpacing: '0.04em',
          fontSize: 'clamp(0.95rem, 1.5vw, 1.25rem)',
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
    </div>
  )

  const media = (
    <div
      className={`project-media relative overflow-hidden bg-[#1b1916] ${ratioClass}`}
      data-speed={speed}
    >
      <img
        src={image}
        alt={alt}
        loading="lazy"
        draggable={false}
        className="project-img absolute left-0 top-[-15%] h-[130%] w-full object-cover"
        style={{ filter: 'brightness(1)' }}
      />
    </div>
  )

  return (
    <article className={`${alignClass} ${offsetClass}`}>
      {labelPos === 'above' && <div className="mb-6">{meta}</div>}
      {media}
      {labelPos === 'below' && <div className="mt-6">{meta}</div>}
      {labelPos === 'right' && (
        <div className="mt-6 flex items-end justify-between gap-8">
          <span className="font-sans uppercase text-khaki" style={{ fontWeight: 300, letterSpacing: '0.3em', fontSize: '0.7rem' }}>
            {index} / {kicker}
          </span>
          <span
            className="max-w-[62%] text-right font-sans uppercase text-bone"
            style={{
              fontWeight: 200,
              letterSpacing: '0.04em',
              fontSize: 'clamp(0.95rem, 1.5vw, 1.25rem)',
              lineHeight: 1.3,
            }}
          >
            {title}
          </span>
        </div>
      )}
    </article>
  )
}

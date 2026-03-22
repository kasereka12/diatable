export default function SectionHeader({ label, title, light = false, centered = true }) {
  return (
    <div className={`mb-14 ${centered ? 'text-center' : ''}`} data-reveal>
      <span className="section-label">{label}</span>
      <h2
        className="section-title"
        style={{ color: light ? '#ffffff' : '#12111a' }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className={`flex items-center gap-4 mt-4 ${centered ? 'justify-center' : ''}`}>
        <div className="flex-1 max-w-[80px] h-px bg-gradient-to-r from-transparent to-[#f4a828]" />
        <div className="w-2 h-2 bg-gold rotate-45 flex-shrink-0" />
        <div className="flex-1 max-w-[80px] h-px bg-gradient-to-l from-transparent to-[#f4a828]" />
      </div>
    </div>
  )
}

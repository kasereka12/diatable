import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PaginationControlsProps {
  page: number // 0-indexed
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function PaginationControls({ page, totalPages, onPageChange, className = '' }: PaginationControlsProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        aria-label="Previous page"
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-black/10 text-dark hover:border-gold hover:text-gold transition-all disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm text-muted">
        {t('common.page_of', { page: page + 1, total: totalPages })}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        aria-label="Next page"
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-black/10 text-dark hover:border-gold hover:text-gold transition-all disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

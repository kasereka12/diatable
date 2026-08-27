import { useTranslation } from 'react-i18next'

// Served straight from public/ — the same file used as the site favicon.
const Logo = '/logo.png'

export default function HomeChefLoader({ fullPage = false }: { fullPage?: boolean }) {
  const { t } = useTranslation()
  return (
    <div
      className={
        fullPage
          ? 'fixed inset-0 z-[300] flex flex-col items-center justify-center'
          : 'flex flex-col items-center justify-center py-28 rounded-3xl'
      }
      style={{ backgroundColor: '#f9f4ee' }}>
      <div className="flex flex-col items-center gap-6">
        <img
          src={Logo}
          alt="DiaTable"
          style={{ width: fullPage ? 160 : 90 }}
          className="h-auto object-contain animate-logo-bob"
        />
        <div className="text-center">
          <p className="font-serif text-lg font-bold" style={{ color: '#1f1f1f' }}>{t('home_chef_page.loading_title')}</p>
          <p className="text-xs tracking-wide" style={{ color: '#80716a' }}>{t('home_chef_page.loading_sub')}</p>
        </div>
      </div>
    </div>
  )
}

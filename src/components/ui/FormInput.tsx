import type { ChangeEvent } from 'react'

interface InputProps {
  label?: string
  type?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function FormInput({ label, type = 'text', value, onChange, placeholder, required, className = '' }: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-dark
                   focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
      />
    </div>
  )
}

interface TextareaProps {
  label?: string
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  required?: boolean
  className?: string
}

export function FormTextarea({ label, value, onChange, placeholder, rows = 3, required, className = '' }: TextareaProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-dark
                   focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all resize-none"
      />
    </div>
  )
}

interface SelectOption { value: string; label: string }

interface SelectProps {
  label?: string
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  options: (SelectOption | string)[]
  required?: boolean
  className?: string
}

export function FormSelect({ label, value, onChange, options, required, className = '' }: SelectProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-dark
                   focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
      >
        {options.map(opt => {
          const v = typeof opt === 'string' ? opt : opt.value
          const l = typeof opt === 'string' ? opt : opt.label
          return <option key={v} value={v}>{l}</option>
        })}
      </select>
    </div>
  )
}

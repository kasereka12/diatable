export function FormInput({ label, type = 'text', value, onChange, placeholder, required, className = '' }) {
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

export function FormTextarea({ label, value, onChange, placeholder, rows = 3, required, className = '' }) {
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

export function FormSelect({ label, value, onChange, options, required, className = '' }) {
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
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  )
}

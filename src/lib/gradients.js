export const GRAD_STYLES = {
  'grad-senegal':   'linear-gradient(135deg,#e8521a,#c8841a 50%,#f4a828)',
  'grad-chinese':   'linear-gradient(135deg,#b71c1c,#e53935)',
  'grad-lebanese':  'linear-gradient(135deg,#1b5e20,#43a047)',
  'grad-syrian':    'linear-gradient(135deg,#4a148c,#7b1fa2)',
  'grad-french':    'linear-gradient(135deg,#0d47a1,#1565c0)',
  'grad-italian':   'linear-gradient(135deg,#c62828,#1b5e20)',
  'grad-nigerian':  'linear-gradient(135deg,#1b5e20,#f9a825)',
  'grad-indian':    'linear-gradient(135deg,#e65100,#fbc02d)',
  'grad-brazilian': 'linear-gradient(135deg,#1b5e20,#0d47a1)',
}

export function getGradient(key) {
  return GRAD_STYLES[key] || 'linear-gradient(135deg,#1a1a2e,#f4a828)'
}

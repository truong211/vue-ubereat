import { format } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return ''
  return format(new Date(date), pattern, { locale: vi })
}

export const formatDateTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'HH:mm - dd/MM/yyyy', { locale: vi })
}

export const formatTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'HH:mm', { locale: vi })
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const inputDate = new Date(date)
  const diffHours = Math.floor((now - inputDate) / (1000 * 60 * 60))

  if (diffHours < 24) {
    return formatTime(date)
  }

  return formatDate(date)
}
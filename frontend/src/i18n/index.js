import { createI18n } from 'vue-i18n'
import en from './en'
import vi from './vi'

const i18n = createI18n({
  legacy: false, // Set to false to use Composition API
  locale: localStorage.getItem('locale') || 'en', // Default locale
  fallbackLocale: 'en', // Fallback locale
  messages: {
    en: en.translations,
    vi: vi.translations
  },
  // Date time formats
  datetimeFormats: {
    en: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    vi: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }
    }
  },
  // Number formats
  numberFormats: {
    en: {
      currency: {
        style: 'currency',
        currency: 'USD'
      }
    },
    vi: {
      currency: {
        style: 'currency',
        currency: 'VND'
      }
    }
  }
})

// Function to change locale
export const setLocale = (locale) => {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  document.querySelector('html').setAttribute('lang', locale)
}

export default i18n
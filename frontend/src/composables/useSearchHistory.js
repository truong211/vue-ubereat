import { ref } from 'vue'

const MAX_HISTORY_ITEMS = 10

export function useSearchHistory(storageKey = 'search_history') {
  const searchHistory = ref(JSON.parse(localStorage.getItem(storageKey) || '[]'))

  const addToHistory = (query) => {
    if (!query.trim()) return

    const history = searchHistory.value
    // Remove if exists (to move it to top)
    const index = history.indexOf(query)
    if (index > -1) {
      history.splice(index, 1)
    }
    
    // Add to beginning
    history.unshift(query)
    
    // Keep only last MAX_HISTORY_ITEMS items
    if (history.length > MAX_HISTORY_ITEMS) {
      history.pop()
    }
    
    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(history))
  }

  const clearHistory = () => {
    searchHistory.value = []
    localStorage.removeItem(storageKey)
  }

  return {
    searchHistory,
    addToHistory,
    clearHistory
  }
}
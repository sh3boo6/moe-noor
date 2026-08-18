import { ref } from 'vue'

export const filterHeaderHasActiveFilters = ref(false)

let _resetFilters: (() => void) | null = null
let _openConfirmClear: (() => void) | null = null

export function setFilterHeaderActions(reset: () => void, openConfirmClear: () => void) {
  _resetFilters = reset
  _openConfirmClear = openConfirmClear
}

export function getFilterHeaderActions() {
  return {
    resetFilters: () => _resetFilters?.(),
    openConfirmClear: () => _openConfirmClear?.()
  }
}

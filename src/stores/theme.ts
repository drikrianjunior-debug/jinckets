import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true)

  function init() {
    const saved = localStorage.getItem('jinckets-theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = !window.matchMedia('(prefers-color-scheme: light)').matches
    }
    apply()
  }

  function apply() {
    if (isDark.value) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
    localStorage.setItem('jinckets-theme', isDark.value ? 'dark' : 'light')
  }

  function toggle() {
    isDark.value = !isDark.value
    apply()
  }

  watch(isDark, apply)

  return { isDark, init, toggle }
})

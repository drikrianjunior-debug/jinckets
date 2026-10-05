<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { Moon, Sun } from 'lucide-vue-next'
import { motion } from 'motion-v'

const theme = useThemeStore()
</script>

<template>
  <motion.button
    class="p-2.5 rounded-xl glass text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-primary)] transition-colors"
    :whileHover="{ scale: 1.1, rotate: 15 }"
    :whileTap="{ scale: 0.9 }"
    @click="theme.toggle()"
    :title="theme.isDark ? 'Mode clair' : 'Mode sombre'"
  >
    <Sun v-if="theme.isDark" :size="18" />
    <Moon v-else :size="18" />
  </motion.button>
</template>

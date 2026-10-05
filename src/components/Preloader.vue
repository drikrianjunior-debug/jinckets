<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { motion } from 'motion-v'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'done'): void }>()

const progress = ref(0)
const ready = ref(false)

onMounted(() => {
  // Preloader court (~0.8s) pour ne pas freiner l'entrée
  const interval = setInterval(() => {
    progress.value += Math.random() * 28 + 12
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(interval)
      setTimeout(() => {
        ready.value = true
        emit('done')
      }, 200)
    }
  }, 80)
})
</script>

<template>
  <motion.div
    v-if="show && !ready"
    class="fixed inset-0 z-[9999] flex flex-col items-center justify-center starry-bg"
    :initial="{ opacity: 1 }"
    :animate="{ opacity: ready ? 0 : 1 }"
    :exit="{ opacity: 0 }"
    :transition="{ duration: 0.5 }"
  >
    <!-- Logo animé -->
    <motion.div
      class="relative mb-10"
      :initial="{ scale: 0.5, opacity: 0, rotate: -20 }"
      :animate="{ scale: 1, opacity: 1, rotate: 0 }"
      :transition="{ type: 'spring', stiffness: 200, damping: 15 }"
    >
      <div class="text-6xl md:text-7xl font-bold gold-gradient tracking-tight" style="font-family: var(--font-space)">
        J'cK
      </div>
      <motion.div
        class="absolute -inset-4 rounded-full border border-[var(--accent)] opacity-40"
        :animate="{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }"
        :transition="{ duration: 2, repeat: Infinity, ease: 'easeInOut' }"
      />
    </motion.div>

    <motion.p
      class="text-[var(--text-secondary)] text-sm tracking-widest uppercase mb-8"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: 0.3 }"
    >
      Jin'ckets
    </motion.p>

    <!-- Progress bar -->
    <div class="w-48 h-1 rounded-full bg-[var(--border)] overflow-hidden">
      <motion.div
        class="h-full bg-gradient-to-r from-[var(--dark-gold)] to-[var(--accent-gold)] rounded-full"
        :style="{ width: `${progress}%` }"
        :transition="{ duration: 0.15 }"
      />
    </div>
    <p class="mt-3 text-xs text-[var(--text-secondary)]">{{ Math.min(100, Math.round(progress)) }}%</p>
  </motion.div>
</template>

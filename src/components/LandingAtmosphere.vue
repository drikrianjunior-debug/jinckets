<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { motion } from 'motion-v'

const theme = useThemeStore()
const { isDark } = storeToRefs(theme)

const stars = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  top: `${(i * 23 + 3) % 85}%`,
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  dur: `${2.5 + (i % 5) * 0.7}s`,
  delay: `${(i % 8) * 0.35}s`,
  gold: i % 7 === 0
}))

const leafColors = ['#c45c26', '#d4a017', '#8b4513', '#e07a3d', '#b8860b', '#cd853f', '#a0522d']
const leaves = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${(i * 9 + 3) % 97}%`,
  size: 12 + (i % 6) * 3,
  duration: `${7 + (i % 8) * 1.2}s`,
  delay: `${-(i % 12) * 0.7}s`,
  drift: -40 + (i % 9) * 14,
  color: leafColors[i % leafColors.length]
}))
</script>

<template>
  <div class="landing-atmosphere" aria-hidden="true">
    <!-- DARK: nuit concert -->
    <template v-if="isDark">
      <div
        class="landing-glow"
        style="bottom: -8%; left: 50%; width: 420px; height: 220px; margin-left: -210px; background: radial-gradient(ellipse, rgba(201,162,39,0.45), transparent 70%); animation-duration: 6s;"
      />
      <div
        class="landing-glow"
        style="top: 15%; left: 10%; width: 180px; height: 180px; background: radial-gradient(circle, rgba(88,40,140,0.5), transparent 70%);"
      />
      <div
        class="landing-glow"
        style="top: 25%; right: 8%; width: 140px; height: 140px; background: radial-gradient(circle, rgba(201,162,39,0.25), transparent 70%); animation-delay: -3s;"
      />

      <span
        v-for="s in stars"
        :key="'s' + s.id"
        class="landing-star"
        :class="{ gold: s.gold }"
        :style="{
          left: s.left,
          top: s.top,
          width: s.size + 'px',
          height: s.size + 'px',
          '--dur': s.dur,
          '--delay': s.delay
        }"
      />

      <motion.div
        class="absolute bottom-0 left-[20%] w-24 h-[55%] origin-bottom opacity-20"
        style="background: linear-gradient(to top, rgba(201,162,39,0.35), transparent); clip-path: polygon(40% 100%, 60% 100%, 100% 0, 0 0);"
        :animate="{ opacity: [0.12, 0.28, 0.12], rotate: [-4, 3, -4] }"
        :transition="{ duration: 7, repeat: Infinity, ease: 'easeInOut' }"
      />
      <motion.div
        class="absolute bottom-0 right-[22%] w-20 h-[50%] origin-bottom opacity-15"
        style="background: linear-gradient(to top, rgba(140,80,220,0.4), transparent); clip-path: polygon(35% 100%, 65% 100%, 100% 0, 0 0);"
        :animate="{ opacity: [0.1, 0.25, 0.1], rotate: [3, -5, 3] }"
        :transition="{ duration: 9, repeat: Infinity, ease: 'easeInOut' }"
      />
    </template>

    <!-- LIGHT: feuilles d'automne -->
    <template v-else>
      <div
        class="landing-glow"
        style="top: -5%; right: -5%; width: 280px; height: 280px; background: radial-gradient(circle, rgba(232,180,80,0.4), transparent 70%);"
      />
      <div
        class="landing-glow"
        style="bottom: 10%; left: -5%; width: 240px; height: 240px; background: radial-gradient(circle, rgba(196,92,38,0.22), transparent 70%); animation-delay: -4s;"
      />

      <span
        v-for="l in leaves"
        :key="'l' + l.id"
        class="landing-leaf"
        :style="{
          left: l.left,
          width: l.size + 'px',
          height: l.size + 'px',
          background: l.color,
          animationDuration: l.duration,
          animationDelay: l.delay,
          // dérive horizontale via animation personnalisée sur chaque feuille
          '--leaf-x': l.drift + 'px'
        }"
      />
    </template>
  </div>
</template>

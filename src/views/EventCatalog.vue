<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '@/stores/events'
import { motion, AnimatePresence } from 'motion-v'
import { ChevronLeft, ChevronRight, MapPin, Calendar, ArrowRight, Pause, Play } from 'lucide-vue-next'

const store = useEventsStore()
const router = useRouter()
const current = ref(0)
const direction = ref(1)
const autoplay = ref(true)
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const events = computed(() => store.approvedEvents)
const event = computed(() => events.value[current.value])

const AUTO_MS = 5500

function next() {
  direction.value = 1
  current.value = (current.value + 1) % events.value.length
}
function prev() {
  direction.value = -1
  current.value = (current.value - 1 + events.value.length) % events.value.length
}
function goTo(i: number) {
  direction.value = i > current.value ? 1 : -1
  current.value = i
  restartTimer()
}
function goToTickets() {
  router.push(`/events/${event.value.id}`)
}

function startTimer() {
  stopTimer()
  if (!autoplay.value || paused.value) return
  timer = setInterval(() => next(), AUTO_MS)
}
function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function restartTimer() {
  startTimer()
}
function togglePause() {
  paused.value = !paused.value
  if (paused.value) stopTimer()
  else startTimer()
}

onMounted(() => startTimer())
onUnmounted(() => stopTimer())

/* Transitions allégées : pas de blur/filter (très coûteux GPU) */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '40%' : '-40%',
    opacity: 0,
    scale: 0.96
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (dir: number) => ({
    x: dir < 0 ? '40%' : '-40%',
    opacity: 0,
    scale: 0.96
  })
}
</script>

<template>
  <div
    class="relative h-screen w-full overflow-hidden bg-[var(--bg-primary)]"
    @mouseenter="paused = true; stopTimer()"
    @mouseleave="paused = false; startTimer()"
  >
    <AnimatePresence :custom="direction" mode="wait">
      <motion.div
        :key="event.id"
        class="absolute inset-0"
        :custom="direction"
        :variants="slideVariants"
        initial="enter"
        animate="center"
        exit="exit"
        :transition="{ type: 'spring', stiffness: 140, damping: 22 }"
      >
        <div class="absolute inset-0">
          <img
            :src="event.image"
            :alt="event.title"
            class="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[rgba(5,5,16,0.55)] to-[rgba(5,5,16,0.25)]" />
          <div class="absolute inset-0 bg-gradient-to-r from-[rgba(5,5,16,0.75)] via-transparent to-transparent" />
        </div>

        <div class="relative h-full flex flex-col justify-end md:justify-center px-12 sm:px-14 md:px-16 lg:px-24 pb-36 md:pb-0 max-w-3xl">
          <motion.div
            :initial="{ opacity: 0, y: 24 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.1, duration: 0.35 }"
          >
            <motion.span
              class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent)] text-[var(--bg-primary)] mb-4"
              :initial="{ scale: 0.6, opacity: 0 }"
              :animate="{ scale: 1, opacity: 1 }"
              :transition="{ delay: 0.25, type: 'spring', stiffness: 300 }"
            >
              {{ event.category }}
            </motion.span>
            <h1 class="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-2" style="font-family: var(--font-space)">
              {{ event.title }}
            </h1>
            <p v-if="event.subtitle" class="text-xl text-[var(--accent)] mb-4">{{ event.subtitle }}</p>
            <p class="text-[var(--text-secondary)] max-w-lg mb-6 line-clamp-3">{{ event.description }}</p>

            <div class="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)] mb-8">
              <span class="flex items-center gap-1.5">
                <Calendar :size="16" class="text-[var(--accent)]" />
                {{ new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
              </span>
              <span class="flex items-center gap-1.5">
                <MapPin :size="16" class="text-[var(--accent)]" />
                {{ event.location }}
              </span>
            </div>

            <motion.button
              class="btn-gold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg inline-flex items-center gap-2"
              :whileHover="{ scale: 1.06, x: 6, rotate: -1 }"
              :whileTap="{ scale: 0.96 }"
              :transition="{ type: 'spring', stiffness: 400, damping: 15 }"
              @click="goToTickets"
            >
              Voir les tickets
              <ArrowRight :size="18" />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>

    <!-- Controls -->
    <button
      class="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
      @click="prev(); restartTimer()"
    >
      <ChevronLeft :size="24" />
    </button>
    <button
      class="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
      @click="next(); restartTimer()"
    >
      <ChevronRight :size="24" />
    </button>

    <div class="absolute bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
      <button
        class="w-8 h-8 rounded-full glass flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)]"
        @click="togglePause"
        :title="paused ? 'Reprendre' : 'Pause'"
      >
        <Pause v-if="!paused" :size="14" />
        <Play v-else :size="14" />
      </button>
      <div class="flex gap-2">
        <button
          v-for="(e, i) in events"
          :key="e.id"
          class="h-2.5 rounded-full transition-all duration-500"
          :class="i === current ? 'bg-[var(--accent)] w-8' : 'bg-white/40 hover:bg-white/70 w-2.5'"
          @click="goTo(i)"
        />
      </div>
    </div>

    <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 text-xs sm:text-sm text-[var(--text-secondary)] font-mono tracking-wider">
      {{ String(current + 1).padStart(2, '0') }} / {{ String(events.length).padStart(2, '0') }}
    </div>
  </div>
</template>

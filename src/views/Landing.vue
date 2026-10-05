<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { motion } from 'motion-v'
import { useRouter } from 'vue-router'
import { initScrollReveals } from '@/composables/useScrollReveal'
import { Calendar, Sparkles, Ticket, ArrowRight } from 'lucide-vue-next'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LandingAtmosphere from '@/components/LandingAtmosphere.vue'

const router = useRouter()

let stopReveals: (() => void) | undefined
onMounted(() => {
  stopReveals = initScrollReveals()
})
onUnmounted(() => stopReveals?.())
</script>

<template>
  <div class="relative min-h-screen starry-bg overflow-x-hidden">
    <!-- Ambiance accueil uniquement -->
    <LandingAtmosphere />

    <!-- Floating theme toggle -->
    <div class="fixed top-6 right-6 z-50">
      <ThemeToggle />
    </div>

    <!-- Hero -->
    <section class="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">

      <motion.div
        class="relative z-10 max-w-3xl"
        :initial="{ opacity: 0, y: 32 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, ease: 'easeOut' }"
      >
        <motion.div
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-[var(--accent)] mb-8"
          :initial="{ opacity: 0, scale: 0.5, rotate: -8 }"
          :animate="{ opacity: 1, scale: 1, rotate: 0 }"
          :transition="{ delay: 0.2, type: 'spring', stiffness: 260, damping: 12 }"
          :whileHover="{ scale: 1.08, rotate: 2 }"
        >
          <Sparkles :size="14" />
          La plateforme tickets la plus vibe
        </motion.div>

        <motion.h1
          class="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-4"
          style="font-family: var(--font-space)"
          :initial="{ opacity: 0, y: 30, scale: 0.9 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :transition="{ delay: 0.15, type: 'spring', stiffness: 120, damping: 12 }"
        >
          <span class="gold-gradient">Jin'ckets</span>
        </motion.h1>
        <motion.p
          class="text-xl md:text-2xl text-[var(--text-secondary)] mb-2 font-light"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ delay: 0.35 }"
        >
          Des soirées. Des festivals. Des souvenirs.
        </motion.p>
        <motion.p
          class="text-[var(--text-secondary)] max-w-lg mx-auto mb-12 opacity-80"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 0.8, y: 0 }"
          :transition="{ delay: 0.45 }"
        >
          Réserve tes tickets en quelques clics, reçois ton QR code instantanément et viens vivre le moment.
        </motion.p>

        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full max-w-md sm:max-w-none mx-auto">
          <motion.button
            class="btn-gold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg flex items-center justify-center gap-2 w-full sm:w-auto"
            :whileHover="{ scale: 1.08, rotate: -1.5 }"
            :whileTap="{ scale: 0.95 }"
            :transition="{ type: 'spring', stiffness: 400, damping: 12 }"
            @click="router.push('/events')"
          >
            <Calendar :size="20" />
            Voir les événements
            <ArrowRight :size="18" />
          </motion.button>
          <motion.button
            class="btn-outline-gold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg flex items-center justify-center gap-2 w-full sm:w-auto"
            :whileHover="{ scale: 1.08, rotate: 1.5 }"
            :whileTap="{ scale: 0.95 }"
            :transition="{ type: 'spring', stiffness: 400, damping: 12 }"
            @click="router.push('/auth')"
          >
            <Ticket :size="20" />
            Connexion
          </motion.button>
        </div>
      </motion.div>


      <!-- Scroll hint -->
      <motion.div
        class="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--text-secondary)] text-xs tracking-widest uppercase"
        :animate="{ y: [0, 8, 0] }"
        :transition="{ duration: 1.5, repeat: Infinity }"
      >
        Scroll
      </motion.div>
    </section>

    <!-- Features strip -->
    <section class="relative py-14 sm:py-24 px-4 sm:px-6">
      <div class="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
        <motion.div
          v-for="(feat, i) in [
            { icon: Ticket, title: 'QR Instantané', desc: 'Ton ticket digital prêt en 2 secondes après commande.' },
            { icon: Sparkles, title: 'Vibes Only', desc: 'Une expérience pensée pour les soirées et festivals.' },
            { icon: Calendar, title: 'WhatsApp Ready', desc: 'Finalise ta commande directement via WhatsApp.' }
          ]"
          :key="feat.title"
          class="glass rounded-3xl p-8 text-center" data-reveal="up" data-reveal-stagger="100"
          :initial="{ opacity: 0, y: 30 }"
          :whileInView="{ opacity: 1, y: 0 }"
          :viewport="{ once: true }"
          :transition="{ delay: i * 0.15 }"
          :whileHover="{ y: -6, transition: { duration: 0.2 } }"
        >
          <div class="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-[rgba(201,162,39,0.15)] text-[var(--accent)]">
            <component :is="feat.icon" :size="26" />
          </div>
          <h3 class="text-lg font-semibold mb-2">{{ feat.title }}</h3>
          <p class="text-sm text-[var(--text-secondary)]">{{ feat.desc }}</p>
        </motion.div>
      </div>
    </section>

    <!-- Devenir organisateur -->
    <section class="py-12 sm:py-16 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 text-center" data-reveal="scale">
        <h2 class="text-2xl md:text-3xl font-bold mb-3" style="font-family: var(--font-space)">
          Tu organises des <span class="gold-gradient">événements</span> ?
        </h2>
        <p class="text-[var(--text-secondary)] mb-6 max-w-lg mx-auto">
          Rejoins Jin'ckets en tant qu'annonciateur : publie tes soirées, vends des tickets numériques ou physiques, signe le contrat en ligne.
        </p>
        <button
          class="btn-gold px-8 py-3.5 rounded-2xl"
          @click="router.push('/become-organizer')"
        >
          Devenir organisateur
        </button>
      </div>
    </section>

    <!-- CTA bottom -->
    <section class="py-14 sm:py-20 px-4 sm:px-6 text-center">
      <div data-reveal="scale">
        <h2 class="text-3xl md:text-4xl font-bold mb-4" style="font-family: var(--font-space)">
          Prêt à <span class="gold-gradient">vibrer</span> ?
        </h2>
        <p class="text-[var(--text-secondary)] mb-8">Rejoins la communauté Jin'ckets dès maintenant.</p>
        <motion.button
          class="btn-gold px-10 py-4 rounded-2xl text-lg"
          :whileHover="{ scale: 1.05 }"
          :whileTap="{ scale: 0.97 }"
          @click="router.push('/events')"
        >
          Explorer les événements
        </motion.button>
      </div>
    </section>

    <footer data-reveal="fade" class="py-8 text-center text-xs text-[var(--text-secondary)] opacity-60">
      © 2026 Jin'ckets — Fait avec ✨ pour les nuits qui comptent
    </footer>
  </div>
</template>

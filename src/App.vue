<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import Preloader from '@/components/Preloader.vue'
import Sidebar from '@/components/Sidebar.vue'
import ScrollRevealHost from '@/components/ScrollRevealHost.vue'

const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()
const showPreloader = ref(true)

onMounted(() => {
  theme.init()
  auth.init()
})

function onPreloaderDone() {
  showPreloader.value = false
}

const hideSidebar = ['landing', 'auth', 'become-organizer', 'forgot-password']
const showSidebar = computed(() => !hideSidebar.includes(route.name as string) && !showPreloader.value)

/** Clé de transition : chemin sans query pour fluidité */
const viewKey = computed(() => route.path)
</script>

<template>
  <Preloader :show="showPreloader" @done="onPreloaderDone" />
  <ScrollRevealHost />

  <div class="min-h-screen flex">
    <Transition name="nav-fade">
      <Sidebar v-if="showSidebar" />
    </Transition>

    <main
      class="flex-1 min-h-screen w-full max-w-[100vw] overflow-x-hidden main-shell"
      :class="showSidebar ? 'md:ml-20 pb-24 md:pb-0' : ''"
    >
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="viewKey" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<style>
/* ── Transitions de page ── */
.page-enter-active {
  transition:
    opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.38s ease;
}
.page-leave-active {
  transition:
    opacity 0.22s cubic-bezier(0.4, 0, 1, 1),
    transform 0.22s cubic-bezier(0.4, 0, 1, 1),
    filter 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(18px) scale(0.985);
  filter: blur(4px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.99);
  filter: blur(2px);
}

/* ── Apparition nav ── */
.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.nav-fade-enter-from,
.nav-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
@media (max-width: 767px) {
  .nav-fade-enter-from,
  .nav-fade-leave-to {
    transform: translateY(16px);
  }
}

.main-shell {
  transition:
    margin 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.35s ease;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active,
  .nav-fade-enter-active,
  .nav-fade-leave-active,
  .main-shell {
    transition-duration: 0.01ms !important;
  }
  .page-enter-from,
  .page-leave-to {
    transform: none;
    filter: none;
  }
}
</style>

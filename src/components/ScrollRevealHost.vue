<script setup lang="ts">
import { watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { initScrollReveals } from '@/composables/useScrollReveal'

const route = useRoute()
let stop: (() => void) | undefined

async function refresh() {
  stop?.()
  await nextTick()
  // léger délai pour laisser le DOM de la page se monter
  requestAnimationFrame(() => {
    stop = initScrollReveals(document)
  })
}

watch(() => route.fullPath, () => refresh(), { immediate: true })
onUnmounted(() => stop?.())
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>

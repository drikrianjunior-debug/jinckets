<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { motion } from 'motion-v'
import { ArrowLeft, KeyRound } from 'lucide-vue-next'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const newPassword = ref('')
const confirm = ref('')
const error = ref('')
const success = ref(false)

async function submit() {
  error.value = ''
  if (newPassword.value !== confirm.value) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }
  const err = await auth.resetPassword(email.value, newPassword.value)
  if (err) {
    error.value = err
    return
  }
  success.value = true
}
</script>

<template>
  <div class="min-h-screen starry-bg flex items-center justify-center px-4 relative">
    <div class="fixed top-6 right-6 z-50"><ThemeToggle /></div>
    <div class="fixed top-6 left-6 z-50">
      <button class="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]" @click="router.push('/auth')">
        <ArrowLeft :size="16" /> Connexion
      </button>
    </div>

    <motion.div
      class="w-full max-w-md glass rounded-3xl p-8"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
    >
      <div class="flex items-center gap-2 mb-6">
        <KeyRound class="text-[var(--accent)]" :size="24" />
        <h1 class="text-xl font-bold">Mot de passe oublié</h1>
      </div>

      <div v-if="success" class="text-center">
        <p class="text-green-400 font-medium mb-4">Mot de passe réinitialisé.</p>
        <router-link to="/auth" class="btn-gold inline-block px-6 py-3 rounded-xl">Se connecter</router-link>
      </div>

      <form v-else @submit.prevent="submit" class="space-y-4">
        <p class="text-sm text-[var(--text-secondary)]">
          Entrez l'email de votre compte et choisissez un nouveau mot de passe.
          <span class="opacity-70">(Mode démo — sans envoi d'email réel.)</span>
        </p>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Email</label>
          <input v-model="email" type="email" required class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Nouveau mot de passe</label>
          <input v-model="newPassword" type="password" required minlength="6" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Confirmer</label>
          <input v-model="confirm" type="password" required class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button type="submit" class="btn-gold w-full py-3.5 rounded-xl">Réinitialiser</button>
      </form>
    </motion.div>
  </div>
</template>

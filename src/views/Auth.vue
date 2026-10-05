<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'
import { motion } from 'motion-v'
import { Mail, Lock, User, Phone, ArrowLeft, Building2 } from 'lucide-vue-next'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isLogin = ref(true)
const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const organizationName = ref('')
const accountType = ref<'client' | 'organizer'>('client')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (isLogin.value) {
      const res = await auth.login(email.value, password.value)
      if (!res.ok) {
        error.value = res.error || 'Connexion impossible'
        return
      }
    } else {
      if (!name.value || !email.value) {
        error.value = 'Nom et email requis'
        return
      }
      if (accountType.value === 'organizer' && !organizationName.value) {
        error.value = 'Nom de la structure requis pour un organisateur'
        return
      }
      const role = accountType.value
      const res = await auth.register(
        name.value,
        email.value,
        phone.value,
        role,
        role === 'organizer' ? organizationName.value : undefined,
        password.value
      )
      if (!res.ok) {
        error.value = res.error || 'Inscription impossible'
        return
      }
    }
    const redirect = (route.query.redirect as string) || auth.homeForRole(auth.user?.role)
    router.push(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen starry-bg flex items-center justify-center px-4 relative">
    <div class="fixed top-6 right-6 z-50"><ThemeToggle /></div>
    <div class="fixed top-6 left-6 z-50">
      <button
        class="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm"
        @click="router.push('/')"
      >
        <ArrowLeft :size="16" /> Accueil
      </button>
    </div>

    <motion.div
      class="w-full max-w-md glass rounded-3xl p-5 sm:p-8 md:p-10"
      :initial="{ opacity: 0, y: 30, scale: 0.95 }"
      :animate="{ opacity: 1, y: 0, scale: 1 }"
      :transition="{ type: 'spring', stiffness: 200, damping: 20 }"
    >
      <div class="text-center mb-8">
        <div class="text-3xl font-bold gold-gradient mb-1" style="font-family: var(--font-space)">J'cK</div>
        <h1 class="text-xl font-semibold">{{ isLogin ? 'Bon retour !' : 'Rejoins Jin\'ckets' }}</h1>
        <p class="text-sm text-[var(--text-secondary)] mt-1">
          {{ isLogin ? 'Connecte-toi pour gérer tes tickets' : 'Client ou organisateur d\'événements' }}
        </p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <!-- Type de compte (inscription) -->
        <div v-if="!isLogin" class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="py-2.5 rounded-xl text-sm border transition-colors"
            :class="accountType === 'client' ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.12)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-secondary)]'"
            @click="accountType = 'client'"
          >
            Client
          </button>
          <button
            type="button"
            class="py-2.5 rounded-xl text-sm border transition-colors"
            :class="accountType === 'organizer' ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.12)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-secondary)]'"
            @click="accountType = 'organizer'"
          >
            Annonciateur
          </button>
        </div>

        <div v-if="!isLogin">
          <label class="block text-xs text-[var(--text-secondary)] mb-1.5">Nom</label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" :size="16" />
            <input
              v-model="name"
              type="text"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none"
              placeholder="Ton prénom / nom"
            />
          </div>
        </div>

        <div v-if="!isLogin && accountType === 'organizer'">
          <label class="block text-xs text-[var(--text-secondary)] mb-1.5">Nom de la structure</label>
          <div class="relative">
            <Building2 class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" :size="16" />
            <input
              v-model="organizationName"
              type="text"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none"
              placeholder="Ex: Kouassi Events CI"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs text-[var(--text-secondary)] mb-1.5">Email</label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" :size="16" />
            <input
              v-model="email"
              type="email"
              required
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none"
              placeholder="toi@email.com" autocomplete="email"
            />
          </div>
        </div>

        <div v-if="!isLogin">
          <label class="block text-xs text-[var(--text-secondary)] mb-1.5">Téléphone WhatsApp</label>
          <div class="relative">
            <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" :size="16" />
            <input
              v-model="phone"
              type="tel"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none"
              placeholder="+225 07 00 00 00 00"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs text-[var(--text-secondary)] mb-1.5">Mot de passe</label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" :size="16" />
            <input
              v-model="password"
              type="password"
              required
              :autocomplete="isLogin ? 'current-password' : 'new-password'"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none"
              placeholder="••••••••"
            />
            <p v-if="!isLogin" class="text-[10px] text-[var(--text-secondary)] mt-1">
              Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
            </p>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{{ error }}</p>

        <motion.button
          type="submit"
          class="btn-gold w-full py-3.5 rounded-xl text-base disabled:opacity-60"
          :disabled="loading"
          :whileHover="{ scale: 1.02 }"
          :whileTap="{ scale: 0.98 }"
        >
          {{ loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire") }}
        </motion.button>
      </form>

      <p v-if="isLogin" class="text-center text-sm mt-4">
        <router-link to="/forgot-password" class="text-[var(--accent)] hover:underline">Mot de passe oublié ?</router-link>
      </p>

      <p class="text-center text-sm text-[var(--text-secondary)] mt-6">
        {{ isLogin ? 'Pas encore de compte ?' : 'Déjà inscrit ?' }}
        <button class="text-[var(--accent)] font-medium hover:underline ml-1" @click="isLogin = !isLogin; error = ''">
          {{ isLogin ? "S'inscrire" : 'Se connecter' }}
        </button>
      </p>

      <div class="mt-6 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-secondary)] text-center space-y-1">
        <p>Admin: <code class="text-[var(--accent)]">admin@jinckets.com</code> / admin123 <span class="opacity-60">(démo)</span></p>
        <p>Client: <code class="text-[var(--accent)]">client@test.com</code> / client123</p>
        <p>Orga: <code class="text-[var(--accent)]">orga@test.com</code> / orga123</p>
      </div>
    </motion.div>
  </div>
</template>

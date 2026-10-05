<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import { User, Lock, Save } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const name = ref(auth.user?.name || '')
const email = ref(auth.user?.email || '')
const phone = ref(auth.user?.phone || '')
const organizationName = ref(auth.user?.organizationName || '')
const profileMsg = ref('')
const profileErr = ref('')

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwdMsg = ref('')
const pwdErr = ref('')

function saveProfile() {
  profileMsg.value = ''
  profileErr.value = ''
  const err = auth.updateProfile({
    name: name.value,
    email: email.value,
    phone: phone.value,
    organizationName: auth.user?.role === 'organizer' ? organizationName.value : undefined
  })
  if (err) profileErr.value = err
  else profileMsg.value = 'Profil mis à jour'
}

async function savePassword() {
  pwdMsg.value = ''
  pwdErr.value = ''
  if (newPassword.value !== confirmPassword.value) {
    pwdErr.value = 'Les mots de passe ne correspondent pas'
    return
  }
  const err = await auth.changePassword(currentPassword.value, newPassword.value)
  if (err) pwdErr.value = err
  else {
    pwdMsg.value = 'Mot de passe modifié'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
}
</script>

<template>
  <div class="min-h-screen page-pad pb-24 md:pb-10 max-w-xl mx-auto w-full">
    <motion.div :initial="{ opacity: 0, y: 16 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="text-3xl font-bold mb-2" style="font-family: var(--font-space)">
        Mon <span class="gold-gradient">profil</span>
      </h1>
      <p class="text-sm text-[var(--text-secondary)] mb-8">
        Rôle : {{ auth.user?.role }}
        <span v-if="auth.user?.organizerStatus === 'pending'" class="text-yellow-400"> · organisateur en attente</span>
      </p>

      <div class="glass rounded-2xl p-6 mb-6 space-y-4" data-reveal="up">
        <h2 class="font-semibold flex items-center gap-2"><User :size="18" /> Informations</h2>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Nom</label>
          <input v-model="name" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Email</label>
          <input v-model="email" type="email" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Téléphone WhatsApp</label>
          <input v-model="phone" type="tel" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div v-if="auth.user?.role === 'organizer'">
          <label class="text-xs text-[var(--text-secondary)]">Structure</label>
          <input v-model="organizationName" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <p v-if="profileErr" class="text-sm text-red-400">{{ profileErr }}</p>
        <p v-if="profileMsg" class="text-sm text-green-400">{{ profileMsg }}</p>
        <button class="btn-gold px-5 py-2.5 rounded-xl flex items-center gap-2" @click="saveProfile">
          <Save :size="16" /> Enregistrer
        </button>
      </div>

      <div class="glass rounded-2xl p-6 space-y-4" data-reveal="up" data-reveal-delay="100ms">
        <h2 class="font-semibold flex items-center gap-2"><Lock :size="18" /> Mot de passe</h2>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Mot de passe actuel</label>
          <input v-model="currentPassword" type="password" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Nouveau mot de passe</label>
          <input v-model="newPassword" type="password" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label class="text-xs text-[var(--text-secondary)]">Confirmer</label>
          <input v-model="confirmPassword" type="password" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>
        <p v-if="pwdErr" class="text-sm text-red-400">{{ pwdErr }}</p>
        <p v-if="pwdMsg" class="text-sm text-green-400">{{ pwdMsg }}</p>
        <button class="btn-outline-gold px-5 py-2.5 rounded-xl" @click="savePassword">Changer le mot de passe</button>
      </div>

      <div v-if="auth.canSwitchMode" class="mt-8 glass rounded-2xl p-5">
        <p class="text-sm font-medium mb-3">Mode actuel : <span class="text-[var(--accent)]">{{ auth.effectiveRole }}</span></p>
        <div class="flex gap-2">
          <button
            class="flex-1 py-2.5 rounded-xl text-sm border"
            :class="auth.effectiveRole === 'client' ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.12)]' : 'border-[var(--border)]'"
            @click="auth.switchMode('client'); router.push('/client')"
          >Mode Client</button>
          <button
            class="flex-1 py-2.5 rounded-xl text-sm border"
            :class="auth.effectiveRole === 'organizer' ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.12)]' : 'border-[var(--border)]'"
            @click="auth.switchMode('organizer'); router.push('/organizer')"
          >Mode Organisateur</button>
        </div>
      </div>

      <p v-if="auth.user?.role === 'client' && auth.user?.organizerStatus !== 'approved'" class="mt-8 text-sm text-[var(--text-secondary)]">
        Envie de vendre des tickets ?
        <router-link to="/become-organizer" class="text-[var(--accent)] hover:underline">Devenir organisateur</router-link>
      </p>
    </motion.div>
  </div>
</template>

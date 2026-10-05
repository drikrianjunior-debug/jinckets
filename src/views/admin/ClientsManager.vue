<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEventsStore } from '@/stores/events'
import type { User } from '@/types'
import { Pencil, X, Save } from 'lucide-vue-next'

const auth = useAuthStore()
const events = useEventsStore()

const realClients = computed(() => auth.mockUsers.filter(u => u.role === 'client'))

const editing = ref<User | null>(null)
const form = ref({ name: '', email: '', phone: '', password: '' })
const msg = ref('')

function orderCount(userId: string) {
  return events.orders.filter(o => o.userId === userId).length
}

function startEdit(u: User) {
  editing.value = u
  form.value = { name: u.name, email: u.email, phone: u.phone || '', password: '' }
  msg.value = ''
}

function save() {
  if (!editing.value) return
  const patch: Partial<User> = {
    name: form.value.name,
    email: form.value.email,
    phone: form.value.phone
  }
  if (form.value.password) patch.password = form.value.password
  const err = auth.adminUpdateUser(editing.value.id, patch)
  msg.value = err || 'Enregistré'
  if (!err) editing.value = null
}
</script>

<template>
  <div class="min-h-screen page-pad pb-24 md:pb-10">
    <h1 class="text-3xl font-bold mb-8" style="font-family: var(--font-space)">Clients</h1>

    <div class="glass rounded-2xl overflow-hidden table-scroll">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-[var(--text-secondary)] border-b border-[var(--border)] bg-[var(--bg-sidebar)]">
            <th class="p-4">Nom</th>
            <th class="p-4">Email</th>
            <th class="p-4">Téléphone</th>
            <th class="p-4">Commandes</th>
            <th class="p-4">Inscrit le</th>
            <th class="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in realClients" :key="c.id" class="border-b border-[var(--border)]/40 hover:bg-[rgba(201,162,39,0.05)]">
            <td class="p-4 font-medium">{{ c.name }}</td>
            <td class="p-4">{{ c.email }}</td>
            <td class="p-4">{{ c.phone || '—' }}</td>
            <td class="p-4">{{ orderCount(c.id) }}</td>
            <td class="p-4 text-[var(--text-secondary)]">{{ new Date(c.createdAt).toLocaleDateString('fr-FR') }}</td>
            <td class="p-4">
              <button class="p-2 rounded-lg hover:bg-[rgba(201,162,39,0.15)] text-[var(--accent)]" @click="startEdit(c)">
                <Pencil :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!realClients.length" class="p-8 text-center text-[var(--text-secondary)]">Aucun client</p>
    </div>

    <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="w-full max-w-md glass rounded-2xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold">Éditer client</h3>
          <button @click="editing = null"><X :size="18" /></button>
        </div>
        <div class="space-y-3">
          <input v-model="form.name" placeholder="Nom" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="form.email" type="email" placeholder="Email" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="form.phone" placeholder="Téléphone" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="form.password" type="password" placeholder="Nouveau mot de passe (optionnel)" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
        </div>
        <p v-if="msg" class="text-sm mt-2" :class="msg === 'Enregistré' ? 'text-green-400' : 'text-red-400'">{{ msg }}</p>
        <button class="btn-gold mt-4 w-full py-2.5 rounded-xl flex items-center justify-center gap-2" @click="save">
          <Save :size="16" /> Sauver
        </button>
      </div>
    </div>
  </div>
</template>

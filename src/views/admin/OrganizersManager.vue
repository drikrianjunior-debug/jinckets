<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEventsStore } from '@/stores/events'
import type { User } from '@/types'
import { Pencil, X, Save, Download } from 'lucide-vue-next'
import { downloadContractPDF } from '@/composables/useContractPDF'

const auth = useAuthStore()
const store = useEventsStore()

const organizers = computed(() =>
  auth.mockUsers.filter(u => u.role === 'organizer' || u.organizerStatus === 'pending')
)
const pending = computed(() => store.pendingEvents)
const pendingOrgs = computed(() => auth.pendingOrganizers)

const editing = ref<User | null>(null)
const form = ref({
  name: '',
  email: '',
  phone: '',
  organizationName: '',
  password: '',
  organizerStatus: 'approved' as string
})
const msg = ref('')

function eventCount(orgId: string) {
  return store.getEventsByOrganizer(orgId).length
}

function downloadOrgContract(o: User) {
  downloadContractPDF({
    name: o.name,
    email: o.email,
    phone: o.phone || '',
    organizationName: o.organizationName || '',
    contractSignature: o.contractSignature || o.name,
    contractSignatureImage: o.contractSignatureImage,
    signedAt: o.contractSignedAt
      ? new Date(o.contractSignedAt).toLocaleString('fr-FR')
      : new Date().toLocaleString('fr-FR')
  })
}

function startEdit(u: User) {
  editing.value = u
  form.value = {
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    organizationName: u.organizationName || '',
    password: '',
    organizerStatus: u.organizerStatus || 'approved'
  }
  msg.value = ''
}

function save() {
  if (!editing.value) return
  const patch: Partial<User> = {
    name: form.value.name,
    email: form.value.email,
    phone: form.value.phone,
    organizationName: form.value.organizationName,
    organizerStatus: form.value.organizerStatus as User['organizerStatus'],
    role: form.value.organizerStatus === 'rejected' ? 'client' : 'organizer'
  }
  if (form.value.password) patch.password = form.value.password
  const err = auth.adminUpdateUser(editing.value.id, patch)
  msg.value = err || 'Enregistré'
  if (!err) editing.value = null
}
</script>

<template>
  <div class="min-h-screen page-pad pb-24 md:pb-10">
    <h1 class="text-3xl font-bold mb-8" style="font-family: var(--font-space)">Organisateurs & validations</h1>

    <h2 class="text-lg font-semibold mb-4">Comptes organisateurs en attente</h2>
    <div class="space-y-3 mb-10">
      <div
        v-for="o in pendingOrgs"
        :key="o.id"
        class="glass rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-3"
      >
        <div>
          <p class="font-semibold">{{ o.name }} · {{ o.organizationName }}</p>
          <p class="text-sm text-[var(--text-secondary)]">
            {{ o.email }} · {{ o.phone }}
            <span v-if="o.contractSignedAt"> · Contrat signé le {{ new Date(o.contractSignedAt).toLocaleDateString('fr-FR') }}</span>
          </p>
          <p v-if="o.idDocumentType" class="text-xs text-[var(--text-secondary)]">Pièce : {{ o.idDocumentType.toUpperCase() }} <span v-if="o.idDocumentFileName">({{ o.idDocumentFileName }})</span></p>
          <img v-if="o.idDocumentImage && o.idDocumentImage.startsWith('data:image')" :src="o.idDocumentImage" alt="Pièce d'identité" class="mt-1 h-16 max-w-[140px] object-contain rounded border border-[var(--border)]" />
          <p v-if="o.contractSignature" class="text-xs italic text-[var(--text-secondary)]">Signataire : {{ o.contractSignature }}</p>
          <img
            v-if="o.contractSignatureImage"
            :src="o.contractSignatureImage"
            alt="Signature manuscrite"
            class="mt-2 h-12 max-w-[200px] object-contain rounded border border-[var(--border)] bg-black/20"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="btn-outline-gold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1" @click="downloadOrgContract(o)">
            <Download :size="14" /> PDF
          </button>
          <button class="btn-gold px-3 py-1.5 rounded-lg text-sm" @click="auth.setOrganizerStatus(o.id, 'approved')">Approuver</button>
          <button class="btn-outline-gold px-3 py-1.5 rounded-lg text-sm" @click="auth.setOrganizerStatus(o.id, 'rejected')">Rejeter</button>
          <button class="p-2 rounded-lg hover:bg-[rgba(201,162,39,0.15)]" @click="startEdit(o)"><Pencil :size="16" /></button>
        </div>
      </div>
      <p v-if="!pendingOrgs.length" class="text-sm text-[var(--text-secondary)]">Aucune candidature en attente.</p>
    </div>

    <h2 class="text-lg font-semibold mb-4">Événements en attente de validation</h2>
    <div class="space-y-3 mb-10">
      <div
        v-for="e in pending"
        :key="e.id"
        class="glass rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-3"
      >
        <div>
          <p class="font-semibold">{{ e.title }}</p>
          <p class="text-sm text-[var(--text-secondary)]">
            {{ e.organizerName }} · {{ e.location }} · {{ new Date(e.date).toLocaleDateString('fr-FR') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="btn-gold px-3 py-1.5 rounded-lg text-sm" @click="store.setEventApproval(e.id, 'approved')">Approuver</button>
          <button class="btn-outline-gold px-3 py-1.5 rounded-lg text-sm" @click="store.setEventApproval(e.id, 'rejected')">Rejeter</button>
        </div>
      </div>
      <p v-if="!pending.length" class="text-sm text-[var(--text-secondary)]">Aucun événement en attente.</p>
    </div>

    <h2 class="text-lg font-semibold mb-4">Liste des organisateurs</h2>
    <div class="glass rounded-2xl overflow-hidden table-scroll">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-[var(--text-secondary)] border-b border-[var(--border)] bg-[var(--bg-sidebar)]">
            <th class="p-4">Nom</th>
            <th class="p-4">Structure</th>
            <th class="p-4">Email</th>
            <th class="p-4">Téléphone</th>
            <th class="p-4">Statut</th>
            <th class="p-4">Événements</th>
            <th class="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in organizers" :key="o.id" class="border-b border-[var(--border)]/40">
            <td class="p-4 font-medium">{{ o.name }}</td>
            <td class="p-4">{{ o.organizationName || '—' }}</td>
            <td class="p-4">{{ o.email }}</td>
            <td class="p-4">{{ o.phone || '—' }}</td>
            <td class="p-4">
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="{
                  'bg-yellow-500/20 text-yellow-400': o.organizerStatus === 'pending',
                  'bg-green-500/20 text-green-400': o.organizerStatus === 'approved',
                  'bg-red-500/20 text-red-400': o.organizerStatus === 'rejected'
                }"
              >{{ o.organizerStatus || '—' }}</span>
            </td>
            <td class="p-4">{{ eventCount(o.id) }}</td>
            <td class="p-4">
              <button class="p-2 rounded-lg hover:bg-[rgba(201,162,39,0.15)] text-[var(--accent)]" @click="startEdit(o)">
                <Pencil :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="w-full max-w-md glass rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold">Éditer organisateur</h3>
          <button @click="editing = null"><X :size="18" /></button>
        </div>
        <div class="space-y-3">
          <input v-model="form.name" placeholder="Nom" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="form.organizationName" placeholder="Structure" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="form.email" type="email" placeholder="Email" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="form.phone" placeholder="Téléphone" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <select v-model="form.organizerStatus" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
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

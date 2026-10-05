<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { motion } from 'motion-v'
import { ArrowLeft, FileSignature, Eraser, Download } from 'lucide-vue-next'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { downloadContractPDF } from '@/composables/useContractPDF'

const router = useRouter()
const auth = useAuthStore()

const name = ref(auth.user?.name || '')
const email = ref(auth.user?.email || '')
const phone = ref(auth.user?.phone || '')
const organizationName = ref(auth.user?.organizationName || '')
const password = ref('')
const contractAccepted = ref(false)
const contractSignature = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)
const hasDrawn = ref(false)
const idDocumentType = ref<'cni' | 'passeport' | ''>('')
const idDocumentImage = ref('')
const idDocumentFileName = ref('')
const idInputRef = ref<HTMLInputElement | null>(null)

const isLoggedClient = computed(() => auth.user?.role === 'client')
const alreadyOrg = computed(() => auth.user?.role === 'organizer')

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false
let lastX = 0
let lastY = 0

function getPos(e: MouseEvent | TouchEvent) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  if ('touches' in e) {
    const t = e.touches[0] || e.changedTouches[0]
    return {
      x: (t.clientX - rect.left) * scaleX,
      y: (t.clientY - rect.top) * scaleY
    }
  }
  return {
    x: ((e as MouseEvent).clientX - rect.left) * scaleX,
    y: ((e as MouseEvent).clientY - rect.top) * scaleY
  }
}

function startDraw(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  if (!ctx || !canvasRef.value) return
  drawing = true
  const p = getPos(e)
  lastX = p.x
  lastY = p.y
}

function draw(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  if (!drawing || !ctx) return
  const p = getPos(e)
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
  lastX = p.x
  lastY = p.y
  hasDrawn.value = true
}

function endDraw(e?: MouseEvent | TouchEvent) {
  e?.preventDefault()
  drawing = false
}

function clearSignature() {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  // fond légèrement teinté
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  hasDrawn.value = false
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  // résolution nette
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth || 400
  const h = 160
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#e8c547'
  clearSignature()
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', initCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', initCanvas)
})

function getSignatureDataUrl(): string | null {
  if (!canvasRef.value || !hasDrawn.value) return null
  return canvasRef.value.toDataURL('image/png')
}

function onIdFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    error.value = 'Fichier accepté : image (JPG/PNG) ou PDF de la CNI / du passeport'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Fichier trop volumineux (max 5 Mo)'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    idDocumentImage.value = String(reader.result || '')
    idDocumentFileName.value = file.name
  }
  reader.readAsDataURL(file)
}

function downloadPdf() {
  if (!hasDrawn.value) {
    error.value = 'Dessinez d\'abord votre signature manuscrite'
    return
  }
  if (!contractSignature.value.trim()) {
    error.value = 'Indiquez le nom du signataire'
    return
  }
  const image = getSignatureDataUrl()
  downloadContractPDF({
    name: name.value,
    email: email.value,
    phone: phone.value,
    organizationName: organizationName.value,
    contractSignature: contractSignature.value,
    contractSignatureImage: image || undefined,
    signedAt: new Date().toLocaleString('fr-FR'),
    idDocumentType: idDocumentType.value || undefined
  })
}

async function submit() {
  error.value = ''
  if (!contractAccepted.value) {
    error.value = 'Vous devez accepter le contrat numérique'
    return
  }
  if (!contractSignature.value.trim()) {
    error.value = 'Indiquez votre nom sous la signature'
    return
  }
  if (!idDocumentType.value || !idDocumentImage.value) {
    error.value = 'Fournissez une pièce d\'identité valide : CNI ou passeport uniquement'
    return
  }
  if (!hasDrawn.value) {
    error.value = 'Dessinez votre signature manuscrite dans le cadre'
    return
  }
  const image = getSignatureDataUrl()
  if (!image) {
    error.value = 'Signature manuscrite invalide'
    return
  }

  loading.value = true
  await new Promise(r => setTimeout(r, 400))

  const err = await auth.applyAsOrganizer({
    name: name.value,
    email: email.value,
    phone: phone.value,
    organizationName: organizationName.value,
    password: password.value || undefined,
    contractSignature: contractSignature.value,
    contractSignatureImage: image,
    idDocumentType: idDocumentType.value as 'cni' | 'passeport',
    idDocumentImage: idDocumentImage.value,
    idDocumentFileName: idDocumentFileName.value
  })
  loading.value = false
  if (err) {
    error.value = err
    return
  }
  success.value = true
  setTimeout(() => router.push('/organizer'), 1800)
}
</script>

<template>
  <div class="min-h-screen starry-bg px-3 sm:px-4 py-10 sm:py-16 relative">
    <div class="fixed top-6 right-6 z-50"><ThemeToggle /></div>
    <div class="fixed top-6 left-6 z-50">
      <button class="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]" @click="router.push('/')">
        <ArrowLeft :size="16" /> Accueil
      </button>
    </div>

    <motion.div
      class="max-w-2xl mx-auto glass rounded-3xl p-4 sm:p-6 md:p-10"
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
    >
      <div class="flex items-center gap-3 mb-6">
        <FileSignature class="text-[var(--accent)]" :size="28" />
        <div>
          <h1 class="text-2xl font-bold" style="font-family: var(--font-space)">Devenir organisateur</h1>
          <p class="text-sm text-[var(--text-secondary)]">Vendez vos tickets sur Jin'ckets — contrat numérique inclus</p>
        </div>
      </div>

      <div v-if="alreadyOrg && auth.user?.organizerStatus === 'approved'" class="text-center py-8">
        <p class="text-[var(--accent)] font-medium">Vous êtes déjà organisateur validé.</p>
        <router-link to="/organizer" class="btn-gold inline-block mt-4 px-6 py-3 rounded-xl">Mon espace</router-link>
      </div>

      <div v-else-if="success" class="text-center py-8">
        <p class="text-lg font-semibold text-green-400 mb-2">Candidature enregistrée ✓</p>
        <p class="text-sm text-[var(--text-secondary)] mb-6">
          Contrat signé avec signature manuscrite. En attente de validation admin.
        </p>
        <button type="button" class="btn-gold px-6 py-3 rounded-xl inline-flex items-center gap-2" @click="downloadPdf">
          <Download :size="18" /> Télécharger le contrat PDF
        </button>
      </div>

      <form v-else @submit.prevent="submit" class="space-y-4">
        <p v-if="isLoggedClient" class="text-sm text-[var(--accent)] bg-[rgba(201,162,39,0.1)] rounded-xl px-4 py-3">
          Connecté en tant que client — votre compte passera organisateur après validation admin.
        </p>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-[var(--text-secondary)]">Nom complet</label>
            <input v-model="name" required class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
          </div>
          <div>
            <label class="text-xs text-[var(--text-secondary)]">Structure / marque</label>
            <input v-model="organizationName" required class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" placeholder="Ex: Night Vibes CI" />
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-[var(--text-secondary)]">Email</label>
            <input v-model="email" type="email" required :disabled="!!auth.user" class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)] disabled:opacity-60" />
          </div>
          <div>
            <label class="text-xs text-[var(--text-secondary)]">WhatsApp</label>
            <input v-model="phone" type="tel" required class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" placeholder="+225 07…" />
          </div>
        </div>

        <div v-if="!auth.user">
          <label class="text-xs text-[var(--text-secondary)]">Mot de passe du compte</label>
          <input v-model="password" type="password" minlength="6" required class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" />
        </div>

        <!-- Contrat -->
        <div class="mt-6">
          <h2 class="font-semibold mb-2">Contrat de partenariat organisateur</h2>
          <div class="h-48 overflow-y-auto text-xs text-[var(--text-secondary)] leading-relaxed p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] space-y-2">
            <p><strong>Jin'ckets — Contrat d'annonciateur d'événements</strong></p>
            <p>1. L'organisateur s'engage à fournir des informations exactes sur ses événements (date, lieu, tarifs, stock).</p>
            <p>2. Les tickets numériques sont générés par la plateforme (+500 XOF de frais format). Les tickets physiques sont gérés via WhatsApp entre client et organisateur.</p>
            <p>3. Jin'ckets peut retenir une commission sur les ventes (conditions détaillées ultérieurement avec le backend).</p>
            <p>4. L'organisateur est responsable du respect de la réglementation ivoirienne applicable aux événements publics.</p>
            <p>5. Les commandes physiques passent par discussion WhatsApp ; les numériques sont confirmées avec QR code.</p>
            <p>6. Jin'ckets se réserve le droit de suspendre un compte en cas de fraude ou d'abus.</p>
            <p>7. En signant ci-dessous (signature manuscrite), l'organisateur accepte ces conditions et autorise Jin'ckets à afficher ses événements après validation admin.</p>
            <p>8. Pour les tickets au format physique : un compte cumulé est effectué à hauteur de <strong>500 XOF par commande</strong>. Le total est facturé à l'organisateur en fin de mois et doit être réglé obligatoirement dans un délai maximum d'<strong>une (1) semaine</strong> après émission de la facture.</p>
            <p>9. Une pièce d'identité valide (<strong>CNI ou passeport uniquement</strong>) doit être fournie avant la signature du présent contrat.</p>
            <p class="pt-2">Contact plateforme : +225 07 59 12 80 35</p>
          </div>
        </div>

        <label class="flex items-start gap-3 text-sm cursor-pointer">
          <input v-model="contractAccepted" type="checkbox" class="mt-1 accent-[var(--accent)]" />
          <span>J'ai lu et j'accepte le contrat de partenariat organisateur Jin'ckets.</span>
        </label>

        <!-- Pièce d'identité -->
        <div class="space-y-3">
          <label class="text-xs text-[var(--text-secondary)]">Pièce d'identité (obligatoire avant signature)</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="py-2.5 rounded-xl text-sm border transition-colors"
              :class="idDocumentType === 'cni' ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.12)] text-[var(--accent)]' : 'border-[var(--border)]'"
              @click="idDocumentType = 'cni'"
            >
              CNI
            </button>
            <button
              type="button"
              class="py-2.5 rounded-xl text-sm border transition-colors"
              :class="idDocumentType === 'passeport' ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.12)] text-[var(--accent)]' : 'border-[var(--border)]'"
              @click="idDocumentType = 'passeport'"
            >
              Passeport
            </button>
          </div>
          <input
            ref="idInputRef"
            type="file"
            accept="image/*,application/pdf"
            class="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[rgba(201,162,39,0.2)] file:text-[var(--accent)]"
            @change="onIdFile"
          />
          <p v-if="idDocumentFileName" class="text-xs text-green-400">Fichier : {{ idDocumentFileName }} ✓</p>
          <img
            v-if="idDocumentImage && idDocumentImage.startsWith('data:image')"
            :src="idDocumentImage"
            alt="Aperçu pièce"
            class="max-h-28 rounded-lg border border-[var(--border)] object-contain"
          />
          <p class="text-[10px] text-[var(--text-secondary)]">Uniquement CNI ou passeport — max 5 Mo (image ou PDF)</p>
        </div>

        <!-- Signature manuscrite -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-[var(--text-secondary)]">Signature manuscrite</label>
            <button
              type="button"
              class="text-xs flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--accent)]"
              @click="clearSignature"
            >
              <Eraser :size="14" /> Effacer
            </button>
          </div>
          <div
            class="rounded-xl border-2 border-dashed border-[var(--border)] overflow-hidden bg-[var(--bg-primary)] touch-none"
            :class="hasDrawn ? 'border-[var(--accent)]' : ''"
          >
            <canvas
              ref="canvasRef"
              class="w-full h-40 cursor-crosshair block"
              style="touch-action: none"
              @mousedown="startDraw"
              @mousemove="draw"
              @mouseup="endDraw"
              @mouseleave="endDraw"
              @touchstart="startDraw"
              @touchmove="draw"
              @touchend="endDraw"
            />
          </div>
          <p class="text-[10px] text-[var(--text-secondary)] mt-1">
            Signez avec la souris ou le doigt dans le cadre {{ hasDrawn ? '✓' : '' }}
          </p>
        </div>

        <div>
          <label class="text-xs text-[var(--text-secondary)]">Nom du signataire (confirmation)</label>
          <input
            v-model="contractSignature"
            required
            class="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
            placeholder="Prénom Nom (comme sur le contrat)"
          />
        </div>

        <p v-if="error" class="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{{ error }}</p>

        <div class="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            class="btn-outline-gold flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2"
            @click="downloadPdf"
          >
            <Download :size="18" /> Télécharger le contrat PDF
          </button>
          <button type="submit" class="btn-gold flex-1 py-3.5 rounded-xl disabled:opacity-50" :disabled="loading">
            {{ loading ? 'Envoi…' : 'Signer & candidater' }}
          </button>
        </div>
      </form>
    </motion.div>
  </div>
</template>

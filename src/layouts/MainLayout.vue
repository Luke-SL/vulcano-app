<template>
  <q-layout view="hHh Lpr lFf" class="vulcano-layout">
    <q-header class="header-bar">
      <q-toolbar class="q-px-md" style="min-height: 40px;">
        <div class="v-label">Vulcano · Controle de Estoque</div>
        <q-space />
        <div class="row items-center q-gutter-md">
          <div class="status-pill">
            <span class="status-dot" />
            Sistema operacional
          </div>
          <div class="v-label font-mono" style="color: var(--v-text);">{{ dataHora }}</div>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above :width="240" class="sidebar" :breakpoint="500">
      <div class="column full-height">
        <div class="q-pa-md">
          <div class="row items-center" style="gap: 10px;">
            <div class="brand-mark flex flex-center">
              <q-icon name="local_fire_department" size="18px" color="white" />
            </div>
            <div>
              <div class="text-weight-medium" style="line-height: 1.1;">Vulcano</div>
              <div class="v-label" style="font-size: 10px;">v1.0_estável</div>
            </div>
          </div>
        </div>

        <q-separator style="background: var(--v-border);" />

        <q-list class="q-pa-sm col">
          <q-item
            v-for="item in menu"
            :key="item.to"
            clickable
            v-ripple
            :to="item.to"
            active-class="nav-item--active"
            class="nav-item q-mb-xs"
          >
            <q-item-section avatar style="min-width: 32px;">
              <q-icon :name="item.icon" size="20px" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>

        <q-separator style="background: var(--v-border);" />

        <q-item class="q-pa-md">
          <q-item-section avatar>
            <q-avatar size="34px" color="grey-9" text-color="white" class="font-mono">
              {{ iniciais }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <div class="text-weight-medium" style="font-size: 13px;">{{ perfil?.nome || sessao?.user?.email }}</div>
            <div class="v-label" style="font-size: 10px;">{{ perfil?.cargo }}</div>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="logout" size="sm" @click="sair" />
          </q-item-section>
        </q-item>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '/src/composables/useAuth'
import { useEstoque } from '/src/composables/useEstoque'

const { perfil, sessao, logout } = useAuth()
const router = useRouter()
const estoque = useEstoque()

const menu = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { label: 'Catálogo', icon: 'inventory_2', to: '/catalogo' },
  { label: 'Entrada de Estoque', icon: 'add_circle_outline', to: '/entrada' },
  { label: 'Saída de Estoque', icon: 'remove_circle_outline', to: '/saida' },
  { label: 'Relatórios', icon: 'bar_chart', to: '/relatorios' },
  { label: 'Movimentações', icon: 'history', to: '/movimentacoes' },
]

const iniciais = computed(() => {
  const nome = perfil.value?.nome || sessao.value?.user?.email || ''
  return nome.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
})

const agora = ref(new Date())
let timer = null

onMounted(() => {
  timer = setInterval(() => { agora.value = new Date() }, 30000)
  estoque.iniciarRealtime()
})
onUnmounted(() => clearInterval(timer))

const dataHora = computed(() => {
  const d = agora.value
  const data = d.toLocaleDateString('pt-BR')
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${data} · ${hora}`
})

async function sair () {
  await logout()
  router.push('/login')
}
</script>

<style scoped>
.vulcano-layout :deep(.q-page-container) {
  background: var(--v-bg);
}

.header-bar {
  background: var(--v-bg);
  border-bottom: 1px solid var(--v-border);
  box-shadow: none;
  color: var(--v-text);
}

.sidebar {
  background: var(--v-surface);
  border-right: 1px solid var(--v-border);
  color: var(--v-text);
}

.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #FF5A1F, #E63946);
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--v-verde);
  background: var(--v-verde-dim);
  border-radius: 6px;
  padding: 4px 10px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--v-verde);
}

.nav-item {
  border-radius: 8px;
  color: var(--v-text-muted);
  font-size: 14px;
}

.nav-item :deep(.q-icon) {
  color: var(--v-text-muted);
}

.nav-item--active {
  background: var(--v-magma-dim);
  color: var(--v-magma);
}

.nav-item--active :deep(.q-icon) {
  color: var(--v-magma);
}
</style>

<template>
  <q-page class="q-pa-lg">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-medium">Movimentações</div>
      <div class="text-body2 q-mt-xs" style="color: var(--v-text-muted);">
        Histórico completo de entradas e saídas de estoque, do mais recente ao mais antigo.
      </div>
    </div>

    <div class="row items-center justify-between q-mb-md" style="gap: 12px;">
      <div class="row q-gutter-xs">
        <q-btn
          v-for="op in opcoesTipo"
          :key="op.value"
          :unelevated="tipoAtivo === op.value"
          :flat="tipoAtivo !== op.value"
          no-caps
          dense
          size="sm"
          class="q-px-md"
          :color="tipoAtivo === op.value ? corDoTipo(op.value) : undefined"
          :class="tipoAtivo !== op.value ? 'filtro-inativo' : ''"
          @click="tipoAtivo = op.value"
        >
          {{ op.label }}
        </q-btn>
      </div>

      <div class="row q-gutter-xs">
        <q-btn
          v-for="cat in ['Todos', ...estoque.categorias.map((c) => c.nome)]"
          :key="cat"
          :unelevated="categoriaAtiva === cat"
          :flat="categoriaAtiva !== cat"
          no-caps
          dense
          size="sm"
          class="q-px-md"
          :color="categoriaAtiva === cat ? 'primary' : undefined"
          :class="categoriaAtiva !== cat ? 'filtro-inativo' : ''"
          @click="categoriaAtiva = cat"
        >
          {{ cat }}
        </q-btn>
      </div>
    </div>

    <div class="v-surface">
      <q-table
        flat
        :rows="itensFiltrados"
        :columns="colunas"
        row-key="id"
        :loading="estoque.carregandoLista"
        :pagination="{ rowsPerPage: 12, sortBy: 'created_at', descending: true }"
        class="v-table cursor-pointer"
        @row-click="(evt, row) => abrirDetalhe(row)"
      >
        <template #body-cell-tipo="props">
          <q-td :props="props">
            <span class="v-chip" :class="props.value === 'entrada' ? 'v-chip--normal' : 'v-chip--critico'">
              {{ props.value === 'entrada' ? 'Entrada' : 'Saída' }}
            </span>
          </q-td>
        </template>

        <template #body-cell-codigo="props">
          <q-td :props="props">
            <span class="font-mono" style="color: var(--v-magma);">{{ props.value }}</span>
          </q-td>
        </template>

        <template #body-cell-qtd="props">
          <q-td :props="props" class="font-mono">
            <span :class="props.row.tipo === 'entrada' ? 'text-positive' : 'text-negative'">
              {{ props.row.tipo === 'entrada' ? '+' : '-' }}{{ format(props.value) }}
            </span>
          </q-td>
        </template>

        <template #body-cell-referencia="props">
          <q-td :props="props">
            <span v-if="props.row.tipo === 'saida'" class="font-mono" style="font-size: 12px;">
              {{ props.row.os }}
            </span>
            <span v-else class="text-body2 ellipsis" style="color: var(--v-text-muted); max-width: 220px; display: inline-block;">
              {{ props.row.observacoes || '—' }}
            </span>
          </q-td>
        </template>

        <template #body-cell-acoes="props">
          <q-td :props="props">
            <q-btn flat dense round icon="chevron_right" size="sm" @click.stop="abrirDetalhe(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEstoque } from '/src/composables/useEstoque'

const estoque = useEstoque()
const router = useRouter()

onMounted(() => {
  estoque.carregarCategorias()
  estoque.carregarMovimentacoesLista()
})

const tipoAtivo = ref('todos')
const categoriaAtiva = ref('Todos')

const opcoesTipo = [
  { label: 'Todas', value: 'todos' },
  { label: 'Entradas', value: 'entrada' },
  { label: 'Saídas', value: 'saida' }
]

function corDoTipo (tipo) {
  if (tipo === 'entrada') return 'positive'
  if (tipo === 'saida') return 'negative'
  return 'primary'
}

const colunas = [
  { name: 'data', label: 'Data', field: 'data', align: 'left' },
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left' },
  { name: 'nomeComponente', label: 'Componente', field: 'nomeComponente', align: 'left' },
  { name: 'categoria', label: 'Categoria', field: 'categoria', align: 'left' },
  { name: 'qtd', label: 'Qtd', field: 'qtd', align: 'right' },
  { name: 'referencia', label: 'OS / Observações', field: 'referencia', align: 'left' },
  { name: 'acoes', label: '', field: 'id', align: 'right' }
]

const itensFiltrados = computed(() => {
  return estoque.movimentacoesLista.filter((m) => {
    const bateTipo = tipoAtivo.value === 'todos' || m.tipo === tipoAtivo.value
    const bateCategoria = categoriaAtiva.value === 'Todos' || m.categoria === categoriaAtiva.value
    return bateTipo && bateCategoria
  })
})

function abrirDetalhe (row) {
  router.push({ name: 'movimentacao-detalhe', params: { id: row.id } })
}

function format (n) {
  return new Intl.NumberFormat('pt-BR').format(n)
}
</script>

<style scoped>
.filtro-inativo {
  color: var(--v-text-muted);
}

.v-table :deep(thead th) {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--v-text-muted);
  background: transparent;
  border-bottom: 1px solid var(--v-border);
}

.v-table :deep(tbody td) {
  border-bottom: 1px solid var(--v-border);
  font-size: 13px;
}

.v-table :deep(tbody tr:hover) {
  background: var(--v-surface-alt);
}

.v-table :deep(.q-table__bottom) {
  background: transparent;
  color: var(--v-text-muted);
  border-top: 1px solid var(--v-border);
}

.v-table {
  background: transparent;
}
</style>

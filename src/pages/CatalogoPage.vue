<template>
  <q-page class="q-pa-lg">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-medium">Catálogo de componentes</div>
      <div class="text-body2 q-mt-xs" style="color: var(--v-text-muted);">
        Pesquise, filtre e controle todos os itens do estoque físico.
      </div>
    </div>

    <div class="row items-center q-mb-md" style="gap: 12px;">
      <q-input
        v-model="busca"
        dense
        filled
        dark
        placeholder="Buscar componentes..."
        class="col-12 col-sm-5"
        style="max-width: 360px;"
      >
        <template #prepend>
          <q-icon name="search" size="18px" />
        </template>
      </q-input>

      <q-space />

      <div class="row q-gutter-xs">
        <q-btn
          v-for="cat in ['Todos', ...(categorias || []).map((c) => c.nome)]"
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
        row-key="codigo"
        :pagination="{ rowsPerPage: 8 }"
        class="v-table"
      >
        <template #body-cell-codigo="props">
          <q-td :props="props">
            <span class="font-mono" style="color: var(--v-magma);">{{ props.value }}</span>
          </q-td>
        </template>

        <template #body-cell-local="props">
          <q-td :props="props">
            <span class="font-mono" style="color: var(--v-text-muted); font-size: 12px;">{{ props.value }}</span>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <span class="v-chip" :class="`v-chip--${props.value}`">
              {{ rotuloStatus(props.value) }}
            </span>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEstoque } from 'src/composables/useEstoque'

const {
  categorias,
  itensComStatus,
  carregarCategorias,
  carregarComponentes
} = useEstoque()

onMounted(() => {
  carregarCategorias()
  carregarComponentes()
})

const busca = ref('')
const categoriaAtiva = ref('Todos')

const colunas = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
  { name: 'nome', label: 'Nome / Modelo', field: 'nome', align: 'left' },
  { name: 'categoria', label: 'Categoria', field: 'categoria', align: 'left', sortable: true },
  { name: 'qtd', label: 'Qtd. local', field: 'qtd', align: 'right', sortable: true, format: (v) => new Intl.NumberFormat('pt-BR').format(v) },
  { name: 'local', label: 'Local', field: 'local', align: 'left' },
  { name: 'minimo', label: 'Mínimo', field: 'minimo', align: 'right' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' }
]

const itensFiltrados = computed(() => {
  const lista = itensComStatus.value || []
  return lista.filter((item) => {
    const bateCategoria = categoriaAtiva.value === 'Todos' || item.categoria === categoriaAtiva.value
    const bateBusca = !busca.value ||
      item.nome.toLowerCase().includes(busca.value.toLowerCase()) ||
      item.codigo.toLowerCase().includes(busca.value.toLowerCase())
    return bateCategoria && bateBusca
  })
})

function rotuloStatus (status) {
  return { normal: 'Normal', baixo: 'Estoque baixo', critico: 'Crítico' }[status]
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

.v-table :deep(.q-table__bottom) {
  background: transparent;
  color: var(--v-text-muted);
  border-top: 1px solid var(--v-border);
}

.v-table {
  background: transparent;
}
</style>

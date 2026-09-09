<template>
  <q-page class="q-pa-lg">
    <div class="row items-start justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-medium">Relatórios & analytics</div>
        <div class="text-body2 q-mt-xs" style="color: var(--v-text-muted);">
          Analise volume de movimentação e saída do estoque.
        </div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn no-caps flat icon="description" label="Exportar PDF" @click="exportar('PDF')" />
        <q-btn no-caps unelevated color="primary" icon="grid_on" label="Exportar CSV" @click="exportar('CSV')" />
      </div>
    </div>

    <div class="text-subtitle2 text-weight-medium q-mb-md">Métricas exportáveis</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-7">
        <div class="v-surface q-pa-lg q-mb-md">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Unidades movimentadas (histórico)</div>

          <div class="chart-bars">
            <div v-for="mes in movimentacaoMensal" :key="mes.mes" class="chart-col">
              <div class="chart-bar-group">
                <div
                  class="chart-bar"
                  :style="{ height: barHeight(mes.entradas + mes.saidas) + 'px', background: 'var(--v-magma)' }"
                />
              </div>
              <div class="v-label q-mt-sm">{{ mes.mes }}</div>
            </div>
          </div>
        </div>

        <div class="v-surface q-pa-lg">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Componentes mais requisitados (este mês)</div>

          <div v-for="item in maisRequisitados" :key="item.codigo" class="requisitado-item">
            <div>
              <span class="text-body2">{{ item.nome }}</span>
              <span class="font-mono" style="color: var(--v-text-muted); font-size: 12px;"> ({{ item.codigo }})</span>
            </div>
            <div class="font-mono text-weight-medium" style="color: var(--v-magma);">{{ format(item.total) }} un</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-5">
        <div class="v-surface q-pa-lg full-height flex flex-center column">
          <div class="text-subtitle2 text-weight-medium self-start q-mb-lg">Distribuição de categorias</div>

          <div class="donut-wrap">
            <svg viewBox="0 0 120 120" width="180" height="180">
              <circle
                v-for="seg in segmentosDonut"
                :key="seg.categoria"
                cx="60" cy="60" r="50"
                fill="none"
                :stroke="seg.cor"
                stroke-width="14"
                :stroke-dasharray="`${seg.comprimento} ${circunferencia - seg.comprimento}`"
                :stroke-dashoffset="seg.offset"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div class="donut-center">
              <div class="text-h5 text-weight-medium font-mono">{{ (categorias || []).length }}</div>
              <div class="v-label" style="font-size: 10px;">Categorias</div>
            </div>
          </div>

          <div class="column full-width q-mt-lg" style="gap: 10px;">
            <div v-for="seg in segmentosDonut" :key="seg.categoria" class="row items-center justify-between">
              <div class="row items-center" style="gap: 8px;">
                <span class="legend-dot" :style="{ background: seg.cor }" />
                <span class="text-body2">{{ seg.categoria }}</span>
              </div>
              <span class="font-mono text-weight-medium">{{ seg.percentual }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useEstoque } from 'src/composables/useEstoque'

const $q = useQuasar()
const {
  movimentacaoMensal,
  movimentacoes,
  categorias,
  componentes,
  carregarTudo
} = useEstoque()

onMounted(() => {
  if (typeof carregarTudo === 'function') carregarTudo()
})

const cores = ['#FF5A1F', '#F2A93B', '#E63946', '#4CAF7D', '#6E8FA8', '#B98CD9']

const maiorValor = computed(() => {
  const lista = movimentacaoMensal.value || []
  const valores = lista.map((m) => (m.entradas || 0) + (m.saidas || 0))
  return valores.length ? Math.max(...valores, 1) : 1
})

function barHeight (valor) {
  return Math.max(8, Math.round(((valor || 0) / maiorValor.value) * 130))
}

const maisRequisitados = computed(() => {
  const totais = {}
  const lista = movimentacoes.value || []
  lista
    .filter((m) => m.tipo === 'saida')
    .forEach((m) => {
      totais[m.codigo] = totais[m.codigo] || { codigo: m.codigo, nome: m.nome, total: 0 }
      totais[m.codigo].total += (m.qtd || 0)
    })
  return Object.values(totais).sort((a, b) => b.total - a.total).slice(0, 5)
})

const circunferencia = 2 * Math.PI * 50

const segmentosDonut = computed(() => {
  const cats = categorias.value || []
  const comps = componentes.value || []

  const totalPorCategoria = cats.map((cat) => ({
    categoria: cat.nome,
    qtd: comps.filter((c) => c.categoria === cat.nome).reduce((s, c) => s + (c.qtd || 0), 0)
  })).filter((c) => c.qtd > 0)

  const total = totalPorCategoria.reduce((s, c) => s + c.qtd, 0)
  if (!total) return []

  let acumulado = 0
  return totalPorCategoria.map((c, i) => {
    const percentual = Math.round((c.qtd / total) * 100)
    const comprimento = (c.qtd / total) * circunferencia
    const offset = -acumulado
    acumulado += comprimento
    return { categoria: c.categoria, percentual, comprimento, offset, cor: cores[i % cores.length] }
  })
})

function format (n) {
  return new Intl.NumberFormat('pt-BR').format(n || 0)
}

function exportar (tipo) {
  $q.notify({
    message: `Exportação em ${tipo} iniciada.`,
    color: 'primary',
    icon: 'download'
  })
}
</script>

<style scoped>
.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 160px;
  padding-top: 12px;
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.chart-bar-group {
  display: flex;
  align-items: flex-end;
  height: 130px;
}

.chart-bar {
  width: 18px;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
}

.requisitado-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--v-border);
}

.requisitado-item:last-child {
  border-bottom: none;
}

.donut-wrap {
  position: relative;
  width: 180px;
  height: 180px;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
</style>

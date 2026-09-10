<template>
  <q-page class="q-pa-lg">
    <div class="row items-start justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-medium">Painel geral</div>
        <div class="text-body2 q-mt-xs" style="color: var(--v-text-muted);">
          Status do inventário de componentes eletrônicos em tempo real.
        </div>
      </div>
    </div>

    <!-- Cards de resumo -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <div class="v-surface q-pa-md full-height">
          <div class="row items-center justify-between">
            <div class="v-label">Total de componentes</div>
            <q-icon name="inventory_2" size="18px" style="color: var(--v-magma);" />
          </div>
          <div class="row items-baseline q-mt-sm" style="gap: 6px;">
            <div class="text-h4 text-weight-medium font-mono">{{ format(estoque.totalUnidades) }}</div>
            <div class="text-caption" style="color: var(--v-text-muted);">unidades</div>
          </div>
          <div class="text-caption q-mt-xs" style="color: var(--v-verde);">
            Distribuídas em {{ estoque.categorias.length }} categorias
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="v-surface q-pa-md full-height">
          <div class="row items-center justify-between">
            <div class="v-label">Estoque baixo</div>
            <q-icon name="warning_amber" size="18px" style="color: var(--v-ambar);" />
          </div>
          <div class="row items-baseline q-mt-sm" style="gap: 6px;">
            <div class="text-h4 text-weight-medium font-mono">{{ estoque.itensEstoqueBaixo.length }}</div>
            <div class="text-caption" style="color: var(--v-text-muted);">itens</div>
          </div>
          <div class="text-caption q-mt-xs" style="color: var(--v-text-muted);">
            Abaixo do mínimo cadastrado
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="v-surface q-pa-md full-height">
          <div class="row items-center justify-between">
            <div class="v-label">Entradas (hoje)</div>
            <q-icon name="south_west" size="18px" style="color: var(--v-verde);" />
          </div>
          <div class="row items-baseline q-mt-sm" style="gap: 6px;">
            <div class="text-h4 text-weight-medium font-mono">{{ format(estoque.entradasHoje) }}</div>
            <div class="text-caption" style="color: var(--v-text-muted);">unidades</div>
          </div>
          <div class="text-caption q-mt-xs" style="color: var(--v-text-muted);">
            Registradas no dia
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="v-surface q-pa-md full-height">
          <div class="row items-center justify-between">
            <div class="v-label">Saídas (hoje)</div>
            <q-icon name="north_east" size="18px" style="color: var(--v-brasa);" />
          </div>
          <div class="row items-baseline q-mt-sm" style="gap: 6px;">
            <div class="text-h4 text-weight-medium font-mono">{{ format(estoque.saidasHoje) }}</div>
            <div class="text-caption" style="color: var(--v-text-muted);">unidades</div>
          </div>
          <div class="text-caption q-mt-xs" style="color: var(--v-text-muted);">
            Retiradas para OS ativas
          </div>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Movimentação -->
      <div class="col-12 col-md-8">
        <div class="v-surface q-pa-md full-height">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-subtitle2 text-weight-medium">Movimentação de estoque (últimos 6 meses)</div>
            <div class="row items-center q-gutter-md">
              <div class="legend-item"><span class="legend-dot" style="background: var(--v-magma);" /> Entradas</div>
              <div class="legend-item"><span class="legend-dot" style="background: var(--v-brasa);" /> Saídas</div>
            </div>
          </div>

          <div class="chart-bars">
            <div v-for="mes in estoque.movimentacaoMensal" :key="mes.mes" class="chart-col">
              <div class="chart-bar-group">
                <div class="chart-bar" :style="{ height: barHeight(mes.entradas) + 'px', background: 'var(--v-magma)' }" />
                <div class="chart-bar" :style="{ height: barHeight(mes.saidas) + 'px', background: 'var(--v-brasa)' }" />
              </div>
              <div class="v-label q-mt-sm">{{ mes.mes }}</div>
            </div>
          </div>
        </div>

        <div class="v-surface q-pa-md q-mt-md">
          <div class="text-subtitle2 text-weight-medium q-mb-sm">Movimentações recentes</div>
          <q-table
            flat
            dense
            :rows="estoque.movimentacoesRecentes"
            :columns="colunasMovimentacoes"
            row-key="codigo"
            hide-bottom
            class="v-table"
          >
            <template #body-cell-codigo="props">
              <q-td :props="props">
                <span class="font-mono" style="color: var(--v-magma);">{{ props.value }}</span>
              </q-td>
            </template>
            <template #body-cell-tipo="props">
              <q-td :props="props">
                <span :class="props.value === 'entrada' ? 'text-positive' : 'text-negative'">
                  {{ props.value === 'entrada' ? 'Entrada' : 'Saída' }}
                </span>
              </q-td>
            </template>
            <template #body-cell-qtd="props">
              <q-td :props="props" class="font-mono">
                <span :class="props.row.tipo === 'entrada' ? 'text-positive' : 'text-negative'">
                  {{ props.row.tipo === 'entrada' ? '+' : '-' }}{{ format(props.value) }}
                </span>
              </q-td>
            </template>
          </q-table>
        </div>
      </div>

      <!-- Alertas -->
      <div class="col-12 col-md-4">
        <div class="v-surface q-pa-md full-height">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Alertas de estoque</div>

          <div v-if="estoque.alertas.length === 0" class="text-body2" style="color: var(--v-text-muted);">
            Nenhum alerta no momento.
          </div>

          <div
            v-for="item in estoque.alertas"
            :key="item.codigo"
            class="alerta-item q-mb-sm"
          >
            <div class="row items-center justify-between">
              <span class="font-mono" style="color: var(--v-magma); font-size: 12px;">{{ item.codigo }}</span>
              <span class="v-chip" :class="item.status === 'critico' ? 'v-chip--critico' : 'v-chip--baixo'">
                {{ item.status === 'critico' ? 'Crítico' : 'Estoque baixo' }}
              </span>
            </div>
            <div class="text-body2 q-mt-xs">{{ item.nome }}</div>
            <div class="text-caption q-mt-xs" style="color: var(--v-text-muted);">
              Atual: <span class="font-mono text-weight-medium" style="color: var(--v-text);">{{ item.qtd }} un</span>
              &nbsp;·&nbsp; Mínimo: {{ item.minimo }} un
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useEstoque } from 'src/composables/useEstoque'

const estoque = useEstoque()

onMounted(() => {
  estoque.carregarTudo()
})

const colunasMovimentacoes = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left' },
  { name: 'nome', label: 'Componente', field: 'nome', align: 'left' },
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
  { name: 'qtd', label: 'Qtd', field: 'qtd', align: 'right' },
  { name: 'data', label: 'Data', field: 'data', align: 'right' }
]

const maiorValor = computed(() => {
  const lista = estoque.movimentacaoMensal || []
  const valores = lista.flatMap((m) => [m.entradas, m.saidas])
  return valores.length ? Math.max(...valores, 1) : 1
})

function barHeight (valor) {
  return Math.max(8, Math.round((valor / maiorValor.value) * 130))
}

function format (n) {
  return new Intl.NumberFormat('pt-BR').format(n || 0)
}
</script>

<style scoped>
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--v-text-muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

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
  gap: 4px;
  height: 130px;
}

.chart-bar {
  width: 14px;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
}

.alerta-item {
  border-bottom: 1px solid var(--v-border);
  padding-bottom: 10px;
}

.alerta-item:last-child {
  border-bottom: none;
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

.v-table :deep(.q-table__bottom),
.v-table :deep(.q-table) {
  background: transparent;
}
</style>

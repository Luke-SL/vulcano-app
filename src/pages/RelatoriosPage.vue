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
        <q-btn
          no-caps flat icon="description" label="Exportar PDF"
          :loading="exportandoPdf" @click="exportarPDF"
        />
        <q-btn
          no-caps unelevated color="primary" icon="grid_on" label="Exportar CSV"
          :loading="exportandoCsv" @click="exportarCSV"
        />
      </div>
    </div>

    <div class="text-subtitle2 text-weight-medium q-mb-md">Métricas exportáveis</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-7">
        <div class="v-surface q-pa-lg q-mb-md">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Unidades movimentadas (histórico)</div>

          <div class="chart-bars">
            <div v-for="mes in estoque.movimentacaoMensal" :key="mes.mes" class="chart-col">
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
              <div class="text-h5 text-weight-medium font-mono">{{ estoque.categorias.length }}</div>
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useEstoque } from 'src/composables/useEstoque'

const $q = useQuasar()

// IMPORTANTE: nunca desestruture propriedades de useEstoque() — isso quebra
// a reatividade, porque o retorno é um objeto reactive(). Sempre acesse via
// "estoque.algumacoisa".
const estoque = useEstoque()

onMounted(() => {
  estoque.carregarTudo()
})

const exportandoPdf = ref(false)
const exportandoCsv = ref(false)

const cores = ['#FF5A1F', '#F2A93B', '#E63946', '#4CAF7D', '#6E8FA8', '#B98CD9']

const maiorValor = computed(() => {
  const lista = estoque.movimentacaoMensal || []
  const valores = lista.map((m) => (m.entradas || 0) + (m.saidas || 0))
  return valores.length ? Math.max(...valores, 1) : 1
})

function barHeight (valor) {
  return Math.max(8, Math.round(((valor || 0) / maiorValor.value) * 130))
}

const maisRequisitados = computed(() => {
  const totais = {}
  const lista = estoque.movimentacoes || []
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
  const cats = estoque.categorias || []
  const comps = estoque.componentes || []

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
    return { categoria: c.categoria, qtd: c.qtd, percentual, comprimento, offset, cor: cores[i % cores.length] }
  })
})

function format (n) {
  return new Intl.NumberFormat('pt-BR').format(n || 0)
}

function dataHojeIso () {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Exportação CSV — separador ";" e BOM UTF-8, formato que o Excel em
// português abre corretamente (com acentos) sem precisar importar manualmente.
// ---------------------------------------------------------------------------
function escaparCSV (valor) {
  const texto = String(valor ?? '')
  if (texto.includes(';') || texto.includes('"') || texto.includes('\n')) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

function paraCSV (linhas, colunas) {
  const cabecalho = colunas.map((c) => c.label).join(';')
  const corpo = linhas
    .map((linha) => colunas.map((c) => escaparCSV(linha[c.field])).join(';'))
    .join('\n')
  return `${cabecalho}\n${corpo}`
}

function baixarArquivo (conteudo, nomeArquivo, tipoMime) {
  const blob = new Blob([conteudo], { type: tipoMime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function exportarCSV () {
  exportandoCsv.value = true

  try {
    await estoque.carregarMovimentacoesLista(1000)

    const colunas = [
      { label: 'Data', field: 'data' },
      { label: 'Tipo', field: 'tipoLabel' },
      { label: 'Código', field: 'codigo' },
      { label: 'Componente', field: 'nome' },
      { label: 'Categoria', field: 'categoria' },
      { label: 'Quantidade', field: 'qtd' },
      { label: 'OS / Observações', field: 'referencia' }
    ]

    const linhas = (estoque.movimentacoesLista || []).map((m) => ({
      ...m,
      tipoLabel: m.tipo === 'entrada' ? 'Entrada' : 'Saída',
      referencia: m.tipo === 'saida' ? m.os : (m.observacoes || '')
    }))

    if (!linhas.length) {
      $q.notify({ message: 'Não há movimentações para exportar.', color: 'warning', icon: 'info' })
      return
    }

    const csv = '\uFEFF' + paraCSV(linhas, colunas)
    baixarArquivo(csv, `vulcano-movimentacoes-${dataHojeIso()}.csv`, 'text/csv;charset=utf-8;')

    $q.notify({ message: 'CSV exportado com sucesso.', color: 'positive', icon: 'check_circle' })
  } catch (e) {
    $q.notify({ message: 'Não foi possível exportar o CSV.', color: 'negative', icon: 'error_outline' })
  } finally {
    exportandoCsv.value = false
  }
}

// ---------------------------------------------------------------------------
// Exportação PDF — resumo (categorias + mais requisitados) em uma folha,
// gerado inteiramente no navegador via jsPDF, sem precisar de backend.
// ---------------------------------------------------------------------------
async function exportarPDF () {
  exportandoPdf.value = true

  try {
    await Promise.all([estoque.carregarCategorias(), estoque.carregarComponentes()])

    const doc = new jsPDF()
    const geradoEm = new Date().toLocaleString('pt-BR')

    doc.setFontSize(18)
    doc.setTextColor(30, 30, 30)
    doc.text('Vulcano — Relatório de Estoque', 14, 18)

    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`Gerado em ${geradoEm}`, 14, 25)

    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)
    doc.text(`Total de componentes cadastrados: ${estoque.componentes.length}`, 14, 34)
    doc.text(`Total de categorias: ${estoque.categorias.length}`, 14, 40)

    autoTable(doc, {
      startY: 48,
      head: [['Categoria', 'Quantidade em estoque', '% do total']],
      body: segmentosDonut.value.map((s) => [s.categoria, format(s.qtd), `${s.percentual}%`]),
      headStyles: { fillColor: [255, 90, 31] },
      styles: { fontSize: 10 }
    })

    const proximaY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 100

    doc.setFontSize(13)
    doc.text('Componentes mais requisitados (últimas saídas)', 14, proximaY)

    autoTable(doc, {
      startY: proximaY + 4,
      head: [['Código', 'Componente', 'Total retirado']],
      body: maisRequisitados.value.map((m) => [m.codigo, m.nome, `${format(m.total)} un`]),
      headStyles: { fillColor: [255, 90, 31] },
      styles: { fontSize: 10 }
    })

    doc.save(`vulcano-relatorio-${dataHojeIso()}.pdf`)

    $q.notify({ message: 'PDF exportado com sucesso.', color: 'positive', icon: 'check_circle' })
  } catch (e) {
    $q.notify({ message: 'Não foi possível exportar o PDF.', color: 'negative', icon: 'error_outline' })
  } finally {
    exportandoPdf.value = false
  }
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

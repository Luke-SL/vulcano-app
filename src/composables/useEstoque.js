import { ref, computed } from 'vue'
import { supabase } from 'boot/supabase'
import { useAuth } from './useAuth'

const componentes = ref([])
const categorias = ref([])
const movimentacoes = ref([])
const movimentacaoMensal = ref([])
const carregando = ref(false)
const erro = ref('')

let canalRealtime = null

function statusDe (item) {
  if (item.qtd <= item.minimo * 0.3) return 'critico'
  if (item.qtd <= item.minimo) return 'baixo'
  return 'normal'
}

function traduzirErroEstoque (error) {
  if (error?.message?.includes('Estoque insuficiente')) return error.message
  return error?.message || 'Não foi possível concluir a operação.'
}

export function useEstoque () {
  const { sessao } = useAuth()

  const itensComStatus = computed(() =>
    componentes.value.map((c) => ({ ...c, status: statusDe(c) }))
  )

  const itensEstoqueBaixo = computed(() =>
    itensComStatus.value.filter((c) => c.status !== 'normal')
  )

  const alertas = computed(() =>
    itensEstoqueBaixo.value.slice().sort((a, b) => (a.status === 'critico' ? -1 : 1))
  )

  const totalUnidades = computed(() =>
    componentes.value.reduce((soma, c) => soma + c.qtd, 0)
  )

  const movimentacoesRecentes = computed(() => movimentacoes.value.slice(0, 6))

  const entradasHoje = computed(() =>
    movimentacoes.value
      .filter((m) => m.tipo === 'entrada' && m.data === 'Hoje')
      .reduce((soma, m) => soma + m.qtd, 0)
  )

  const saidasHoje = computed(() =>
    movimentacoes.value
      .filter((m) => m.tipo === 'saida' && m.data === 'Hoje')
      .reduce((soma, m) => soma + m.qtd, 0)
  )

  async function carregarCategorias () {
    const { data, error: err } = await supabase
      .from('categorias')
      .select('id, nome')
      .order('nome')

    if (err) { erro.value = err.message; return }
    categorias.value = data
  }

  async function carregarComponentes () {
    carregando.value = true

    const { data, error: err } = await supabase
      .from('componentes')
      .select('id, codigo, nome, qtd, local, minimo, categorias ( nome )')
      .order('nome')

    carregando.value = false

    if (err) { erro.value = err.message; return }

    componentes.value = data.map((c) => ({
      ...c,
      categoria: c.categorias?.nome ?? 'Sem categoria'
    }))
  }

  async function carregarMovimentacoes (limite = 20) {
    const { data, error: err } = await supabase
      .from('movimentacoes')
      .select('id, tipo, qtd, os, observacoes, data_movimento, created_at, componentes ( codigo, nome )')
      .order('created_at', { ascending: false })
      .limit(limite)

    if (err) { erro.value = err.message; return }

    movimentacoes.value = data.map((m) => ({
      ...m,
      codigo: m.componentes?.codigo,
      nome: m.componentes?.nome,
      data: formatarData(m.data_movimento)
    }))
  }

  async function carregarMovimentacaoMensal () {
    const seiseMesesAtras = new Date()
    seiseMesesAtras.setMonth(seiseMesesAtras.getMonth() - 5)
    seiseMesesAtras.setDate(1)

    const { data, error: err } = await supabase
      .from('movimentacoes')
      .select('tipo, qtd, data_movimento')
      .gte('data_movimento', seiseMesesAtras.toISOString().slice(0, 10))

    if (err) { erro.value = err.message; return }

    const baldes = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      baldes.push({
        chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        entradas: 0,
        saidas: 0
      })
    }

    data.forEach((m) => {
      const chave = m.data_movimento.slice(0, 7)
      const balde = baldes.find((b) => b.chave === chave)
      if (!balde) return
      if (m.tipo === 'entrada') balde.entradas += m.qtd
      else balde.saidas += m.qtd
    })

    movimentacaoMensal.value = baldes
  }

  async function carregarTudo () {
    await Promise.all([
      carregarCategorias(),
      carregarComponentes(),
      carregarMovimentacoes(),
      carregarMovimentacaoMensal()
    ])
    iniciarRealtime()
  }

  function iniciarRealtime () {
    if (canalRealtime) return

    canalRealtime = supabase
      .channel('vulcano-estoque')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'componentes' },
        () => carregarComponentes()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'movimentacoes' },
        () => {
          carregarMovimentacoes()
          carregarMovimentacaoMensal()
        }
      )
      .subscribe()
  }

  async function registrarEntrada ({ componenteId, qtd, data, observacoes }) {
    const { error: err } = await supabase.from('movimentacoes').insert({
      componente_id: componenteId,
      tipo: 'entrada',
      qtd,
      observacoes: observacoes || null,
      data_movimento: data || undefined,
      operador_id: sessao.value?.user?.id
    })

    if (err) return { ok: false, mensagem: traduzirErroEstoque(err) }

    await Promise.all([carregarComponentes(), carregarMovimentacoes(), carregarMovimentacaoMensal()])
    return { ok: true }
  }

  async function registrarSaida ({ componenteId, qtd, os, data }) {
    const { error: err } = await supabase.from('movimentacoes').insert({
      componente_id: componenteId,
      tipo: 'saida',
      qtd,
      os,
      data_movimento: data || undefined,
      operador_id: sessao.value?.user?.id
    })

    if (err) return { ok: false, mensagem: traduzirErroEstoque(err) }

    await Promise.all([carregarComponentes(), carregarMovimentacoes(), carregarMovimentacaoMensal()])
    return { ok: true }
  }

  return {
    componentes,
    categorias,
    movimentacoes,
    movimentacaoMensal,
    carregando,
    erro,
    itensComStatus,
    itensEstoqueBaixo,
    alertas,
    totalUnidades,
    movimentacoesRecentes,
    entradasHoje,
    saidasHoje,
    carregarTudo,
    carregarComponentes,
    carregarCategorias,
    carregarMovimentacoes,
    carregarMovimentacaoMensal,
    iniciarRealtime,
    registrarEntrada,
    registrarSaida
  }
}

function formatarData (dataIso) {
  const hoje = new Date().toISOString().slice(0, 10)
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (dataIso === hoje) return 'Hoje'
  if (dataIso === ontem) return 'Ontem'
  return new Date(dataIso + 'T00:00:00').toLocaleDateString('pt-BR')
}

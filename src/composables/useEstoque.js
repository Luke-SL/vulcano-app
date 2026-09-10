import { ref, reactive, computed } from 'vue'
import { supabase } from 'boot/supabase'
import { useAuth } from './useAuth'

const componentes = ref([])
const categorias = ref([])
const movimentacoes = ref([])
const movimentacaoMensal = ref([])
const movimentacoesLista = ref([])
const carregando = ref(false)
const carregandoLista = ref(false)
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

// Converte DD/MM/AAAA para YYYY-MM-DD (para enviar ao Supabase)
export function converterParaIso (dataBr) {
  if (!dataBr || dataBr.length !== 10) return undefined
  const [dia, mes, ano] = dataBr.split('/')
  if (!dia || !mes || !ano) return undefined
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

// Converte YYYY-MM-DD para DD/MM/AAAA
export function isoParaBr (dataIso) {
  if (!dataIso) return ''
  const dataApenas = dataIso.slice(0, 10)
  const partes = dataApenas.split('-')
  if (partes.length === 3) {
    const [ano, mes, dia] = partes
    return `${dia}/${mes}/${ano}`
  }
  return dataIso
}

// Retorna a data atual formatada como DD/MM/AAAA
export function hojeBr () {
  const hoje = new Date()
  const dia = String(hoje.getDate()).padStart(2, '0')
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const ano = hoje.getFullYear()
  return `${dia}/${mes}/${ano}`
}

// Formatação amigável ("Hoje", "Ontem" ou "DD/MM/AAAA")
export function formatarData (dataIso) {
  if (!dataIso) return '—'
  const dataApenas = dataIso.slice(0, 10)

  const hoje = new Date().toISOString().slice(0, 10)
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (dataApenas === hoje) return 'Hoje'
  if (dataApenas === ontem) return 'Ontem'

  return isoParaBr(dataApenas)
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
    componentes.value.reduce((soma, c) => soma + (c.qtd || 0), 0)
  )

  const movimentacoesRecentes = computed(() => movimentacoes.value.slice(0, 6))

  const entradasHoje = computed(() =>
    movimentacoes.value
      .filter((m) => m.tipo === 'entrada' && m.data === 'Hoje')
      .reduce((soma, m) => soma + (m.qtd || 0), 0)
  )

  const saidasHoje = computed(() =>
    movimentacoes.value
      .filter((m) => m.tipo === 'saida' && m.data === 'Hoje')
      .reduce((soma, m) => soma + (m.qtd || 0), 0)
  )

  async function carregarCategorias () {
    const { data, error: err } = await supabase
      .from('categorias')
      .select('id, nome')
      .order('nome')

    if (err) { erro.value = err.message; return }
    categorias.value = data || []
  }

  async function carregarComponentes () {
    carregando.value = true

    const { data, error: err } = await supabase
      .from('componentes')
      .select('id, codigo, nome, qtd, local, minimo, categorias ( nome )')
      .order('nome')

    carregando.value = false

    if (err) { erro.value = err.message; return }

    componentes.value = (data || []).map((c) => ({
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

    movimentacoes.value = (data || []).map((m) => ({
      ...m,
      codigo: m.componentes?.codigo,
      nome: m.componentes?.nome,
      data: formatarData(m.data_movimento),
      dataBr: isoParaBr(m.data_movimento)
    }))
  }

  async function carregarMovimentacoesLista (limite = 200) {
    carregandoLista.value = true

    const { data, error: err } = await supabase
      .from('movimentacoes')
      .select(`
        id, tipo, qtd, os, observacoes, data_movimento, created_at, componente_id,
        componentes ( codigo, nome, categorias ( nome ) )
      `)
      .order('created_at', { ascending: false })
      .limit(limite)

    carregandoLista.value = false

    if (err) { erro.value = err.message; return }

    movimentacoesLista.value = (data || []).map((m) => ({
      ...m,
      codigo: m.componentes?.codigo,
      nome: m.componentes?.nome,
      categoria: m.componentes?.categorias?.nome ?? 'Sem categoria',
      data: formatarData(m.data_movimento),
      dataBr: isoParaBr(m.data_movimento)
    }))
  }

  async function buscarMovimentacaoPorId (id) {
    const { data, error: err } = await supabase
      .from('movimentacoes')
      .select(`
        id, tipo, qtd, os, observacoes, data_movimento, created_at, componente_id, operador_id,
        componentes ( codigo, nome, local, categorias ( nome ) )
      `)
      .eq('id', id)
      .single()

    if (err || !data) return null

    let operadorNome = null
    if (data.operador_id) {
      const { data: perfilOperador } = await supabase
        .from('perfis')
        .select('nome')
        .eq('id', data.operador_id)
        .single()
      operadorNome = perfilOperador?.nome ?? null
    }

    return {
      ...data,
      codigo: data.componentes?.codigo,
      nome: data.componentes?.nome,
      local: data.componentes?.local,
      categoria: data.componentes?.categorias?.nome ?? 'Sem categoria',
      operadorNome,
      dataFormatada: formatarData(data.data_movimento),
      dataBr: isoParaBr(data.data_movimento)
    }
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

    (data || []).forEach((m) => {
      if (!m.data_movimento) return
      const chave = m.data_movimento.slice(0, 7)
      const balde = baldes.find((b) => b.chave === chave)
      if (!balde) return
      if (m.tipo === 'entrada') balde.entradas += (m.qtd || 0)
      else balde.saidas += (m.qtd || 0)
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
    const dataFormatada = converterParaIso(data) || new Date().toISOString().slice(0, 10)

    const { error: err } = await supabase.from('movimentacoes').insert({
      componente_id: componenteId,
      tipo: 'entrada',
      qtd,
      observacoes: observacoes || null,
      data_movimento: dataFormatada,
      operador_id: sessao.value?.user?.id
    })

    if (err) return { ok: false, mensagem: traduzirErroEstoque(err) }

    await Promise.all([carregarComponentes(), carregarMovimentacoes(), carregarMovimentacaoMensal()])
    return { ok: true }
  }

  async function registrarSaida ({ componenteId, qtd, os, data }) {
    const dataFormatada = converterParaIso(data) || new Date().toISOString().slice(0, 10)

    const { error: err } = await supabase.from('movimentacoes').insert({
      componente_id: componenteId,
      tipo: 'saida',
      qtd,
      os,
      data_movimento: dataFormatada,
      operador_id: sessao.value?.user?.id
    })

    if (err) return { ok: false, mensagem: traduzirErroEstoque(err) }

    await Promise.all([carregarComponentes(), carregarMovimentacoes(), carregarMovimentacaoMensal()])
    return { ok: true }
  }

  return reactive({
    componentes,
    categorias,
    movimentacoes,
    movimentacaoMensal,
    movimentacoesLista,
    carregando,
    carregandoLista,
    erro,
    itensComStatus,
    itensEstoqueBaixo,
    alertas,
    totalUnidades,
    movimentacoesRecentes,
    entradasHoje,
    saidasHoje,
    converterParaIso,
    isoParaBr,
    hojeBr,
    formatarData,
    carregarTudo,
    carregarComponentes,
    carregarCategorias,
    carregarMovimentacoes,
    carregarMovimentacoesLista,
    buscarMovimentacaoPorId,
    carregarMovimentacaoMensal,
    iniciarRealtime,
    registrarEntrada,
    registrarSaida
  })
}

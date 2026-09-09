import { defineStore } from 'pinia'

// Dados de exemplo — troque pelas chamadas à sua API/Supabase.
const COMPONENTES_INICIAIS = [
  { codigo: 'RES-10K-0603', nome: 'Resistor SMD 10K 1/10W 0603', categoria: 'Resistores', qtd: 14500, local: 'GAVETA_A3', minimo: 1000 },
  { codigo: 'CAP-100U-25V', nome: 'Capacitor Eletrolítico 100uF 25V', categoria: 'Capacitores', qtd: 450, local: 'GAVETA_B2', minimo: 100 },
  { codigo: 'IC-NE555-DIP8', nome: 'CI Temporizador NE555 DIP-8', categoria: 'CIs', qtd: 720, local: 'ESTANTE_C1', minimo: 50 },
  { codigo: 'LED-5MM-GRN', nome: 'LED Difuso Verde 5mm', categoria: 'LEDs', qtd: 1800, local: 'GAVETA_A8', minimo: 200 },
  { codigo: 'TRANS-BC547-TO92', nome: 'Transistor NPN BC547 TO-92', categoria: 'Transistores', qtd: 95, local: 'GAVETA_A10', minimo: 100 },
  { codigo: 'IC-ATMEGA328-PU', nome: 'Microcontrolador ATmega328P-PU', categoria: 'CIs', qtd: 12, local: 'ESTANTE_C3', minimo: 20 },
  { codigo: 'MCU-STM32F103', nome: 'Microcontrolador STM32F103C8T6', categoria: 'CIs', qtd: 3, local: 'ESTANTE_C4', minimo: 50 },
  { codigo: 'REG-LM7805-TO220', nome: 'Regulador de Tensão 5V LM7805', categoria: 'CIs', qtd: 12, local: 'GAVETA_B5', minimo: 100 },
  { codigo: 'DIOD-1N4007', nome: 'Diodo Retificador 1N4007', categoria: 'Diodos', qtd: 45, local: 'GAVETA_A6', minimo: 200 }
]

const MOVIMENTACOES_INICIAIS = [
  { codigo: 'IC-NE555-DIP8', nome: 'CI NE555 Temporizador DIP-8', tipo: 'entrada', qtd: 500, data: 'Hoje' },
  { codigo: 'RES-10K-0603', nome: 'Resistor SMD 10K 1/10W 0603', tipo: 'saida', qtd: 1200, data: 'Hoje', os: 'OS-2026-0142' },
  { codigo: 'CAP-100U-25V', nome: 'Capacitor Eletrolítico 100uF', tipo: 'entrada', qtd: 300, data: 'Ontem' },
  { codigo: 'LED-5MM-GRN', nome: 'LED Difuso Verde 5mm', tipo: 'saida', qtd: 150, data: 'Ontem', os: 'OS-2026-0141' }
]

// Volume total movimentado (entradas x saídas) últimos 6 meses — para o gráfico
const MOVIMENTACAO_MENSAL = [
  { mes: 'Mai', entradas: 3200, saidas: 2400 },
  { mes: 'Jun', entradas: 5100, saidas: 3900 },
  { mes: 'Jul', entradas: 4600, saidas: 4100 },
  { mes: 'Ago', entradas: 3800, saidas: 3300 },
  { mes: 'Set', entradas: 4700, saidas: 4500 },
  { mes: 'Out', entradas: 4300, saidas: 4200 }
]

function statusDe (item) {
  if (item.qtd <= item.minimo * 0.3) return 'critico'
  if (item.qtd <= item.minimo) return 'baixo'
  return 'normal'
}

export const useEstoqueStore = defineStore('estoque', {
  state: () => ({
    componentes: COMPONENTES_INICIAIS.map((c) => ({ ...c })),
    movimentacoes: MOVIMENTACOES_INICIAIS.map((m) => ({ ...m })),
    movimentacaoMensal: MOVIMENTACAO_MENSAL
  }),

  getters: {
    categorias: (state) => [...new Set(state.componentes.map((c) => c.categoria))],

    totalUnidades: (state) => state.componentes.reduce((soma, c) => soma + c.qtd, 0),

    itensComStatus: (state) => state.componentes.map((c) => ({ ...c, status: statusDe(c) })),

    itensEstoqueBaixo () {
      return this.itensComStatus.filter((c) => c.status !== 'normal')
    },

    alertas () {
      return this.itensEstoqueBaixo
        .slice()
        .sort((a, b) => (a.status === 'critico' ? -1 : 1))
    },

    movimentacoesRecentes: (state) => state.movimentacoes.slice(0, 6)
  },

  actions: {
    registrarEntrada ({ codigo, qtd, data, observacoes }) {
      const item = this.componentes.find((c) => c.codigo === codigo)
      if (!item) return

      item.qtd += qtd
      this.movimentacoes.unshift({
        codigo: item.codigo,
        nome: item.nome,
        tipo: 'entrada',
        qtd,
        data: data || 'Hoje',
        observacoes: observacoes || ''
      })
    },

    registrarSaida ({ codigo, qtd, os, operador, data }) {
      const item = this.componentes.find((c) => c.codigo === codigo)
      if (!item) return

      item.qtd = Math.max(0, item.qtd - qtd)
      this.movimentacoes.unshift({
        codigo: item.codigo,
        nome: item.nome,
        tipo: 'saida',
        qtd,
        data: data || 'Hoje',
        os,
        operador
      })
    }
  }
})

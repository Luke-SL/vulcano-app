<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-lg" style="gap: 10px;">
      <q-btn flat dense round icon="arrow_back" @click="$router.push('/movimentacoes')" />
      <div>
        <div class="text-h5 text-weight-medium">Detalhe da movimentação</div>
        <div class="text-body2 q-mt-xs" style="color: var(--v-text-muted);">
          Informações completas do lançamento selecionado.
        </div>
      </div>
    </div>

    <div v-if="carregando" class="v-surface q-pa-xl flex flex-center">
      <q-spinner color="primary" size="32px" />
    </div>

    <div v-else-if="!mov" class="v-surface q-pa-xl text-center">
      <q-icon name="search_off" size="32px" style="color: var(--v-text-muted);" />
      <div class="text-body1 q-mt-sm">Movimentação não encontrada.</div>
      <q-btn no-caps flat color="primary" label="Voltar para movimentações" class="q-mt-md" to="/movimentacoes" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <div class="v-surface q-pa-lg">
          <div class="row items-center justify-between q-mb-lg">
            <span class="v-chip" :class="mov.tipo === 'entrada' ? 'v-chip--normal' : 'v-chip--critico'" style="font-size: 13px; padding: 6px 14px;">
              {{ mov.tipo === 'entrada' ? 'Entrada de estoque' : 'Saída de estoque' }}
            </span>
            <div class="v-label">{{ mov.dataFormatada }}</div>
          </div>

          <div class="v-label">Componente alvo</div>
          <div class="text-h6 text-weight-medium q-mt-xs">{{ mov.nomeComponente }}</div>
          <div class="row items-center q-mt-xs" style="gap: 10px;">
            <span class="font-mono" style="color: var(--v-magma); font-size: 13px;">{{ mov.codigo }}</span>
            <span class="text-caption" style="color: var(--v-text-muted);">{{ mov.categoria }}</span>
            <span v-if="mov.local" class="font-mono" style="color: var(--v-text-muted); font-size: 12px;">{{ mov.local }}</span>
          </div>

          <q-separator style="background: var(--v-border);" class="q-my-lg" />

          <div class="row q-col-gutter-lg">
            <div class="col-6 col-sm-4">
              <div class="v-label">{{ mov.tipo === 'entrada' ? 'Quantidade recebida' : 'Quantidade retirada' }}</div>
              <div
                class="text-h5 text-weight-medium font-mono q-mt-xs"
                :class="mov.tipo === 'entrada' ? 'text-positive' : 'text-negative'"
              >
                {{ mov.tipo === 'entrada' ? '+' : '-' }}{{ format(mov.qtd) }} un
              </div>
            </div>

            <div class="col-6 col-sm-4">
              <div class="v-label">{{ mov.tipo === 'entrada' ? 'Data de recebimento' : 'Data de retirada' }}</div>
              <div class="text-h6 text-weight-medium q-mt-xs">{{ mov.dataFormatada }}</div>
            </div>

            <div class="col-6 col-sm-4">
              <div class="v-label">Operador responsável</div>
              <div class="text-h6 text-weight-medium q-mt-xs">{{ mov.operadorNome || '—' }}</div>
            </div>
          </div>

          <q-separator style="background: var(--v-border);" class="q-my-lg" />

          <template v-if="mov.tipo === 'saida'">
            <div class="v-label">Número da OS</div>
            <div class="text-h6 text-weight-medium font-mono q-mt-xs" style="color: var(--v-magma);">
              {{ mov.os }}
            </div>
          </template>

          <template v-else>
            <div class="v-label">Observações / Notas</div>
            <div class="text-body1 q-mt-xs" style="white-space: pre-wrap;">
              {{ mov.observacoes || 'Nenhuma observação registrada.' }}
            </div>
          </template>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="v-surface q-pa-lg">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Ações</div>
          <div class="column" style="gap: 10px;">
            <q-btn
              no-caps
              flat
              align="left"
              icon="inventory_2"
              label="Ver componente no catálogo"
              @click="irParaCatalogo"
            />
            <q-btn
              no-caps
              flat
              align="left"
              icon="history"
              label="Voltar para movimentações"
              to="/movimentacoes"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEstoque } from '/src/composables/useEstoque'

const props = defineProps({
  id: { type: String, required: true }
})

const estoque = useEstoque()
const router = useRouter()

const mov = ref(null)
const carregando = ref(true)

onMounted(async () => {
  carregando.value = true
  mov.value = await estoque.buscarMovimentacaoPorId(props.id)
  carregando.value = false
})

function irParaCatalogo () {
  router.push({ path: '/catalogo', query: { busca: mov.value?.codigo } })
}

function format (n) {
  return new Intl.NumberFormat('pt-BR').format(n)
}
</script>

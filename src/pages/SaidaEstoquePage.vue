<template>
  <q-page class="q-pa-lg">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-medium">Saída de estoque</div>
      <div class="text-body2 q-mt-xs" style="color: var(--v-text-muted);">
        Registre a retirada de componentes para projetos e prototipagem ativa.
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <div class="v-surface q-pa-lg">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Formulário de saída / requisição</div>

          <q-form class="column" style="gap: 18px;" @submit.prevent="confirmar">
            <q-select
              v-model="form.componenteId"
              :options="opcoesComponentes"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              filled
              dark
              dense
              label="Componente alvo"
              :rules="[(v) => !!v || 'Selecione um componente']"
            />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="form.quantidade"
                  type="number"
                  min="1"
                  filled
                  dark
                  dense
                  label="Quantidade retirada"
                  :rules="[
                    (v) => v > 0 || 'Informe uma quantidade válida',
                    (v) => !itemSelecionado || v <= itemSelecionado.qtd || 'Quantidade acima do estoque disponível'
                  ]"
                  :color="quantidadeExcedeEstoque ? 'negative' : undefined"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.os"
                  filled
                  dark
                  dense
                  label="Número da OS"
                  placeholder="OS-2026-0000"
                  :rules="[(v) => !!v || 'Informe o número da OS']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.data"
                  filled
                  dark
                  dense
                  label="Data de retirada"
                  mask="##/##/####"
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div class="col-12 col-sm-6 flex items-center">
                <div class="text-caption" style="color: var(--v-text-muted);">
                  Operador responsável:
                  <span class="text-weight-medium" style="color: var(--v-text);">
                    {{ perfil?.nome || sessao?.user?.email || '—' }}
                  </span>
                  <div style="font-size: 11px;">(identificado pela sua sessão)</div>
                </div>
              </div>
            </div>

            <div class="row q-gutter-sm">
              <q-btn no-caps flat label="Cancelar" @click="limpar" />
              <q-btn
                no-caps
                unelevated
                color="negative"
                label="Confirmar saída"
                type="submit"
                :disable="quantidadeExcedeEstoque"
              />
            </div>
          </q-form>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="v-surface q-pa-lg full-height">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Estado do estoque atual</div>

          <template v-if="itemSelecionado">
            <div class="v-label">Quantidade atual em disco</div>
            <div class="text-h4 text-weight-medium font-mono q-mb-md" style="color: var(--v-magma);">
              {{ format(itemSelecionado.qtd) }} un
            </div>

            <q-separator style="background: var(--v-border);" class="q-mb-md" />

            <div class="v-label">Estoque mínimo advertido</div>
            <div class="text-h6 text-weight-medium font-mono q-mb-md">
              {{ format(itemSelecionado.minimo) }} un
            </div>

            <q-separator style="background: var(--v-border);" class="q-mb-md" />

            <div class="v-label">Projeção após baixa</div>
            <div
              class="text-h6 text-weight-medium font-mono"
              :class="projecaoAposBaixa < itemSelecionado.minimo ? 'text-negative' : 'text-positive'"
            >
              {{ format(projecaoAposBaixa) }} un
            </div>
          </template>

          <div v-else class="text-body2" style="color: var(--v-text-muted);">
            Selecione um componente para ver o estado atual do estoque.
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useEstoque } from 'src/composables/useEstoque'
import { useAuth } from 'src/composables/useAuth'

const $q = useQuasar()
const estoque = useEstoque()
const { perfil, sessao } = useAuth()

onMounted(() => {
  estoque.carregarComponentes()
})

const form = reactive({
  componenteId: null,
  quantidade: null,
  os: '',
  data: ''
})

const opcoesComponentes = computed(() =>
  (estoque.componentes || []).map((c) => ({ label: `${c.nome} (${c.codigo})`, value: c.id }))
)

const itemSelecionado = computed(() =>
  (estoque.componentes || []).find((c) => c.id === form.componenteId) || null
)

const projecaoAposBaixa = computed(() => {
  if (!itemSelecionado.value) return 0
  const qtd = form.quantidade || 0
  return Math.max(0, itemSelecionado.value.qtd - qtd)
})

const quantidadeExcedeEstoque = computed(() =>
  !!itemSelecionado.value && !!form.quantidade && form.quantidade > itemSelecionado.value.qtd
)

function limpar () {
  form.componenteId = null
  form.quantidade = null
  form.os = ''
  form.data = ''
}

async function confirmar () {
  if (!form.componenteId || !form.quantidade || !form.os || quantidadeExcedeEstoque.value) return

  const resultado = await estoque.registrarSaida({
    componenteId: form.componenteId,
    qtd: form.quantidade,
    os: form.os,
    data: form.data
  })

  if (!resultado.ok) {
    $q.notify({ message: resultado.mensagem, color: 'negative', icon: 'error_outline' })
    return
  }

  $q.notify({
    message: `Saída registrada para a OS ${form.os}.`,
    color: 'negative',
    icon: 'check_circle'
  })

  limpar()
}

function format (n) {
  return new Intl.NumberFormat('pt-BR').format(n || 0)
}
</script>

<style scoped>
.v-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--v-text-muted);
}
</style>

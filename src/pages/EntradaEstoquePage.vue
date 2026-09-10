<template>
  <q-page class="q-pa-lg">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-medium">Entrada de estoque</div>
      <div class="text-body2 q-mt-xs" style="color: var(--v-text-muted);">
        Registre a chegada de novos lotes de componentes e atualize o sistema.
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <div class="v-surface q-pa-lg">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Formulário de entrada ativa</div>

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
                  label="Quantidade entrada"
                  :rules="[(v) => v > 0 || 'Informe uma quantidade válida']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.data"
                  filled
                  dark
                  dense
                  label="Data de recebimento"
                  mask="##/##/####"
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>

            <q-input
              v-model="form.observacoes"
              filled
              dark
              dense
              type="textarea"
              rows="4"
              label="Observações / Notas"
            />

            <div class="row q-gutter-sm">
              <q-btn no-caps flat label="Cancelar" @click="limpar" />
              <q-btn no-caps unelevated color="primary" label="Confirmar entrada" type="submit" />
            </div>
          </q-form>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="v-surface q-pa-lg full-height">
          <div class="text-subtitle2 text-weight-medium q-mb-md">Instruções técnicas</div>
          <div class="text-body2 q-mb-md" style="color: var(--v-text-muted);">
            Certifique-se de validar fisicamente o lote de componentes antes de confirmar no sistema.
          </div>
          <div class="text-body2 q-mb-md" style="color: var(--v-text-muted);">
            Para circuitos integrados sensíveis, execute o protocolo ESD apropriado antes de armazenar na prateleira.
          </div>
          <div class="text-body2 q-mb-lg" style="color: var(--v-text-muted);">
            Qualquer divergência física de quantidade deve ser reportada no campo de observações.
          </div>

          <div class="destaque-box">
            <q-icon name="verified_user" size="16px" style="color: var(--v-verde);" />
            Certificação de qualidade ativa
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

const $q = useQuasar()
const estoque = useEstoque()

onMounted(() => {
  estoque.carregarComponentes()
})

const form = reactive({
  componenteId: null,
  quantidade: null,
  data: '',
  observacoes: ''
})

const opcoesComponentes = computed(() =>
  (estoque.componentes || []).map((c) => ({
    label: `${c.codigo} - ${c.nome}`,
    value: c.id
  }))
)

function limpar () {
  form.componenteId = null
  form.quantidade = null
  form.data = ''
  form.observacoes = ''
}

async function confirmar () {
  if (!form.componenteId || !form.quantidade) return

  const resultado = await estoque.registrarEntrada({
    componenteId: form.componenteId,
    qtd: form.quantidade,
    data: form.data,
    observacoes: form.observacoes
  })

  if (!resultado.ok) {
    $q.notify({ message: resultado.mensagem, color: 'negative', icon: 'error_outline' })
    return
  }

  $q.notify({
    message: 'Entrada registrada com sucesso.',
    color: 'positive',
    icon: 'check_circle'
  })

  limpar()
}
</script>

<style scoped>
.destaque-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--v-verde);
  background: var(--v-verde-dim);
  border: 1px solid rgba(76, 175, 125, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
}
</style>

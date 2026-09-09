<template>
  <q-layout>
    <q-page-container>
      <q-page class="login-page flex flex-center">
        <div class="login-glow" />

        <q-card flat class="login-card v-surface q-pa-xl">
          <div class="row items-center q-mb-lg" style="gap: 12px;">
            <div class="brand-mark flex flex-center">
              <q-icon name="local_fire_department" size="22px" color="white" />
            </div>
            <div>
              <div class="text-h5 text-weight-medium" style="letter-spacing: -0.01em;">Vulcano</div>
              <div class="v-label">Controle de estoque · v1.0</div>
            </div>
          </div>

          <div class="text-subtitle1 text-weight-medium q-mb-xs">Entrar no sistema</div>
          <div class="text-body2 q-mb-lg" style="color: var(--v-text-muted);">
            Informe suas credenciais de operador para acessar o painel.
          </div>

          <q-form @submit.prevent="entrar" class="column" style="gap: 16px;">
            <q-input
              v-model="email"
              label="E-mail"
              type="email"
              filled
              dark
              dense
              autofocus
              :rules="[(v) => !!v || 'Informe o e-mail']"
            >
              <template #prepend>
                <q-icon name="mail_outline" />
              </template>
            </q-input>

            <q-input
              v-model="senha"
              label="Senha"
              filled
              dark
              dense
              :type="mostrarSenha ? 'text' : 'password'"
              :rules="[(v) => !!v || 'Informe a senha']"
            >
              <template #prepend>
                <q-icon name="lock_outline" />
              </template>
              <template #append>
                <q-icon
                  :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrarSenha = !mostrarSenha"
                />
              </template>
            </q-input>

            <div v-if="erro" class="erro-msg">
              <q-icon name="error_outline" size="16px" />
              {{ erro }}
            </div>

            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Entrar"
              class="full-width q-py-sm text-weight-medium"
              :loading="carregando"
            />

            <div class="text-caption text-center" style="color: var(--v-text-muted);">
              Esqueceu a senha ou precisa de acesso? Fale com o administrador do sistema.
            </div>
          </q-form>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '/src/composables/useAuth'

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const carregando = ref(false)
const erro = ref('')

const { login } = useAuth()
const router = useRouter()
const route = useRoute()

async function entrar () {
  if (!email.value || !senha.value) return

  erro.value = ''
  carregando.value = true

  const resultado = await login(email.value, senha.value)

  carregando.value = false

  if (resultado.ok) {
    router.push(route.query.redirect || '/dashboard')
  } else {
    erro.value = resultado.mensagem
  }
}
</script>

<style scoped>
.login-page {
  background: var(--v-bg);
  position: relative;
  overflow: hidden;
}

.login-glow {
  position: absolute;
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 90, 31, 0.16) 0%, rgba(255, 90, 31, 0) 70%);
  top: -250px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.login-card {
  width: 380px;
  max-width: 90vw;
  position: relative;
  z-index: 1;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #FF5A1F, #E63946);
}

.erro-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--v-brasa);
  font-size: 13px;
  background: var(--v-brasa-dim);
  border-radius: 6px;
  padding: 8px 10px;
}
</style>

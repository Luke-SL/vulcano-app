import { defineStore } from 'pinia'

// Credenciais de exemplo — substitua por uma chamada real de API/backend.
const DEMO_USER = {
  login: 'operador',
  senha: 'vulcano123',
  nome: 'Carlos Silva',
  cargo: 'OPERADOR_01'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    autenticado: sessionStorage.getItem('vulcano_auth') === '1',
    usuario: JSON.parse(sessionStorage.getItem('vulcano_user') || 'null')
  }),

  actions: {
    async login (login, senha) {
      // Simula latência de rede. Troque por uma chamada real ao seu backend.
      await new Promise((resolve) => setTimeout(resolve, 400))

      if (login === DEMO_USER.login && senha === DEMO_USER.senha) {
        this.autenticado = true
        this.usuario = { nome: DEMO_USER.nome, cargo: DEMO_USER.cargo }
        sessionStorage.setItem('vulcano_auth', '1')
        sessionStorage.setItem('vulcano_user', JSON.stringify(this.usuario))
        return true
      }

      return false
    },

    logout () {
      this.autenticado = false
      this.usuario = null
      sessionStorage.removeItem('vulcano_auth')
      sessionStorage.removeItem('vulcano_user')
    }
  }
})

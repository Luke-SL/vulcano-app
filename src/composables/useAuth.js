import { ref, computed } from 'vue'
import { supabase } from 'boot/supabase'

// Estado a nível de módulo: compartilhado por qualquer componente que chame
// useAuth(), sem precisar de Pinia. É o mesmo princípio de uma store, só que
// mais simples para o caso de uso (sessão única do usuário logado).
const sessao = ref(null)
const perfil = ref(null)
const carregando = ref(true)

async function carregarPerfil (userId) {
  if (!userId) {
    perfil.value = null
    return
  }

  const { data, error } = await supabase
    .from('perfis')
    .select('nome, cargo')
    .eq('id', userId)
    .single()

  perfil.value = error ? null : data
}

// Inicialização única do listener, na primeira vez que este módulo é importado.
let inicializado = false

function inicializar () {
  if (inicializado) return
  inicializado = true

  supabase.auth.getSession().then(async ({ data }) => {
    sessao.value = data.session
    await carregarPerfil(data.session?.user?.id)
    carregando.value = false
  })

  supabase.auth.onAuthStateChange(async (_evento, novaSessao) => {
    sessao.value = novaSessao
    await carregarPerfil(novaSessao?.user?.id)
  })
}

function traduzirErro (error) {
  if (!error) return ''
  if (error.message?.includes('Invalid login credentials')) {
    return 'E-mail ou senha inválidos.'
  }
  if (error.message?.includes('Email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique a caixa de entrada.'
  }
  return error.message || 'Não foi possível entrar. Tente novamente.'
}

export function useAuth () {
  inicializar()

  async function login (email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) {
      return { ok: false, mensagem: traduzirErro(error) }
    }

    sessao.value = data.session
    await carregarPerfil(data.user?.id)
    return { ok: true }
  }

  async function logout () {
    await supabase.auth.signOut()
    sessao.value = null
    perfil.value = null
  }

  return {
    sessao,
    perfil,
    carregando,
    autenticado: computed(() => !!sessao.value),
    login,
    logout
  }
}

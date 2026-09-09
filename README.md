# Vulcano

Sistema de controle de entrada e saída de componentes eletrônicos, feito em **Quasar Framework (Vue 3 + Vite)**.

Baseado no fluxo do painel de referência (ElectroStock), com os seguintes ajustes pedidos:

- Removidos: valores financeiros (R$), pedidos pendentes, campo de fornecedor e número da nota fiscal.
- O campo "Projeto / Destino" da saída de estoque virou **Número da OS**.
- Adicionada tela de login (guarda de rota em `src/router/index.js`).

## Estrutura

```
src/
  boot/pinia.js          -> registra o Pinia
  css/
    app.scss             -> estilos globais e tokens de cor (tema Vulcano)
    quasar.variables.scss-> variáveis de cor do Quasar
  layouts/MainLayout.vue -> sidebar + header
  pages/
    LoginPage.vue
    DashboardPage.vue
    CatalogoPage.vue
    EntradaEstoquePage.vue
    SaidaEstoquePage.vue
    RelatoriosPage.vue
    ErrorNotFound.vue
  router/
    routes.js
    index.js             -> guarda de autenticação
  stores/
    auth.js              -> login mockado (sessionStorage)
    estoque.js            -> dados mockados de componentes/movimentações
```

## Rodando o projeto

Pré-requisitos: Node.js 18 ou 20, e o Quasar CLI.

```bash
npm install -g @quasar/cli
npm install
quasar dev
```

## Login de demonstração

```
Usuário: operador
Senha:   vulcano123
```

Essas credenciais estão fixas em `src/stores/auth.js` só para efeito de demonstração.
Quando for integrar com seu backend (Supabase, por exemplo), troque a action `login` desse
arquivo por uma chamada real de autenticação.

## Dados mockados

Todo o estoque, movimentações e alertas vêm de `src/stores/estoque.js` (Pinia).
Basta trocar essas listas por chamadas à sua API/Supabase — os getters (`itensComStatus`,
`alertas`, `itensEstoqueBaixo` etc.) e os componentes de tela já ficam reativos automaticamente.

## Próximos passos sugeridos

- Trocar o mock de autenticação por Supabase Auth (você já usa RLS + `time_comercio`
  em outro projeto, o padrão de roles pode ser reaproveitado aqui).
- Persistir componentes/movimentações no Postgres/Supabase em vez do estado em memória.
- Adicionar paginação/servidor na tabela do catálogo quando o volume de itens crescer.

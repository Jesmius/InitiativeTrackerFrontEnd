# Initiative Tracker — Frontend

Interface web para gerenciamento de iniciativa em sessões de RPG de mesa, desenvolvida com HTML, CSS e TypeScript.

## Integrantes

- Lucas Fernandes Alvarenga — Matrícula: 2210601

## Link do site

- **Site ao vivo:** https://jesmius.github.io/InitiativeTrackerFrontEnd/
- **Backend (API):** https://initiativetracker.pythonanywhere.com/swagger/


## Descrição do projeto

O Initiative Tracker é uma ferramenta para auxiliar sessões de RPG de mesa no controle da ordem de iniciativa. O sistema possui dois tipos de usuário com experiências distintas:

**Mestre de Mesa:** gerencia os inimigos do seu bestiário, define quais jogadores fazem parte da sua campanha, cria combates e adiciona personagens e inimigos à ordem de iniciativa. Durante o combate, controla os turnos, atualiza o HP de todos os participantes e remove ou revive participantes conforme necessário.

**Jogador:** cadastra seus personagens e visualiza os combates em que está participando. Pode passar o turno quando for a sua vez e atualizar o HP do seu próprio personagem durante o combate.

O frontend se comunica com a API REST do backend via JWT, com renovação automática de token.

## Tecnologias

- HTML5
- CSS3 (design responsivo customizado, sem frameworks)
- TypeScript 5.4 (compilado para ES2020 modules)
- Fetch API (comunicação com o backend)

## Instalação local

### Pré-requisitos

- Node.js (para compilar o TypeScript)
- Um servidor HTTP local (ex: extensão Live Server do VS Code, ou `npx serve`)

### Passos

```bash
# 1. Clone o repositório
git clone <url-do-repositório>
cd InitiativeTrackerFrontEnd

# 2. Instale as dependências de desenvolvimento
npm install

# 3. Compile o TypeScript
npm run build
# ou em modo watch (recompila automaticamente ao salvar):
npm run watch

# 4. Sirva os arquivos com um servidor HTTP local
# Opção A — extensão Live Server do VS Code: clique em "Go Live"
# Opção B — linha de comando:
npx serve .
```

O site estará disponível em `http://localhost:5500` (Live Server) ou `http://localhost:3000` (serve).



### Apontando para um backend local

Por padrão o frontend aponta para o backend publicado no PythonAnywhere. Para usar um backend local, edite a primeira linha de `src/api.ts`:

```typescript
export const API_BASE = 'http://localhost:8000';
```

Depois recompile com `npm run build`.

## Manual do usuário

### Criar conta

1. Acesse o site e clique em **Criar conta**.
2. Escolha um username, email e senha.
3. Selecione o papel: **Mestre de Mesa** ou **Jogador**.
4. Clique em **Criar Conta**. Você será redirecionado para o login.

### Recuperar senha

Não consegui implementar o sistema de recuperação de senha correto, então, basta o usuário fornecer seu username, e o e-mail associado para trocar a senha.

### Trocar senha

Após fazer login, acesse **Perfil** no menu superior e preencha o formulário de troca de senha.

---

### Para Mestres de Mesa

#### Gerenciar inimigos

Acesse **Inimigos** no menu. Você pode criar, editar e excluir inimigos do seu bestiário. Cada inimigo tem nome, bônus de iniciativa, HP e Defesa Passiva.

#### Gerenciar jogadores da campanha

Acesse **Jogadores** no menu. Adicione jogadores pelo username deles. Apenas personagens de jogadores na sua lista aparecem ao montar um combate.

#### Criar um combate

No **Dashboard**, preencha o nome do combate e clique em **Criar Combate**. Você será redirecionado para a tela do combate.

#### Adicionar participantes ao combate

Na tela do combate, clique em **Adicionar Participante**. Escolha se é um personagem ou inimigo, selecione da lista e informe o valor de iniciativa rolado. Para inimigos, você pode dar um nome personalizado em vez de usar o nome do stat block.

#### Controlar o combate

- **Ordenar por Iniciativa:** organiza a lista do maior para o menor valor de iniciativa.
- **Próximo Turno:** avança para o próximo participante vivo.
- **HP:** clique no campo HP de qualquer participante para editar. Participantes com HP ≤ 0 são marcados como **Mortos** e pulados nos turnos.
- **Matar / Reviver:** alterna manualmente o estado vivo/morto de um participante.
- **Remover:** retira o participante do combate permanentemente.
- **Encerrar Combate:** marca o combate como encerrado.

---

### Para Jogadores

#### Cadastrar personagem

Acesse **Personagens** no menu. Crie seus personagens com nome e bônus de iniciativa.

#### Acompanhar combates

No **Dashboard** aparecem todos os combates em que pelo menos um dos seus personagens está participando. Clique em **Ver Combate** para entrar.

#### Dentro do combate

- Um banner exibe de quem é o turno atual.
- Quando for **a sua vez**, o botão **Passar Meu Turno** é habilitado.
- Você pode editar o HP do **seu próprio personagem** diretamente na coluna HP da tabela.

## O que funcionou

- Cadastro de usuários com papéis distintos (Mestre e Jogador)
- Login com JWT e renovação automática de token em segundo plano
- Recuperação e troca de senha
- CRUD completo de personagens (jogadores) e inimigos (mestres)
- Gerência da lista de jogadores da campanha pelo mestre
- Criação e exclusão de combates
- Adição de participantes com nome personalizado para inimigos
- Ordem de iniciativa com ordenação automática e edição manual
- Sistema de turnos: controle de quem pode passar o turno, avanço automático
- Atualização de HP pelo mestre (todos) e pelo jogador (próprio personagem)
- Participantes com HP ≤ 0 marcados como mortos e pulados nos turnos
- Atualização automática da tela a cada 5 segundos (polling)
- Navegação com menus distintos por papel de usuário
- Deploy funcional no GitHub Pages

## O que não funcionou

- A recuperação de senha não envia email: o sistema redefine a senha diretamente se o username e email coincidirem.
- A atualização em tempo real usa polling de 5 segundos, o que pode causar um pequeno delay entre a ação de um jogador e a atualização na tela de outro.
- Não há notificação sonora ou visual destacada quando chega a vez do jogador além do banner de texto na tela.

# Terê Verde Online — Circuito Terê Verde (Teresópolis)

MVP Back-End da disciplina *Desenvolvimento de Back-End para MVP* (ADS · UNIFESO).

**Integrante (trabalho individual):** Marcelo Souza Affonso (matrícula 06015469)

**Site publicado (opcional):** https://tere-verde.tere-verde-online.workers.dev

---

## Como rodar localmente (passo a passo)

### Pré-requisitos

- **Node.js 20.19 ou superior** (recomendado 22; testado com Node 24) e **npm**. Confira com `node -v`.
- Conexão com a internet apenas para o `npm install` e para carregar as fontes do Google Fonts.
- Não precisa de conta na Cloudflare, de Docker nem de banco instalado: o banco (SQLite/D1), o armazenamento de imagens (R2) e o cache (KV) rodam **localmente** pelo próprio projeto.

### 1. Instalar as dependências

Abra um terminal na pasta do projeto e rode:

```bash
npm install
```

### 2. Preparar o ambiente (uma única vez)

```bash
npm run setup
```

Esse comando faz tudo sozinho:
1. cria o arquivo `.dev.vars` com um segredo local para o login;
2. cria o banco de dados local e carrega o esquema e os dados de exemplo (8 atrações, eventos, avisos e temporadas);
3. carrega as fotos das atrações no armazenamento local;
4. cria o administrador de teste.

### 3. Iniciar o projeto

```bash
npm run dev
```

Abra **http://localhost:5173** no navegador.

### Login do administrador (somente para a aula)

Acesse **http://localhost:5173/admin** e entre com:

| E-mail | Senha |
|---|---|
| `admin@tereverde.local` | `TereVerde@2026` |

### 4. Rodar os testes (opcional)

```bash
npm test
```

Executa 54 testes (unitários + integração) dentro do runtime do Workers, com banco e armazenamento isolados. Não depende do passo 2 nem do servidor aberto.

---

## Roteiro rápido para avaliar

**Como visitante (sem login):**
1. Página inicial: aviso urgente no topo, atrações em destaque e próximos eventos.
2. **Atrações:** busca e filtros por categoria e status. Abra uma atração para ver informações, segurança, temporadas e eventos.
3. **Eventos:** filtros por data, categoria e texto.
4. **Segurança:** avisos ativos, temporadas, atrações com acesso restrito e telefones de emergência.

**Como administrador (`/admin`):**
1. Aba **Atrações:** mude a disponibilidade (aberta, fechada, em manutenção) direto na tabela; depois veja o efeito na página pública da atração. Crie, edite e desative atrações; envie foto pelo formulário.
2. Aba **Avisos:** crie um aviso urgente e veja-o aparecer no topo do site; desative-o em seguida.
3. Aba **Temporadas:** crie uma temporada *fechada* para uma atração cobrindo a data de hoje; a atração passa a aparecer como fechada automaticamente.
4. Aba **Eventos:** crie um evento como *rascunho* (não aparece no site) e depois como *publicado*.
5. **Minha conta** (botão no topo do painel): altere nome, e-mail (digite caracteres inválidos e veja o filtro) e senha. Depois de trocar a senha, a antiga deixa de funcionar.
6. Aba **Auditoria:** cada ação acima fica registrada (quem, o quê e quando). Desativar um registro **não apaga** os dados, só o esconde do site.

---

## Situação-problema

**Circuito Terê Verde — Teresópolis:** plataforma "Terê Verde Online" com biodiversidade, trilhas, cachoeiras e eventos. Foco em turismo de montanhismo e biodiversidade, com três unidades de conservação como alvos: **P.N. da Serra dos Órgãos, P.E. dos Três Picos e P.N.M. Montanhas de Teresópolis**.

Contexto: uma trilha é interditada por risco de deslizamento e o site antigo não atualizava os avisos. O administrador precisa cadastrar avisos urgentes e alterar o status das atrações (aberta, fechada ou em manutenção).

Atores: **administradores** (mantêm o conteúdo) e **visitantes** (consultam, sem login).

## Objetivo do MVP

Substituir um site estático por uma aplicação com API, banco de dados e autenticação, em que administradores autenticados cadastram, consultam, editam, **desativam** e controlam a disponibilidade de atrações, eventos, temporadas e avisos, enquanto visitantes consultam informações públicas atualizadas.

## Escopo e priorização (MoSCoW)

| Prioridade | Itens |
|---|---|
| **Must have** | Login de administrador · CRUD de atrações com status aberta/fechada/manutenção · CRUD de eventos · avisos urgentes no topo do site · consulta pública com filtros · persistência em banco · validação no servidor |
| **Should have** | Temporadas (alta/baixa/fechada) com bloqueio automático · desativação lógica · trilha de auditoria · upload de imagens · página de segurança |
| **Could have** | Painel com indicadores · créditos de imagem · cache de borda · teste de carga |
| **Won't have** (fora do escopo) | Pagamentos · venda de ingressos · aplicativo mobile nativo · recomendação por IA · integração automática com redes sociais · contas e favoritos de visitantes · comentários e avaliações · MFA (evolução futura) |

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| RF01 | O administrador realiza login com e-mail e senha. |
| RF02 | O administrador encerra a sessão (logout). |
| RF03 | O administrador cadastra, edita e desativa atrações (nome, categoria, resumo, descrição, local, dificuldade, distância, duração, altitude, segurança, imagem e crédito). |
| RF04 | O administrador altera o status de uma atração e o visitante vê o status atualizado. |
| RF05 | O administrador cadastra, edita e desativa eventos (título, data, horário, local, categoria, status, descrição, imagem). |
| RF06 | O administrador cadastra, ativa/desativa e remove avisos urgentes; avisos ativos aparecem no topo do site. |
| RF07 | O administrador cadastra, edita e desativa temporadas (alta, baixa ou fechada) por atração ou para o circuito inteiro; temporada fechada vigente bloqueia a atração automaticamente. |
| RF08 | Visitantes consultam e buscam atrações, filtrando por categoria e status. |
| RF09 | Visitantes consultam eventos publicados, filtrando por data, categoria e texto. |
| RF10 | A página de segurança lista avisos ativos, temporadas, atrações com acesso restrito e orientações. |
| RF11 | O painel exibe indicadores e a trilha de auditoria das alterações. |
| RF12 | O administrador altera o próprio nome, e-mail e senha em **Minha conta** (`/admin/conta`); a troca de senha exige a senha atual. |

## Requisitos não funcionais

| ID | Área | Requisito |
|----|------|-----------|
| RNF01 | Segurança | Senhas com hash PBKDF2-SHA256 (100.000 iterações, salt aleatório); nunca em texto puro. |
| RNF02 | Segurança | Rotas de criação, edição e desativação (`/api/admin/*`) exigem sessão válida (JWT em cookie HttpOnly, `SameSite=Strict`, 8 h). |
| RNF03 | Segurança | O servidor valida todos os dados (Zod) e rejeita entradas inválidas com mensagem clara. |
| RNF04 | Desempenho | Lista de atrações em até 2 s (p95), com cache de borda de 30 s e índices no banco. |
| RNF05 | Segurança | Login limita tentativas (5 a cada 10 min por IP). |
| RNF06 | Compatibilidade | Interface responsiva (celular, tablet e computador). |
| RNF07 | Usabilidade | Orientações de segurança a 1 clique de qualquer página. |
| RNF08 | Usabilidade | Cadastro ou edição em um único formulário (≤ 4 etapas). |
| RNF09 | Segurança | Upload aceita apenas JPG/PNG/WebP até 3 MB. |
| RNF11 | Segurança | O e-mail aceita só letras sem acento, números e `. _ % + -` (filtrado na tela e validado no servidor); a nova senha exige 8+ caracteres com letra e número e é gravada com hash. |
| RNF10 | Rastreabilidade | DELETE desativa (exclusão lógica) e toda alteração administrativa é registrada na auditoria. |

## Arquitetura e tecnologias

```
Cliente (React)  →  Servidor / API (Worker + Hono)  →  Banco de dados (D1 / SQLite)
                         ├─ KV  (limite de tentativas de login)
                         └─ R2  (imagens)
```

| Camada | Tecnologia |
|---|---|
| Servidor e API | Cloudflare Workers · Hono · Zod · JWT · PBKDF2 (WebCrypto) |
| Banco de dados | Cloudflare D1 (SQLite), relacional por causa da integridade entre atrações, eventos, temporadas e avisos |
| Imagens e limite de login | Cloudflare R2 e KV (em modo local, nada é cobrado nem exige conta) |
| Front-end | React 19 · Vite · Tailwind CSS v4 · shadcn/ui · React Router |
| Qualidade | Vitest · `@cloudflare/vitest-plugin` · Locust · GitHub Actions |

Rotas: `GET` recupera · `POST` cria · `PUT` atualiza · `PATCH` altera o status · `DELETE` **desativa** (previne inconsistências e garante rastreabilidade).

**Segurança:** consultas SQL parametrizadas, saída escapada pelo React, validação de entrada, cabeçalhos de segurança, JWT em cookie HttpOnly, limite de tentativas de login, auditoria. O sistema não coleta dados pessoais de visitantes (LGPD). MFA ainda não foi implementado.

> Diferença em relação ao exemplo de aula (Node + Express + SQLite + bcrypt): o Workers não executa Express nem grava arquivos SQLite, então usamos Hono + D1, e PBKDF2 no lugar de bcrypt. Os conceitos (API REST, CRUD, JWT, hash, middleware, validação) são os mesmos.

## Estrutura de diretórios

```
src/           Código-fonte do MVP
  worker/        API (Hono): rotas públicas, auth, admin, hash de senha, schemas Zod
  shared/        Constantes compartilhadas entre front e back
  pages/ components/ admin/ lib/   Front-end React (components/ui = shadcn)
test/          unit/ · integration/ · load/ (Locust)
data/          migrations/ (esquema e dados de exemplo) · photos/ (fotos das atrações)
docs/          Especificação OpenAPI (openapi.yaml)
scripts/       setup.mjs (preparação local) · make-admin.mjs (cria administrador)
design-system/ Tokens, logo e documentação visual (abra design-system/index.html)
```

## Endpoints da API

Especificação completa em [`docs/openapi.yaml`](docs/openapi.yaml).

- **Públicos:** `GET /api/attractions` · `GET /api/attractions/:slug` · `GET /api/events` · `GET /api/notices` · `GET /api/seasons` · `GET /api/media/*`
- **Auth:** `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
- **Admin (exigem login):** `GET|PUT /api/admin/profile` · `PUT /api/admin/password` · `GET /api/admin/stats` · `GET /api/admin/audit` · `/api/admin/attractions` · `/api/admin/events` · `/api/admin/notices` · `/api/admin/seasons` (GET, POST, PUT, DELETE) · `PATCH /api/admin/attractions/:id/status` · `POST /api/admin/upload`

## Teste de carga (opcional)

Com o projeto rodando (`npm run dev`) e Python instalado:

```bash
pip install locust
locust -f test/load/locustfile.py --host http://localhost:5173 --headless -u 50 -r 10 -t 30s
```

Medição local feita pela equipe (30 usuários por 20 s): 457 requisições, 0 falhas, p95 de 31 ms na lista de atrações (meta: 2 s).

## Problemas comuns

| Sintoma | Solução |
|---|---|
| `npm run dev` diz que a porta 5173 está em uso | Feche o outro processo ou rode `npm run dev -- --port 5180`. |
| Atrações aparecem sem fotos | Rode `npm run setup` novamente (é seguro repetir). |
| Quer zerar o banco local | Apague a pasta `.wrangler` e rode `npm run setup`. |
| Erro de login "Muitas tentativas" | Aguarde 10 minutos ou apague `.wrangler` e rode `npm run setup`. |
| Fontes diferentes do design | Sem internet o Google Fonts não carrega; o site continua funcionando com fontes padrão. |

## Observações

- Os dados em `data/migrations/0002` e `0005` são **exemplos** (inclusive as datas de temporada) e devem ser revisados com a gestão dos parques antes de divulgar.
- As fotos vêm do Wikimedia Commons (licenças livres) e têm o crédito exibido no site.
- O visual segue o design system em [`design-system/`](design-system/index.html).

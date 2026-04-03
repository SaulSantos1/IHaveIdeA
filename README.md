# I Have Idea

Bem-vindo ao repositório do projeto **I Have Idea**. Esta aplicação é uma prova de conceito de um jogo de atividade diária técnica com foco em minimalismo e interface escura inspirada no HackerRank e Termo.

## Requisitos
- **Node.js** >= 18
- **Docker** e **Docker Compose**

## Guia Simplificado: Desenvolvendo Localmente

### 1. Iniciar a Infraestrutura (DB e Cache)
Na raiz do projeto (`/`), execute o Docker Compose para subir o PostgreSQL e o Redis.
\`\`\`bash
docker-compose up -d
\`\`\`

### 2. Configurar o Backend
Abra um terminal e acesse a pasta `backend`:
\`\`\`bash
cd backend
npm install
\`\`\`
Copie o `.env.example` para `.env` e preencha as variáveis.
Execute a migração do banco de dados para criar as tabelas:
\`\`\`bash
npx prisma migrate dev --name init
\`\`\`
Inicie o servidor (ele rodará em `http://localhost:4000`):
\`\`\`bash
npm run start:dev
\`\`\`

### 3. Configurar o Frontend
Abra um novo terminal e acesse a pasta `frontend`:
\`\`\`bash
cd frontend
npm install
\`\`\`
O Frontend já está configurado para acessar a API local. Inicie-o:
\`\`\`bash
npm run dev
\`\`\`
O painel estará disponível em [http://localhost:3000](http://localhost:3000).

## Estrutura de Diretórios
- **/backend**: NestJS + Prisma ORM + BullMQ + Endpoint Logic.
- **/frontend**: Next.js (App Router) + Tailwind v4 + LocalStorage Streak Manager.

## Como o Mock Funciona?
Inicialmente, você requereu que o sistema rodasse dinamicamente local usando um mock. 
O arquivo `backend/src/evaluation/evaluation.service.ts` contém uma avaliação mock. Caso submeta texto com mais de 20 caracteres, a IA validará como `correto` para aprovar visualmente as rotas do frontend. 
Da mesma forma, caso o banco de dados falhe ou não tenha pergunta do dia cadastrada, o `QuestionService` envia uma pergunta Mock sobre "*git merge*". Levante o Banco e insira via Prisma Studio (`npx prisma studio`) as perguntas.

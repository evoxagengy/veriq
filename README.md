# Veriq System

SaaS de checklists operacionais e inspeções de equipamentos com Next.js, TypeScript, Prisma, PostgreSQL e autenticação por sessão HttpOnly.

## Rodar localmente

```bash
npm install
npx prisma generate
npm run dev
```

Configure variáveis conforme `.env.example`. Não salve credenciais reais no repositório.

## Banco

```bash
npx prisma db push
npm run prisma:seed
```

O seed cria dados demo idempotentes e não apaga registros existentes.
Defina `SEED_ADMIN_PASSWORD` para controlar a senha inicial do usuário demo.

Módulos implementados:

- Autenticação com sessão segura.
- Dashboard operacional.
- Checklists e detalhes.
- Equipamentos e detalhes.
- Inspeções com agendamento, início, execução e conclusão.
- Abertura automática de não conformidades a partir de itens não conformes.
- Gestão de não conformidades.
- Equipe e perfis de acesso.
- Relatórios executivos.
- Perfil do usuário.
- Configurações do tenant.

## Build

```bash
npm run typecheck
npm run lint
npm run build
```

## Segurança aplicada

- Senhas com Argon2id e pepper server-side.
- Sessão persistida no banco com token hasheado e cookie HttpOnly.
- Rate limiting e bloqueio temporário no login.
- Erro genérico de autenticação para reduzir enumeração de usuário.
- Rotas privadas protegidas por middleware e sessão server-side.
- Queries filtradas por `tenantId`.
- RBAC em ações sensíveis de criação.
- Headers de segurança configurados no Next.
- `.env` e variações ignorados pelo Git.

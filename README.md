# NexaAmbient Enterprise Suite (`nexavor`)

Plataforma corporativa de inteligência, governança ESG e gestão de compliance ambiental para indústrias e empresas de grande porte.

---

## 🚀 Principais Funcionalidades

- **Gestão de Licenças e Condicionantes Ambientais**: Acompanhamento automatizado de prazos (LP, LI, LO), status de cumprimento e evidências.
- **Integração de Webhooks ERP (SAP / Oracle / Salesforce)**: Notificações assíncronas em tempo real com validação de assinatura criptográfica HMAC-SHA256 para eventos críticos.
- **Controle de Acesso RBAC (Role-Based Access Control)**: Restrição de módulos sensíveis (Compliance e Integrações) com perfis diferenciados:
  - **Administrador**: Acesso irrestrito a todas as abas e configurações de Webhooks.
  - **Auditor**: Acesso de leitura e auditoria a Matrizes de Risco e Planos de Ação.
  - **Técnico**: Acesso focado na operação de campo, licenças e monitoramento.
- **Automação de CI/CD**: Workflow em `.github/workflows/deploy.yml` configurado para testes, build e deploy automático na Vercel ou Firebase Hosting.
- **Exportação de Pareceres Legais**: Geração de pareceres em formato JSON padronizado e PDF executivo para compliance regulatório.
- **Assistente de IA NexaBot**: Análise automatizada de minutas de licenças e extração de condicionantes utilizando o modelo Gemini 2.5 Flash.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons.
- **Backend**: Express.js (Node.js) com suporte a runtime TypeScript.
- **IA**: `@google/genai` (Gemini API server-side).
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`).

---

## 🔧 Configuração e Execução Local

### Prerequisites

- Node.js 20+
- npm 10+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/mrcoantonioconceicao/nexavor.git

# Acesse o diretório
cd nexavor

# Instale as dependências
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
GEMINI_API_KEY=sua_chave_gemini_aqui
PORT=3000
```

### Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

### Build de Produção

```bash
npm run build
npm start
```

---

## 🔒 Segurança & RBAC

O sistema implementa autenticação com RBAC (`AuthProvider`), garantindo que apenas usuários autorizados consigam acessar abas críticas como **Auditorias & Compliance** e **Integrações & Webhooks ERP**.

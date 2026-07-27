# NexaGreen Enterprise Suite (`nexagreen`)

Plataforma corporativa de inteligência, governança ESG, inteligência preditiva e gestão de compliance ambiental para indústrias e grandes corporações.

---

## 🚀 Principais Funcionalidades

- **Dashboard ESG Preditivo & Modelagem de Cenários**:
  - Projeções de inteligência de carbono (Escopo 1, 2 e 3), consumo hídrico, demanda energética e resíduos industriais.
  - Simulador interativo de cenários operacionais (*Baseline*, *Metas de Eficiência*, *Expansão Operacional* e *Descarbonização Net-Zero*).
  - Exportação automatizada de **Relatório Preditivo Executivo em PDF** formatado para governança e conselho.

- **Scorecard ESG Comparativo entre Unidades Operacionais**:
  - Ranking dinâmico de desempenho ESG e eficiência energética entre múltiplos locais do mesmo *tenant*.
  - Destaque automático para a unidade líder em eficiência energética e intensidade operacional ($MWh/t$).
  - Filtros e ordenação por Score ESG, Eficiência Energética, Matriz Renovável (%) e Menor Pegada de $CO_2$.
  - Diagnóstico individualizado por unidade com rastreamento de projetos de retrofit e certificações (ISO 50001, LEED, ISO 14001).

- **Calendário de Compliance & Eventos Regulatórios**:
  - Visualização gráfica em grade mensal e linha do tempo para acompanhamento de prazos legais.
  - Rastreamento unificado de renovação de licenças (LP, LI, LO), vencimento de condicionantes técnicas e prazos de auditoria ESG.
  - Criação rápida e pré-preenchida de tarefas de mitigação vinculadas diretamente a eventos legais e ambientais.

- **GIS & Cartografia Digital Macrorregional**:
  - Visualização georreferenciada multi-camadas adaptada às 5 macrorregiões do Brasil (Nordeste, Sul, Sudeste, Norte e Centro-Oeste).
  - Mapeamento com coordenadas e biomas reais (Caatinga, Mata Atlântica, Cerrado, Amazônia, Pantanal, Pampa) e integração com órgãos ambientais (CPRH, INEMA, SEMACE, FEPAM, IAT, IMA, IPAAM, SEMA, etc.).

- **Gestão de Licenças e Condicionantes Ambientais**:
  - Acompanhamento automatizado de prazos, matrizes de risco, status de cumprimento e controle de evidências técnicas.

- **Integração de Webhooks ERP (SAP / Oracle / Salesforce)**:
  - Notificações assíncronas em tempo real com validação de assinatura criptográfica HMAC-SHA256 para eventos críticos.

- **Controle de Acesso RBAC (Role-Based Access Control)**:
  - Restrição de módulos sensíveis com perfis diferenciados (*Administrador*, *Auditor* e *Técnico de Operações*).

- **Assistente de IA NexaBot (Gemini 2.5 Flash)**:
  - Análise automatizada de minutas de licenças e extração inteligente de condicionantes via LLM.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons, Recharts, jsPDF, html2canvas.
- **Backend**: Express.js (Node.js) com suporte a runtime TypeScript.
- **IA**: `@google/genai` (Gemini API server-side).
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`).

---

## 🔧 Configuração e Execução Local

### Pré-requisitos

- Node.js 20+
- npm 10+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/mrcoantonioconceicao/nexagreen.git

# Acesse o diretório
cd nexagreen

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


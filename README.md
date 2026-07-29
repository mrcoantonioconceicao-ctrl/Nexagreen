# NexaGreen Enterprise Suite (`nexagreen`)

Plataforma corporativa de inteligência, governança ESG, inteligência preditiva e gestão de compliance ambiental para indústrias e grandes corporações.

---

## 🚀 Principais Funcionalidades

- **Dashboard ESG Preditivo & Modelagem de Cenários**:
  - Projeções de inteligência de carbono (Escopo 1, 2 e 3), consumo hídrico, demanda energética e resíduos industriais.
  - Simulador interativo de cenários operacionais (*Baseline*, *Metas de Eficiência*, *Expansão Operacional* e *Descarbonização Net-Zero*).
  - Exportação automatizada de **Relatório Preditivo Executivo em PDF** formatado para governança e conselho via serviço backend de PDF (`/api/reports/export-pdf`) e renderização local A4.

- **Módulo de Fiscalização de Campo com Câmera & Georreferenciamento**:
  - Transmissão em tempo real ou captura offline de relatórios de vistoria.
  - **Acesso direto à câmera do dispositivo** para registro de evidências fotográficas em campo com carimbo de marca d'água contendo coordenadas GPS (latitude e longitude) e data/hora.
  - Suporte a carregamento de fotos da galeria, quadro interativo para assinatura digital e lightbox de visualização em alta resolução.

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

- **Gestão de Licenças, Condicionantes & Pareceres Criptografados**:
  - Acompanhamento automatizado de prazos, matrizes de risco, status de cumprimento e controle de evidências técnicas.
  - Assinatura digital criptográfica RSA-2048 / SHA-256 para laudos e pareceres com geração de relatórios oficiais em PDF.

- **Integração de Webhooks ERP (SAP / Oracle / Salesforce)**:
  - Notificações assíncronas em tempo real com validação de assinatura criptográfica HMAC-SHA256 para eventos críticos.

- **Controle de Acesso RBAC (Role-Based Access Control)**:
  - Restrição de módulos sensíveis com perfis diferenciados (*Administrador*, *Auditor* e *Técnico de Operações*).

- **Assistente de IA NexaBot (Gemini API)**:
  - Análise automatizada de minutas de licenças e extração inteligente de condicionantes via LLM.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons, Recharts, jsPDF, html2canvas.
- **Backend**: Express.js (Node.js) com suporte a runtime TypeScript e PDFKit.
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

## 📡 Endpoints da API REST & Integrações ERP

| Método | Endpoint | Descrição | Nível RBAC |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck e status dos serviços do servidor | Público |
| `POST` | `/api/licenses/analyze` | Análise automatizada de minutas e extração de condicionantes com Gemini API | Técnico / Admin |
| `POST` | `/api/reports/export-pdf` | Geração e stream binário de Relatórios Executivos e Técnicos em PDF | Técnico / Admin |
| `POST` | `/api/webhooks/erp` | Recebimento de eventos assíncronos de ERPs (SAP/Oracle) com validação HMAC-SHA256 | Integração / Admin |
| `GET` | `/api/audit/logs` | Trilha de auditoria imutável para eventos de compliance e segurança | Auditor / Admin |

---

## 🔒 Segurança, Rastreabilidade & SIEM Logs

O sistema implementa autenticação com **RBAC (`AuthProvider`)**, além de suporte a **Trilhas de Auditoria (Audit Logs)** com timestamp, identificação do usuário e evento realizado. As assinaturas dos Webhooks utilizam **HMAC-SHA256** para prevenção de reuso e falsificação de requisições.

---

## 🗺️ Roadmap de Evolução & Expansão Global

- **Internacionalização & Padrões Globais**: Expansão de frameworks regulatórios para suporte a **EU Taxonomy**, **EPA (EUA)** e relatórios automatizados alinhados ao **GRI (Global Reporting Initiative)** e **SASB**.
- **Arquitetura Enterprise em Microserviços**: Evolução modular para containers isolados em **Kubernetes / NestJS** visando alta volumetria de dados de IoT industrial.
- **Rastreabilidade Imutável**: Implementação de *ledger* de auditoria descentralizado para verificação de créditos de carbono e garantias de origem de energia renovável.



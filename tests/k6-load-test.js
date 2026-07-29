import http from 'k6/http';
import { check, sleep, group } from 'k6';
import crypto from 'k6/crypto';
import { Counter, Rate, Trend } from 'k6/metrics';

// ============================================================================
// METRICAS CUSTOMIZADAS
// ============================================================================
export const pdfGenerationTime = new Trend('pdf_generation_time');
export const licenseAnalysisTime = new Trend('license_analysis_time');
export const erpWebhookTime = new Trend('erp_webhook_time');
export const auditLogTime = new Trend('audit_log_time');
export const errorRate = new Rate('custom_error_rate');
export const successfulRequests = new Counter('successful_requests');

// ============================================================================
// CONFIGURAÇÃO DOS CENÁRIOS DE CARGA (K6)
// ============================================================================
export const options = {
  scenarios: {
    // Cenário 1: Teste de Carga de Rotina (Baseline)
    routine_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 5000 },  // Ramp-up inicial para 5.000 VUs
        { duration: '5m', target: 5000 },  // Carga constante
        { duration: '1m', target: 0 },     // Ramp-down
      ],
      gracefulRampDown: '30s',
      exec: 'routineFlow',
    },

    // Cenário 2: Teste de Estresse (Pico de 100.000 Requisições em 5 min)
    stress_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 1000,
      timeUnit: '1s',
      preAllocatedVUs: 10000,
      maxVUs: 50000,
      stages: [
        { duration: '1m', target: 2000 },   // 2.000 req/s
        { duration: '2m', target: 10000 },  // Pico de 10.000 req/s (10k req/s = 600k req/min)
        { duration: '2m', target: 10000 },  // Sustenta pico de 10k req/s por 2 minutos
        { duration: '1m', target: 500 },    // Resfriamento
      ],
      exec: 'spikeFlow',
      startTime: '8m', // Inicia após o teste de rotina
    },

    // Cenário 3: Teste de Endurance (Simulação de 50.000 Usuários por Período Prolongado)
    endurance_soak: {
      executor: 'constant-vus',
      vus: 5000, // Escalonado proporcionalmente no cluster de agentes k6 (ex: 10 distribuidores = 50.000 VUs totais)
      duration: '1h', // Pode ser expandido para 24h em pipelines de CI/CD Noturno
      exec: 'enduranceFlow',
      startTime: '15m',
    },
  },

  // THRESHOLDS DE DESEMPENHO SLA/SLO
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% das reqs < 200ms
    custom_error_rate: ['rate<0.001'],             // Taxa de erro < 0.1%
    pdf_generation_time: ['p(95)<1500'],           // Exportação de PDF < 1.5s
    license_analysis_time: ['p(95)<800'],          // Análise de Minuta < 800ms
    erp_webhook_time: ['p(95)<100'],               // Webhook ERP < 100ms
  },
};

// ============================================================================
// CONFIGURAÇÕES E CHAVES
// ============================================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = __ENV.WEBHOOK_SECRET || 'nexagreen-erp-webhook-secret-key-2026';

// Headers de Usuários com Perfis RBAC
const USERS = {
  admin: { tenantId: 'tenant-1', role: 'Administrador', token: 'Bearer admin-jwt-token' },
  auditor: { tenantId: 'tenant-1', role: 'Auditor', token: 'Bearer auditor-jwt-token' },
  technician: { tenantId: 'tenant-1', role: 'Técnico', token: 'Bearer technician-jwt-token' },
};

// ============================================================================
// FUNÇÃO UTILITÁRIA DE ASSINATURA HMAC-SHA256
// ============================================================================
function generateHmacSignature(payloadStr, secret) {
  return crypto.hmac('sha256', secret, payloadStr, 'hex');
}

// ============================================================================
// CENÁRIO 1: FLUXO DE ROTINA (RBAC + CONSULTAS + AUDITORIA)
// ============================================================================
export function routineFlow() {
  const user = USERS.admin;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': user.token,
    'x-tenant-id': user.tenantId,
  };

  group('01. Dashboard ESG & Healthcheck', function () {
    const resHealth = http.get(`${BASE_URL}/api/health`);
    const checkHealth = check(resHealth, { 'Health status 200': (r) => r.status === 200 });
    errorRate.add(!checkHealth);

    const resAudit = http.get(`${BASE_URL}/api/audit/logs`, { headers });
    const checkAudit = check(resAudit, {
      'Audit logs 200': (r) => r.status === 200,
      'Audit logs e array': (r) => Array.isArray(r.json()),
    });
    auditLogTime.add(resAudit.timings.duration);
    errorRate.add(!checkAudit);
  });

  sleep(1);
}

// ============================================================================
// CENÁRIO 2: FLUXO DE ESTRESSE DE ALTA VOLUMETRIA (EXPORTAÇÃO DE PDF + WEBHOOKS ERP)
// ============================================================================
export function spikeFlow() {
  const user = USERS.technician;

  // 1. Exportação de Relatório PDF em Lote
  group('02. Exportação de Relatórios PDF', function () {
    const pdfPayload = JSON.stringify({
      tenantId: user.tenantId,
      reportType: 'licenses',
      reportViewMode: 'executive',
      statusFilter: 'all',
    });

    const pdfRes = http.post(`${BASE_URL}/api/reports/export-pdf`, pdfPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': user.token,
      },
      responseType: 'binary',
    });

    const isPdfOk = check(pdfRes, {
      'PDF status 200': (r) => r.status === 200,
      'PDF header correto': (r) => r.headers['Content-Type'] === 'application/pdf',
      'PDF possui bytes > 1000': (r) => r.body && r.body.byteLength > 1000,
    });

    pdfGenerationTime.add(pdfRes.timings.duration);
    errorRate.add(!isPdfOk);
    if (isPdfOk) successfulRequests.add(1);
  });

  // 2. Webhook de Integração ERP com Validação HMAC-SHA256
  group('03. Processamento de Webhooks ERP SAP/Oracle', function () {
    const webhookPayload = JSON.stringify({
      eventId: `evt-${Math.floor(Math.random() * 1000000)}`,
      eventType: 'TELEMETRY_ALERT',
      tenantId: user.tenantId,
      sourceSystem: 'SAP_S4HANA_ENVIRONMENTAL',
      timestamp: new Date().toISOString(),
      data: {
        parameter: 'pH_Efluente',
        value: 8.9,
        threshold: 8.5,
        location: 'Estação de Tratamento A',
      },
    });

    const signature = generateHmacSignature(webhookPayload, WEBHOOK_SECRET);

    const webhookRes = http.post(`${BASE_URL}/api/webhooks/erp`, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Nexa-Signature': signature,
      },
    });

    const isWebhookOk = check(webhookRes, {
      'Webhook status 200/202': (r) => r.status === 200 || r.status === 202,
      'Webhook signature confirmada': (r) => r.json('status') === 'received',
    });

    erpWebhookTime.add(webhookRes.timings.duration);
    errorRate.add(!isWebhookOk);
    if (isWebhookOk) successfulRequests.add(1);
  });
}

// ============================================================================
// CENÁRIO 3: FLUXO DE ENDURANCE (ANÁLISE DE LICENÇAS COM GEMINI AI)
// ============================================================================
export function enduranceFlow() {
  const user = USERS.admin;

  group('04. AI License Analyzer & Audit Tracing', function () {
    const analyzePayload = JSON.stringify({
      documentText: 'LICENÇA AMBIENTAL DE OPERAÇÃO Nº 4092/2026. A EMPRESA DEVE MANTER O MONITORAMENTO TRIMESTRAL DE RUÍDO PERIMETRAL ABAIXO DE 65 DBA.',
    });

    const analyzeRes = http.post(`${BASE_URL}/api/licenses/analyze`, analyzePayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': user.token,
      },
    });

    const isAnalyzeOk = check(analyzeRes, {
      'Analyze status 200': (r) => r.status === 200,
      'Extração de condicionantes presente': (r) => r.json('extractedConditions') !== undefined,
    });

    licenseAnalysisTime.add(analyzeRes.timings.duration);
    errorRate.add(!isAnalyzeOk);
    if (isAnalyzeOk) successfulRequests.add(1);
  });

  sleep(0.5);
}

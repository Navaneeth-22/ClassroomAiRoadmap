import { useState } from "react";

const phases = [
  {
    id: 1,
    title: "Foundation",
    subtitle: "Monorepo · API Gateway · Auth",
    weeks: "Week 1–2",
    color: "#00D4FF",
    accent: "#003344",
    icon: "⬡",
    status: "start",
    overview: "Establish the project skeleton, authentication backbone, and API gateway. Every subsequent service depends on this being rock-solid.",
    milestones: [
      "Monorepo initialized and CI green",
      "API Gateway routing requests",
      "JWT auth flow working end-to-end",
      "Docker Compose boots all infra dependencies",
    ],
    tasks: [
      {
        category: "Monorepo Setup",
        color: "#00D4FF",
        items: [
          { task: "Initialize Gradle/Maven multi-module monorepo", detail: "One repo, modules: api-gateway, workflow-service, execution-engine, ai-agent, connector-registry, notification-service, audit-service, shared-libs", time: "4h" },
          { task: "Configure shared-libs module", detail: "Common DTOs, exceptions, Kafka event schemas (Avro), OpenAPI annotations, security utilities", time: "3h" },
          { task: "Set up GitHub Actions baseline pipeline", detail: "Trigger on PR: compile → unit test → build Docker image. Use matrix builds per service module.", time: "3h" },
          { task: "Docker Compose for local dev", detail: "Services: PostgreSQL, Redis, MongoDB, Kafka+Zookeeper, Keycloak, Elasticsearch. Use health checks & depends_on.", time: "4h" },
        ],
      },
      {
        category: "API Gateway (Spring Cloud Gateway)",
        color: "#00FFAA",
        items: [
          { task: "Spring Cloud Gateway project scaffold", detail: "Dependencies: spring-cloud-gateway, spring-security, spring-data-redis-reactive, resilience4j", time: "2h" },
          { task: "JWT validation filter", detail: "Extract Bearer token, validate signature against Keycloak JWKS endpoint, inject user context (userId, tenantId, roles) into downstream headers", time: "5h" },
          { task: "Redis Token Bucket rate limiter", detail: "Implement RequestRateLimiter GatewayFilter. Config: 100 req/min per userId, 1000 req/min per tenantId. Separate limits for AI endpoints.", time: "4h" },
          { task: "Resilience4j circuit breakers", detail: "Per-route circuit breakers. Sliding window of 10 requests, 50% failure threshold opens circuit. Fallback returns 503 with Retry-After header.", time: "3h" },
          { task: "Route configuration", detail: "Route table: /api/workflows/** → workflow-service, /api/execute/** → execution-engine, /api/ai/** → ai-agent, /api/connectors/** → connector-registry", time: "2h" },
          { task: "SSL termination + CORS", detail: "TLS cert via cert-manager (K8s) or self-signed for local. CORS config: allowedOrigins from env var, expose headers: X-Request-ID, X-Tenant-ID", time: "2h" },
        ],
      },
      {
        category: "Auth (Keycloak + Spring Security)",
        color: "#FF6B35",
        items: [
          { task: "Keycloak realm setup", detail: "Realm: flowmind. Clients: flowmind-web (public, PKCE), flowmind-api (confidential). Roles: ADMIN, DEVELOPER, VIEWER. Realm-level token lifespan: access=15min, refresh=7d", time: "3h" },
          { task: "OAuth2 Resource Server config", detail: "Each microservice: spring-security-oauth2-resource-server. Configure jwk-set-uri pointing to Keycloak. Stateless session. Custom JwtAuthConverter to extract tenantId claim.", time: "4h" },
          { task: "Multi-tenancy security context", detail: "TenantContextHolder (ThreadLocal). Gateway injects X-Tenant-ID header. Each service reads it and sets in context for DB query scoping.", time: "5h" },
          { task: "Service-to-service auth", detail: "Client credentials flow between microservices. Each service has a Keycloak service account. Use Spring's OAuth2AuthorizedClientManager for automatic token refresh.", time: "3h" },
        ],
      },
    ],
    techStack: ["Spring Cloud Gateway", "Keycloak", "Redis", "Resilience4j", "Docker Compose", "GitHub Actions", "Gradle"],
    pitfalls: [
      "Don't hardcode Keycloak URLs — use env vars from day 1",
      "Redis rate limiter needs Lua scripting — test atomicity under load",
      "Set X-Request-ID at gateway and propagate to ALL downstream services for tracing",
    ],
  },
  {
    id: 2,
    title: "Orchestration",
    subtitle: "Workflow Engine · Kafka · State Machine",
    weeks: "Week 3–4",
    color: "#A855F7",
    accent: "#1a0033",
    icon: "◈",
    status: "core",
    overview: "The beating heart of FlowMind. Build the DAG execution model, Kafka event backbone, and persistent state machine. This is the hardest phase — get it right.",
    milestones: [
      "Create/read/update/delete workflows via API",
      "Kafka topics provisioned and producing/consuming events",
      "Cron and webhook triggers firing correctly",
      "State machine persisting workflow run states to Postgres",
    ],
    tasks: [
      {
        category: "Kafka Infrastructure",
        color: "#A855F7",
        items: [
          { task: "Kafka topic provisioning", detail: "Topics: workflow.triggers, workflow.execution.steps, workflow.execution.results, ai.agent.requests, ai.agent.responses, connector.events, audit.logs, dead.letter.queue. Partitions: 12 each. Replication: 3 (prod). Retention: 7 days.", time: "3h" },
          { task: "Confluent Schema Registry + Avro schemas", detail: "Define Avro schemas for: WorkflowTriggerEvent, StepExecutionEvent, StepResultEvent, AuditLogEntry. Enable schema evolution (backward compatibility). Generate Java POJOs with avro-maven-plugin.", time: "6h" },
          { task: "Kafka producer config (Outbox Pattern)", detail: "Create outbox table in Postgres. Service writes to DB + outbox in one transaction. Separate OutboxRelayService polls table and publishes to Kafka. Ensures exactly-once semantics.", time: "8h" },
          { task: "Kafka consumer groups", detail: "Consumer group per service. workflow-service: workflow-orchestrator-cg. execution-engine: step-executor-cg. Manual offset commit after successful processing. DLQ routing on 3 consecutive failures.", time: "5h" },
          { task: "Kafka Streams — workflow analytics", detail: "Real-time streams: count executions per workflow (tumbling window 1min), compute rolling error rate, emit to metrics topic consumed by TimescaleDB.", time: "6h" },
        ],
      },
      {
        category: "Workflow Orchestration Service",
        color: "#EC4899",
        items: [
          { task: "DAG data model", detail: "Entities: Workflow (id, tenantId, name, version, status), WorkflowStep (id, workflowId, type, config JSONB, position, retryConfig), StepEdge (fromStepId, toStepId, condition). Use JSONB for flexible step configs.", time: "5h" },
          { task: "Workflow CRUD API", detail: "POST /workflows (create v1), GET /workflows/{id}, PUT /workflows/{id} (creates new version), DELETE /workflows/{id} (soft delete). Versioning: each edit creates new version record. Rollback endpoint: POST /workflows/{id}/rollback/{version}", time: "6h" },
          { task: "Spring State Machine", detail: "Workflow run states: PENDING → RUNNING → PAUSED → COMPLETED | FAILED | CANCELLED. State transitions triggered by Kafka events. Persist state to postgres with StateMachineRuntimePersister. Each workflow run = one state machine instance.", time: "8h" },
          { task: "DAG validation engine", detail: "On workflow save: detect cycles (DFS), validate all step configs against JSON Schema, ensure all edge references valid step IDs, check for unreachable nodes. Return detailed validation errors.", time: "5h" },
          { task: "Trigger management", detail: "WebhookTrigger: generate unique URL (/triggers/{uuid}), HMAC-SHA256 signature verification on receipt, publish to workflow.triggers topic. CronTrigger: Quartz cluster-mode with DB job store (prevents duplicate fires in multi-instance), publish cron fire to Kafka.", time: "7h" },
        ],
      },
    ],
    techStack: ["Apache Kafka", "Confluent Schema Registry", "Avro", "Spring State Machine", "Quartz Scheduler", "PostgreSQL JSONB", "Kafka Streams"],
    pitfalls: [
      "Outbox Pattern is non-negotiable — never publish to Kafka outside a DB transaction",
      "Quartz MUST run in cluster mode with DB job store or you'll get duplicate cron fires",
      "DAG cycle detection must run before saving — a cyclic workflow will deadlock the execution engine",
      "Version every workflow change — users WILL need rollback",
    ],
  },
  {
    id: 3,
    title: "Execution",
    subtitle: "Virtual Threads · Retry Logic · Connectors",
    weeks: "Week 5–6",
    color: "#F59E0B",
    accent: "#2a1500",
    icon: "▣",
    status: "core",
    overview: "Build the execution engine that actually runs workflow steps, implement connectors, and handle all the messy real-world concerns: retries, timeouts, errors, and sandboxing.",
    milestones: [
      "End-to-end workflow execution working (trigger → steps → result)",
      "Gmail and Slack connectors functional",
      "Retry with exponential backoff tested",
      "Dead letter queue receiving failed messages",
    ],
    tasks: [
      {
        category: "Execution Engine (Java 21 Virtual Threads)",
        color: "#F59E0B",
        items: [
          { task: "Virtual thread executor setup", detail: "Spring Boot 3.2+ with virtual threads: spring.threads.virtual.enabled=true. Executor: Executors.newVirtualThreadPerTaskExecutor(). Each step execution = one virtual thread. Enables 10K+ concurrent executions with minimal memory vs platform threads.", time: "3h" },
          { task: "Step execution pipeline", detail: "StepExecutor interface. Implementations: HttpStepExecutor, AIStepExecutor, ConnectorStepExecutor, CodeStepExecutor, DelayStepExecutor. Factory pattern: StepExecutorFactory resolves by step type. Each executor returns StepResult(status, output, duration).", time: "8h" },
          { task: "Retry with exponential backoff", detail: "Per-step RetryConfig: maxAttempts, initialDelay, multiplier, maxDelay, retryableExceptions. Implement with Resilience4j Retry. On final failure: publish to DLQ topic with full context (workflowRunId, stepId, attempt count, exception).", time: "5h" },
          { task: "Timeout management", detail: "Each step has configurable timeout (default 30s, max 5min for AI steps). Implement with CompletableFuture.orTimeout(). On timeout: cancel virtual thread, mark step TIMED_OUT, apply retry policy.", time: "4h" },
          { task: "Sandboxed execution contexts", detail: "Each workflow run gets isolated context: WorkflowRunContext(runId, tenantId, variables, stepOutputs). Variable interpolation engine: resolve ${steps.step1.output.email} in step configs. Tenant data never bleeds across runs.", time: "6h" },
          { task: "Saga choreography", detail: "On step failure: publish CompensationEvent to Kafka. Each completed step registers a compensation handler (e.g., if Slack message sent but next step fails, log the sent message ID for audit). Full saga log stored in MongoDB.", time: "7h" },
        ],
      },
      {
        category: "Connector Registry Service",
        color: "#10B981",
        items: [
          { task: "Plugin architecture", detail: "Connector interface: ConnectorDefinition(name, version, authType, triggerSchemas[], actionSchemas[]). Load connectors from classpath at startup. Each connector is a Spring @Component. Hot-reload via custom ConnectorRegistry bean.", time: "6h" },
          { task: "OAuth2 credential vault", detail: "Store connector OAuth tokens encrypted (AES-256-GCM) in Postgres. Key stored in HashiCorp Vault. ConnectorCredentialService: retrieve → decrypt → auto-refresh if expired using refresh token → re-encrypt → store.", time: "7h" },
          { task: "Gmail connector", detail: "Triggers: new email (poll every 60s via Gmail API), email matching filter. Actions: send email, reply, label, archive. OAuth2 scopes: gmail.readonly, gmail.send. Implement incremental sync with historyId.", time: "6h" },
          { task: "Slack connector", detail: "Triggers: new message in channel (Slack Events API webhook). Actions: post message, update message, create channel, invite user. Use Slack Bolt for Java. Verify request signature (HMAC-SHA256).", time: "5h" },
          { task: "GitHub connector", detail: "Triggers: push event, PR opened/merged, issue created (GitHub webhooks). Actions: create issue, add comment, merge PR, create branch. Use GitHub App auth (JWT → installation token).", time: "5h" },
          { task: "HTTP connector (generic)", detail: "Actions: GET/POST/PUT/DELETE any URL. Config: url, method, headers (support secret interpolation), body template, response mapping. Supports OAuth2/API key/Basic auth. This is the escape hatch for any API not natively supported.", time: "4h" },
        ],
      },
    ],
    techStack: ["Java 21 Virtual Threads", "Resilience4j", "Spring Plugin", "HashiCorp Vault", "Gmail API", "Slack Bolt", "GitHub Apps API"],
    pitfalls: [
      "Virtual threads + ThreadLocal: use ScopedValue (Java 21) instead of ThreadLocal for workflow context",
      "OAuth token refresh must be atomic — use Redis distributed lock to prevent race conditions",
      "Never log connector payloads in plain text — implement PII-aware log scrubbing from day 1",
      "Gmail polling is expensive — cache historyId and use incremental sync, not full re-fetch",
    ],
  },
  {
    id: 4,
    title: "Intelligence",
    subtitle: "AI Agents · RAG Pipeline · Multi-LLM",
    weeks: "Week 7–8",
    color: "#EC4899",
    accent: "#2a0016",
    icon: "◎",
    status: "core",
    overview: "The differentiator. Build the AI agent framework with ReAct loops, RAG pipeline, multi-provider LLM support, and human-in-the-loop. This is what makes FlowMind not just another Zapier.",
    milestones: [
      "Natural language → workflow JSON generation working",
      "AI step types executing in workflows",
      "RAG pipeline ingesting and querying documents",
      "Multi-agent supervisor/worker pattern functional",
    ],
    tasks: [
      {
        category: "LLM Integration Layer",
        color: "#EC4899",
        items: [
          { task: "Unified LLM adapter (LangChain4j)", detail: "LlmProvider interface: complete(prompt, options) → LlmResponse. Implementations: OpenAiProvider (GPT-4o), AnthropicProvider (Claude 3.5), GeminiProvider. Config: per-request model selection, fallback chain (primary → secondary on rate limit/error). All providers behind one interface.", time: "6h" },
          { task: "Prompt versioning system", detail: "PromptTemplate entity: id, name, version, template, variables[], modelConfig. Store in Postgres. PromptRenderer: Mustache template engine for variable substitution. A/B testing: route X% of requests to variant B, track token cost + quality score.", time: "5h" },
          { task: "LLM observability", detail: "LlmCallInterceptor: log every request/response (with PII redaction via regex patterns + NER model). Track: provider, model, promptTokens, completionTokens, latencyMs, cost (per-model pricing table). Emit to audit.logs Kafka topic.", time: "5h" },
          { task: "Token budget management", detail: "Per-tenant daily token quota (configurable). TokenBudgetService: check quota before call → decrement on success → emit alert at 80%/100%. Store usage in Redis (daily counter) + TimescaleDB (historical).", time: "4h" },
        ],
      },
      {
        category: "AI Agent Service (ReAct Pattern)",
        color: "#8B5CF6",
        items: [
          { task: "ReAct agent loop", detail: "Loop: Thought → Action → Observation → repeat until Final Answer or max iterations. Each iteration: (1) LLM generates Thought+Action, (2) parse Action (tool name + args), (3) execute tool, (4) append Observation to context, (5) check for FinalAnswer token. Max 15 iterations per agent run.", time: "8h" },
          { task: "Tool framework", detail: "Tool interface: execute(args: Map) → ToolResult. Built-in tools: SearchTool (semantic search), HttpTool (call any API), ConnectorTool (wraps connector actions), CodeTool (execute sandboxed JS/Python). Tools registered in ToolRegistry, injected into agent prompt as JSON schema.", time: "7h" },
          { task: "Agent memory", detail: "Short-term: sliding window of last N messages in prompt context (configurable N per agent). Long-term: embed key facts → store in pgvector. AgentMemoryService: before each run, semantic search long-term memory for relevant facts, prepend to system prompt.", time: "6h" },
          { task: "Multi-agent orchestration", detail: "SupervisorAgent: decomposes task into subtasks, assigns to WorkerAgents, aggregates results. WorkerAgent: executes single focused task with its own tool set. Communication via Kafka (ai.agent.requests / ai.agent.responses). Supervisor polls for worker completions.", time: "8h" },
          { task: "Human-in-the-loop", detail: "HumanApprovalStep type: workflow pauses, emits ApprovalRequired event, sends notification (email/Slack) with approval link (signed JWT URL). Timeout: auto-reject after N hours. POST /workflows/runs/{runId}/approve or /reject resumes state machine.", time: "6h" },
        ],
      },
      {
        category: "RAG Pipeline",
        color: "#06B6D4",
        items: [
          { task: "Document ingestion pipeline", detail: "POST /knowledge/ingest: accept PDF, DOCX, TXT, HTML, URLs. Tika for text extraction. Chunking: recursive character splitter (chunk=512 tokens, overlap=50). Store raw doc in MongoDB, chunks in Postgres.", time: "5h" },
          { task: "Embedding + vector store", detail: "Embed chunks via OpenAI text-embedding-3-large (3072 dims). Store in pgvector: CREATE EXTENSION vector; column: embedding vector(3072). Index: CREATE INDEX USING ivfflat (embedding vector_cosine_ops). LangChain4j EmbeddingStore wrapper.", time: "5h" },
          { task: "Semantic search", detail: "Query → embed query → pgvector similarity search (top-K=5, cosine distance) → rerank with cross-encoder → return chunks + source metadata. Hybrid search: combine vector score (0.7) + BM25 full-text score (0.3) via Elasticsearch.", time: "5h" },
          { task: "AI Workflow Builder", detail: "POST /ai/workflows/generate: {description: 'When I get a GitHub PR, summarize it with AI and post to Slack'}. System prompt: workflow JSON schema + connector catalog. LLM generates DAG JSON. Validate schema. Return workflow definition ready to save.", time: "6h" },
        ],
      },
    ],
    techStack: ["LangChain4j", "OpenAI GPT-4o", "Anthropic Claude", "pgvector", "Apache Tika", "Mustache", "PostgreSQL extensions"],
    pitfalls: [
      "ReAct loops can spiral — ALWAYS enforce max iteration limit and detect repeated actions",
      "pgvector ivfflat index needs tuning: lists=sqrt(n_rows). Re-index when data grows 10x",
      "Human-in-the-loop approval URLs must be signed + short-lived (1 hour) to prevent replay attacks",
      "LLM costs will surprise you — implement hard limits per tenant BEFORE going to production",
    ],
  },
  {
    id: 5,
    title: "Observability",
    subtitle: "Kubernetes · OTel · Prometheus · ELK",
    weeks: "Week 9–10",
    color: "#10B981",
    accent: "#001a0f",
    icon: "⬢",
    status: "infra",
    overview: "You can't operate what you can't see. Build the full observability stack, deploy to Kubernetes, and set up the CI/CD pipeline that will carry you to production.",
    milestones: [
      "All services deployed to K8s with Helm charts",
      "Distributed traces visible in Jaeger",
      "Grafana dashboards showing key metrics",
      "CI/CD pipeline deploying to staging automatically",
    ],
    tasks: [
      {
        category: "Kubernetes & Helm",
        color: "#10B981",
        items: [
          { task: "Helm chart per service", detail: "Each service: Chart.yaml, values.yaml (image, replicas, resources, env, ingress), templates/deployment.yaml, service.yaml, hpa.yaml, pdb.yaml. Shared library chart for common labels, probes, security context. Values override per environment.", time: "8h" },
          { task: "HPA configuration", detail: "HPA per service: min=2, max=10 replicas. Scale on: CPU>70% OR custom metric (Kafka consumer lag > 1000 msgs via KEDA). Scale-up: 60s stabilization. Scale-down: 300s to avoid thrashing.", time: "4h" },
          { task: "Istio service mesh", detail: "Deploy Istio. PeerAuthentication: STRICT mTLS for all services. DestinationRule: connection pool, outlier detection (5xx circuit breaker). VirtualService: canary releases (10% → 50% → 100% traffic shifting). Kiali for visual mesh topology.", time: "7h" },
          { task: "ArgoCD GitOps", detail: "ArgoCD watches infra/k8s/ directory. Separate Application per service + environment (staging, prod). Sync policy: auto-sync on merge to main. Diff preview in PR comments via argocd-diff action. Rollback: argocd app rollback or Git revert.", time: "5h" },
          { task: "Terraform IaC", detail: "Modules: vpc, eks-cluster, rds-postgres, elasticache-redis, msk-kafka, ecr-repos, iam-roles. Separate state files per environment (S3 backend). terraform plan on PR → terraform apply on merge. Never manually touch cloud resources.", time: "10h" },
        ],
      },
      {
        category: "Observability Stack",
        color: "#F59E0B",
        items: [
          { task: "OpenTelemetry instrumentation", detail: "otel-java-agent.jar attached to each service JVM (-javaagent). Auto-instruments: Spring MVC, Kafka, JDBC, Redis, HTTP clients. Custom spans for: DAG execution, AI agent loops, connector calls. Propagate trace context via W3C Trace Context headers.", time: "5h" },
          { task: "Jaeger distributed tracing", detail: "Deploy Jaeger (all-in-one for staging, distributed for prod). OTel collector → Jaeger. Key traces to verify: full workflow execution (trigger → step1 → step2 → result), AI agent ReAct loop iterations, Kafka consumer-to-producer chains.", time: "3h" },
          { task: "Prometheus + Grafana", detail: "Micrometer metrics exposed at /actuator/prometheus. Key custom metrics: workflow_executions_total (counter, labels: tenantId, status), step_execution_duration_seconds (histogram), ai_token_usage_total (counter, labels: provider, model), kafka_consumer_lag (gauge). 4 Grafana dashboards: Platform Overview, Workflow Execution, AI Usage, Infrastructure.", time: "8h" },
          { task: "ELK structured logging", detail: "logstash-logback-encoder: JSON logs with fields: timestamp, level, service, traceId, spanId, tenantId, userId, message. Filebeat per node → Logstash (enrich, filter) → Elasticsearch. Kibana: saved searches for error analysis, tenant-scoped data views with RLS.", time: "6h" },
          { task: "Alerting rules", detail: "Prometheus AlertManager rules: P99 latency > 500ms (warn), > 2s (critical). Error rate > 5% (warn), > 20% (critical). Kafka consumer lag > 10K (critical). AI cost spike > 2x hourly average. Route: warn → Slack #alerts, critical → PagerDuty + Slack.", time: "4h" },
        ],
      },
      {
        category: "CI/CD Pipeline",
        color: "#6366F1",
        items: [
          { task: "GitHub Actions full pipeline", detail: "Stages: (1) test-matrix (unit tests per service, parallel), (2) integration-tests (Testcontainers, ~10min), (3) sonarqube + OWASP dep check, (4) docker build + push to ECR (multi-stage, distroless final), (5) helm upgrade staging, (6) smoke tests, (7) manual approval gate, (8) helm upgrade prod.", time: "8h" },
          { task: "Testcontainers integration tests", detail: "Per service: @Testcontainers with real PostgresContainer, KafkaContainer, RedisContainer, MongoDBContainer. Test: full workflow lifecycle, Kafka consumer-producer round trip, DB migrations. Run in GitHub Actions with --no-daemon and optimized container startup.", time: "6h" },
          { task: "Gatling load tests", detail: "Scenarios: (1) 5000 concurrent users creating+triggering workflows, (2) 100K Kafka events/sec burst, (3) AI agent parallel requests. Assertions: P99 < 200ms, zero 5xx. Run nightly. Fail pipeline if regression > 10%. Publish HTML report as GitHub Actions artifact.", time: "6h" },
        ],
      },
    ],
    techStack: ["Kubernetes", "Helm", "Istio", "ArgoCD", "Terraform", "OpenTelemetry", "Jaeger", "Prometheus", "Grafana", "ELK Stack", "Gatling"],
    pitfalls: [
      "Set resource limits on ALL containers — one unbounded service will starve the cluster",
      "Istio mTLS strict mode will break services not yet enrolled — use PERMISSIVE first, then STRICT",
      "Testcontainers in CI need Docker socket — use GitHub Actions ubuntu-latest with docker service",
      "Grafana dashboards should be code (JSON in Git) — never manually create dashboards in prod",
    ],
  },
  {
    id: 6,
    title: "Frontend",
    subtitle: "React Flow · Monaco · WebSocket · Polish",
    weeks: "Week 11–12",
    color: "#F97316",
    accent: "#2a0e00",
    icon: "◇",
    status: "final",
    overview: "Build the visual workflow builder and monitoring dashboard. This is what recruiters and users will actually see — invest in polish. The DAG editor, live execution view, and AI builder are your showpieces.",
    milestones: [
      "Visual DAG builder drag-and-drop working",
      "Real-time execution monitoring via WebSocket",
      "AI natural language workflow generation UI",
      "Demo video recorded and uploaded",
    ],
    tasks: [
      {
        category: "Visual DAG Builder (React Flow)",
        color: "#F97316",
        items: [
          { task: "React Flow canvas setup", detail: "Install @xyflow/react. Custom node types: TriggerNode, ActionNode, AINode, ConditionNode, HumanApprovalNode. Custom edge with condition label. Minimap + controls. Auto-layout algorithm (dagre) for AI-generated workflows.", time: "6h" },
          { task: "Node configuration panels", detail: "Sidebar panel per node type. Form fields driven by connector JSON Schema (react-jsonschema-form). Real-time validation. Secret fields: display as password, stored encrypted. Variable picker: autocomplete ${steps.X.output.Y} from step dependency graph.", time: "8h" },
          { task: "Workflow toolbar", detail: "Actions: Save (POST with optimistic UI), Publish (activate), Duplicate, Version history dropdown, Export JSON, Test Run. Keyboard shortcuts: Ctrl+S save, Ctrl+Z undo (custom history stack with useReducer), Delete key removes selected node.", time: "5h" },
          { task: "AI workflow builder UI", detail: "Floating prompt bar (Cmd+K): type natural language description. Streaming response from AI endpoint (SSE). Show JSON being generated live, then animate nodes appearing on canvas one by one. Editable before save.", time: "6h" },
        ],
      },
      {
        category: "Execution Monitoring",
        color: "#EC4899",
        items: [
          { task: "WebSocket real-time updates", detail: "Spring WebFlux WebSocket endpoint: /ws/runs/{runId}. Push StepStatusUpdate events: {stepId, status, startTime, endTime, output}. React: useWebSocket hook. Canvas: highlight running node (pulse animation), completed (green), failed (red shake animation).", time: "6h" },
          { task: "Execution history dashboard", detail: "Table: workflow runs with status, duration, trigger type, started by. Filters: date range, status, workflow name. Click run → drill down to step timeline (Gantt-style). Step detail: input/output payloads, retry history, logs viewer.", time: "7h" },
          { task: "Monaco editor integration", detail: "Code step node: Monaco editor with TypeScript/Python mode. IntelliSense: inject workflow context types (steps.X.output schema). Themes: match app dark mode. Ctrl+Enter runs step in isolation for testing.", time: "4h" },
        ],
      },
      {
        category: "Polish & Portfolio Prep",
        color: "#A855F7",
        items: [
          { task: "Observability dashboards", detail: "Grafana: 4 pre-built dashboards exported as JSON to repo. Screenshots for README: Platform Overview showing 10K executions/hr, AI Usage showing cost per workflow, Infrastructure showing K8s pod scaling event.", time: "3h" },
          { task: "Architecture diagrams (C4 Model)", detail: "Use Structurizr or draw.io: Level 1 (System Context), Level 2 (Container — all 7 services + DBs + Kafka), Level 3 (Component — Execution Engine internals, AI Agent internals). Export as PNG + embed in README.", time: "4h" },
          { task: "README & documentation", detail: "README sections: Architecture Overview (diagram), Quick Start (docker compose up — running in 3 commands), Service descriptions, API docs links (Swagger UI per service), Local dev guide, Deploy to K8s guide. OpenAPI 3.0 spec committed to repo.", time: "4h" },
          { task: "Demo video", detail: "2-3 min screen recording: (1) type English description → AI generates workflow on canvas (30s), (2) add AI summarization step + Slack notification (30s), (3) trigger via webhook → watch live execution, step-by-step highlighting (45s), (4) show Grafana metrics spike (15s). Record with Loom.", time: "3h" },
        ],
      },
    ],
    techStack: ["React", "TypeScript", "React Flow", "Monaco Editor", "shadcn/ui", "Spring WebFlux WebSocket", "Zustand", "TanStack Query"],
    pitfalls: [
      "React Flow re-renders on every node position change — memoize node components aggressively",
      "WebSocket reconnect logic is critical — implement exponential backoff with state reconciliation on reconnect",
      "Demo video is your first impression — script it, don't improvise. Practice 3x before recording.",
      "Don't skip the C4 diagrams — they're the first thing senior engineers look at in a portfolio project",
    ],
  },
];

const stackCategories = {
  "Backend": ["Java 21", "Spring Boot 3.2", "Spring Cloud Gateway", "Spring Security", "Spring WebFlux", "LangChain4j"],
  "Data": ["PostgreSQL + pgvector", "Redis", "MongoDB", "Elasticsearch", "TimescaleDB"],
  "Messaging": ["Apache Kafka", "Confluent Schema Registry", "Avro", "Kafka Streams"],
  "AI/ML": ["OpenAI GPT-4o", "Anthropic Claude 3.5", "Google Gemini", "pgvector RAG"],
  "Infrastructure": ["Kubernetes (EKS)", "Helm", "Istio", "ArgoCD", "Terraform"],
  "Observability": ["OpenTelemetry", "Jaeger", "Prometheus", "Grafana", "ELK Stack"],
  "Security": ["Keycloak", "HashiCorp Vault", "JWT/OAuth2", "mTLS"],
  "Frontend": ["React + TypeScript", "React Flow", "Monaco Editor", "shadcn/ui"],
};

export default function FlowMindRoadmap() {
  const [activePhase, setActivePhase] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");

  const phase = activePhase !== null ? phases[activePhase] : null;

  return (
    <div style={{
      fontFamily: "'DM Mono', 'Courier New', monospace",
      background: "#080b10",
      minHeight: "100vh",
      color: "#c8d8e8",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #2a3a4a; border-radius: 2px; }
        .phase-card { cursor: pointer; transition: all 0.2s; border: 1px solid #1a2535; }
        .phase-card:hover { transform: translateY(-2px); }
        .task-row { cursor: pointer; transition: background 0.15s; }
        .task-row:hover { background: rgba(255,255,255,0.03); }
        .tab-btn { cursor: pointer; transition: all 0.15s; border: none; background: none; }
        .back-btn { cursor: pointer; transition: all 0.15s; border: none; background: none; }
        .back-btn:hover { opacity: 0.7; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .slide-in { animation: slideIn 0.25s ease forwards; }
        .scanning-line {
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent);
          animation: scan 3s linear infinite;
        }
        @keyframes scan { from{top:0%} to{top:100%} }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a2535",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0,
        background: "rgba(8,11,16,0.95)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #00D4FF22, #A855F722)",
            border: "1px solid #00D4FF44",
            borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "#00D4FF",
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#e8f4ff", letterSpacing: "-0.02em" }}>FlowMind</div>
            <div style={{ fontSize: 10, color: "#4a6a8a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Build Roadmap · 12 Weeks</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["start","core","core","core","infra","final"].map((type, i) => {
            const colors = { start: "#00D4FF", core: "#A855F7", infra: "#10B981", final: "#F97316" };
            const color = phases[i].color;
            return (
              <div key={i} onClick={() => { setActivePhase(i); setActiveTab("tasks"); setActiveTask(null); }} style={{
                width: 28, height: 28, borderRadius: 4,
                background: activePhase === i ? `${color}22` : "transparent",
                border: `1px solid ${activePhase === i ? color : "#1a2535"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: activePhase === i ? color : "#4a6a8a",
                cursor: "pointer", transition: "all 0.15s",
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
              }}>P{i + 1}</div>
            );
          })}
        </div>
      </div>

      {!phase ? (
        /* OVERVIEW */
        <div style={{ padding: "32px", animation: "slideIn 0.3s ease" }}>

          {/* Hero */}
          <div style={{
            background: "linear-gradient(135deg, #0d1525, #0d1118)",
            border: "1px solid #1a2535",
            borderRadius: 12,
            padding: "32px",
            marginBottom: 32,
            position: "relative",
            overflow: "hidden",
          }}>
            <div className="scanning-line" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: "#e8f4ff", letterSpacing: "-0.03em", marginBottom: 8 }}>
                Production AI Automation Platform
              </div>
              <div style={{ fontSize: 13, color: "#5a7a9a", lineHeight: 1.6, maxWidth: 600, marginBottom: 24 }}>
                Complete 12-week engineering roadmap. 7 microservices · Apache Kafka · AI Agents · Kubernetes. Every task includes implementation details and time estimates.
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { label: "Services", value: "7" },
                  { label: "Total Hours", value: "~400h" },
                  { label: "Tech Stack", value: "30+" },
                  { label: "Phases", value: "6" },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, color: "#00D4FF" }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              position: "absolute", right: -20, top: -20, width: 200, height: 200,
              background: "radial-gradient(circle, #00D4FF08, transparent 70%)",
              borderRadius: "50%",
            }} />
          </div>

          {/* Phase Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 32 }}>
            {phases.map((p, i) => (
              <div key={p.id} className="phase-card slide-in" onClick={() => { setActivePhase(i); setActiveTab("tasks"); setActiveTask(null); }}
                style={{
                  background: `linear-gradient(135deg, ${p.color}08, #0d1117)`,
                  borderRadius: 10, padding: 24,
                  borderColor: `${p.color}22`,
                  animationDelay: `${i * 0.05}s`,
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: `${p.color}15`,
                    border: `1px solid ${p.color}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, color: p.color,
                  }}>{p.icon}</div>
                  <div style={{
                    fontSize: 10, color: p.color, letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: "3px 8px",
                    border: `1px solid ${p.color}33`, borderRadius: 4,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>{p.weeks}</div>
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#e8f4ff", marginBottom: 4 }}>
                  Phase {p.id}: {p.title}
                </div>
                <div style={{ fontSize: 11, color: "#4a6a8a", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.subtitle}</div>
                <div style={{ fontSize: 12, color: "#7a9ab8", lineHeight: 1.5, marginBottom: 16 }}>{p.overview}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "#3a5a7a" }}>
                    {p.tasks.reduce((acc, t) => acc + t.items.length, 0)} tasks · {p.milestones.length} milestones
                  </div>
                  <div style={{ fontSize: 12, color: p.color }}>View →</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack Overview */}
          <div style={{
            background: "#0d1117", border: "1px solid #1a2535",
            borderRadius: 10, padding: 24,
          }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#e8f4ff", marginBottom: 20, letterSpacing: "-0.01em" }}>
              Full Technology Stack
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {Object.entries(stackCategories).map(([cat, items]) => (
                <div key={cat}>
                  <div style={{ fontSize: 10, color: "#3a5a7a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{cat}</div>
                  {items.map(item => (
                    <div key={item} style={{
                      fontSize: 11, color: "#6a8aaa", padding: "3px 0",
                      borderBottom: "1px solid #111820",
                    }}>— {item}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : (
        /* PHASE DETAIL */
        <div style={{ padding: "24px 32px", animation: "slideIn 0.2s ease" }}>

          {/* Phase Header */}
          <div style={{ marginBottom: 24 }}>
            <button className="back-btn" onClick={() => setActivePhase(null)}
              style={{ fontSize: 11, color: "#3a5a7a", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              ← All Phases
            </button>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: `${phase.color}15`, border: `1px solid ${phase.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, color: phase.color,
                }}>{phase.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: "#e8f4ff", letterSpacing: "-0.02em" }}>
                    Phase {phase.id}: {phase.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{phase.subtitle} · {phase.weeks}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["tasks", "milestones", "pitfalls"].map(tab => (
                  <button key={tab} className="tab-btn"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "6px 14px", borderRadius: 6, fontSize: 11,
                      color: activeTab === tab ? phase.color : "#3a5a7a",
                      border: `1px solid ${activeTab === tab ? phase.color + "44" : "#1a2535"}`,
                      background: activeTab === tab ? `${phase.color}10` : "transparent",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      fontFamily: "'DM Mono', monospace",
                    }}>{tab}</button>
                ))}
              </div>
            </div>
          </div>

          {activeTab === "tasks" && (
            <div>
              {phase.tasks.map((category, ci) => (
                <div key={ci} style={{ marginBottom: 24 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
                  }}>
                    <div style={{ width: 3, height: 16, background: category.color, borderRadius: 2 }} />
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: "#c8d8e8", letterSpacing: "0.02em" }}>
                      {category.category}
                    </div>
                    <div style={{ flex: 1, height: 1, background: "#1a2535" }} />
                    <div style={{ fontSize: 10, color: "#3a5a7a" }}>{category.items.length} tasks</div>
                  </div>
                  <div style={{ border: "1px solid #1a2535", borderRadius: 8, overflow: "hidden" }}>
                    {category.items.map((item, ii) => (
                      <div key={ii} className="task-row"
                        onClick={() => setActiveTask(activeTask === `${ci}-${ii}` ? null : `${ci}-${ii}`)}
                        style={{
                          borderBottom: ii < category.items.length - 1 ? "1px solid #111820" : "none",
                          background: activeTask === `${ci}-${ii}` ? `${category.color}08` : "transparent",
                        }}>
                        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: activeTask === `${ci}-${ii}` ? category.color : "#2a3a4a",
                            transition: "background 0.15s", flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, fontSize: 12, color: "#c8d8e8", lineHeight: 1.4 }}>{item.task}</div>
                          <div style={{
                            fontSize: 10, color: category.color, fontFamily: "'Space Grotesk', sans-serif",
                            padding: "2px 8px", border: `1px solid ${category.color}33`, borderRadius: 4,
                            flexShrink: 0,
                          }}>{item.time}</div>
                          <div style={{ fontSize: 10, color: "#2a3a4a", flexShrink: 0 }}>
                            {activeTask === `${ci}-${ii}` ? "▲" : "▼"}
                          </div>
                        </div>
                        {activeTask === `${ci}-${ii}` && (
                          <div style={{
                            padding: "0 16px 14px 34px", fontSize: 11, color: "#6a8aaa",
                            lineHeight: 1.7, animation: "slideIn 0.15s ease",
                            borderTop: `1px solid ${category.color}18`,
                            marginTop: -1, paddingTop: 12,
                            background: `${category.color}05`,
                          }}>
                            {item.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Tech Stack for phase */}
              <div style={{ background: "#0d1117", border: "1px solid #1a2535", borderRadius: 8, padding: 16, marginTop: 8 }}>
                <div style={{ fontSize: 10, color: "#3a5a7a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Phase Tech Stack</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {phase.techStack.map(tech => (
                    <div key={tech} style={{
                      fontSize: 11, color: "#5a7a9a", padding: "4px 10px",
                      border: "1px solid #1a2535", borderRadius: 4,
                    }}>{tech}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "milestones" && (
            <div style={{ animation: "slideIn 0.2s ease" }}>
              <div style={{ background: "#0d1117", border: "1px solid #1a2535", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #111820" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: "#c8d8e8" }}>
                    Phase {phase.id} Milestones — don't move to Phase {phase.id + 1} until all are green
                  </div>
                </div>
                {phase.milestones.map((m, i) => (
                  <div key={i} style={{
                    padding: "16px 20px",
                    borderBottom: i < phase.milestones.length - 1 ? "1px solid #111820" : "none",
                    display: "flex", alignItems: "flex-start", gap: 14,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: `${phase.color}15`, border: `1px solid ${phase.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: phase.color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                    }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: "#9ab8d8", lineHeight: 1.5, paddingTop: 2 }}>{m}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pitfalls" && (
            <div style={{ animation: "slideIn 0.2s ease" }}>
              <div style={{ background: "#0d1117", border: "1px solid #1a2535", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #111820" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: "#c8d8e8" }}>
                    ⚠ Common Pitfalls & Critical Notes
                  </div>
                </div>
                {phase.pitfalls.map((p, i) => (
                  <div key={i} style={{
                    padding: "16px 20px",
                    borderBottom: i < phase.pitfalls.length - 1 ? "1px solid #111820" : "none",
                    display: "flex", alignItems: "flex-start", gap: 14,
                  }}>
                    <div style={{ fontSize: 14, flexShrink: 0, paddingTop: 1 }}>⚡</div>
                    <div style={{ fontSize: 12, color: "#8aaa88", lineHeight: 1.6 }}>{p}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 24, borderTop: "1px solid #1a2535" }}>
            {activePhase > 0 ? (
              <button className="back-btn" onClick={() => { setActivePhase(activePhase - 1); setActiveTab("tasks"); setActiveTask(null); }}
                style={{ fontSize: 12, color: "#4a6a8a", display: "flex", alignItems: "center", gap: 6 }}>
                ← Phase {activePhase}: {phases[activePhase - 1].title}
              </button>
            ) : <div />}
            {activePhase < phases.length - 1 ? (
              <button className="back-btn" onClick={() => { setActivePhase(activePhase + 1); setActiveTab("tasks"); setActiveTask(null); }}
                style={{ fontSize: 12, color: phases[activePhase + 1].color, display: "flex", alignItems: "center", gap: 6 }}>
                Phase {activePhase + 2}: {phases[activePhase + 1].title} →
              </button>
            ) : <div />}
          </div>
        </div>
      )}
    </div>
  );
}
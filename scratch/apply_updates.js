const fs = require('fs');
const path = require('path');

// 1. Sidebar.tsx
let sidebar = fs.readFileSync('components/layout/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  /\s*\{\s*label:\s*'Propostas',\s*href:\s*'\/propostas',\s*icon:\s*FileText\s*\},/g,
  ''
);
sidebar = sidebar.replace(
  /\s*\{\s*label:\s*'Contratos',\s*href:\s*'\/contratos',\s*icon:\s*FileCheck\s*\},/g,
  ''
);
sidebar = sidebar.replace(/\s*FileText,\s*FileCheck,/g, '');
fs.writeFileSync('components/layout/Sidebar.tsx', sidebar, 'utf8');
console.log('1. Sidebar.tsx updated');

// 2. contratos/page.tsx
const redirectContratos = `import { redirect } from 'next/navigation';

export default function ContratosPage() {
  redirect('/pipeline');
}
`;
fs.writeFileSync('app/(dashboard)/contratos/page.tsx', redirectContratos, 'utf8');
console.log('2. contratos/page.tsx updated');

// 3. propostas/page.tsx
const redirectPropostas = `import { redirect } from 'next/navigation';

export default function PropostasPage() {
  redirect('/pipeline');
}
`;
fs.writeFileSync('app/(dashboard)/propostas/page.tsx', redirectPropostas, 'utf8');
console.log('3. propostas/page.tsx updated');

// 4. pipeline/page.tsx
let pipeline = fs.readFileSync('app/(dashboard)/pipeline/page.tsx', 'utf8');
const oldStages = `const STAGES = [
  { slug: 'novo_lead', name: 'Novo Lead' },
  { slug: 'qualificacao', name: 'Qualificação' },
  { slug: 'primeiro_contato', name: 'Primeiro Contato' },
  { slug: 'diagnostico', name: 'Diagnóstico' },
  { slug: 'proposta', name: 'Proposta' },
  { slug: 'negociacao', name: 'Negociação' },
  { slug: 'fechado', name: 'Fechado' },
  { slug: 'perdido', name: 'Perdido' },
];`;
const newStages = `const STAGES = [
  { slug: 'primeiro_contato', name: 'Primeiro Contato' },
  { slug: 'negociacao', name: 'Negociação' },
  { slug: 'fechado', name: 'Fechado' },
  { slug: 'follow_up', name: 'Follow-up' },
  { slug: 'lead_perdido', name: 'Lead Perdido' },
];`;
pipeline = pipeline.replace(oldStages, newStages);
pipeline = pipeline.replace("const [newStage, setNewStage] = useState('novo_lead');", "const [newStage, setNewStage] = useState('primeiro_contato');");
pipeline = pipeline.replace(
  "probability: newStage === 'fechado' ? 100 : newStage === 'proposta' ? 70 : 40,",
  "probability: newStage === 'fechado' ? 100 : newStage === 'negociacao' ? 70 : newStage === 'follow_up' ? 50 : 30,"
);
pipeline = pipeline.replace(
  ".filter((o) => o.stage_slug !== 'perdido' && o.stage_slug !== 'fechado')",
  ".filter((o) => o.stage_slug !== 'lead_perdido' && o.stage_slug !== 'perdido' && o.stage_slug !== 'fechado')"
);
pipeline = pipeline.replace(
  "8 etapas estratégicas com suporte a drag-and-drop e movimentação assistida conectada ao n8n.",
  "5 etapas estratégicas com suporte a drag-and-drop e movimentação assistida conectada ao n8n."
);
fs.writeFileSync('app/(dashboard)/pipeline/page.tsx', pipeline, 'utf8');
console.log('4. pipeline/page.tsx updated');

// 5. metrics-service.ts
let metrics = fs.readFileSync('lib/services/metrics-service.ts', 'utf8');
metrics = metrics.replace(
  "const openOpps = opportunities.filter((o) => o.stage_slug !== 'fechado' && o.stage_slug !== 'perdido');",
  "const openOpps = opportunities.filter((o) => o.stage_slug !== 'fechado' && o.stage_slug !== 'perdido' && o.stage_slug !== 'lead_perdido');"
);
fs.writeFileSync('lib/services/metrics-service.ts', metrics, 'utf8');
console.log('5. metrics-service.ts updated');

// 6. app/(dashboard)/page.tsx (Remove Anexo 4)
let dashboard = fs.readFileSync('app/(dashboard)/page.tsx', 'utf8');
const anexo4Regex = /\{\/\* 7\. BLOCOS PRESERVADOS: Oportunidades no Pipeline & Sequências por Nicho \*\/\}[\s\S]*?(?=\{\/\* 8\. Resumo Estratégico)/;
if (anexo4Regex.test(dashboard)) {
  dashboard = dashboard.replace(anexo4Regex, '');
  fs.writeFileSync('app/(dashboard)/page.tsx', dashboard, 'utf8');
  console.log('6. app/(dashboard)/page.tsx (Anexo 4 removed)');
} else {
  console.warn('6. Could not match anexo 4 in dashboard');
}

// 7. clientes/[id]/page.tsx (WhatsApp icon only, replace propostas link)
let clienteDetail = fs.readFileSync('app/(dashboard)/clientes/[id]/page.tsx', 'utf8');
clienteDetail = clienteDetail.replace(
  /<WhatsAppIcon className="w-4 h-4 fill-current" \/>\s*<span>WhatsApp<\/span>/g,
  '<WhatsAppIcon className="w-4 h-4 fill-current" />'
);
clienteDetail = clienteDetail.replace(
  'className="px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-heading font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"',
  'className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition-all active:scale-95 shadow-sm flex items-center justify-center"'
);
clienteDetail = clienteDetail.replace(
  /<Link href="\/propostas">[\s\S]*?<span>Criar Proposta<\/span>[\s\S]*?<\/Link>/,
  `<Link href="/pipeline">
              <Button variant="primary" size="sm" className="gap-1.5">
                <span>Ver no Pipeline</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#07100F]" />
              </Button>
            </Link>`
);
fs.writeFileSync('app/(dashboard)/clientes/[id]/page.tsx', clienteDetail, 'utf8');
console.log('7. clientes/[id]/page.tsx updated');

// 8. leads/[id]/page.tsx (WhatsApp icon only, add to pipeline modal and button)
let leadDetail = fs.readFileSync('app/(dashboard)/leads/[id]/page.tsx', 'utf8');
leadDetail = leadDetail.replace(
  '  ArrowUpRight,\n} from \'lucide-react\';',
  '  ArrowUpRight,\n  Kanban,\n} from \'lucide-react\';'
);
leadDetail = leadDetail.replace(
  /<WhatsAppIcon className="w-4 h-4 fill-current" \/>\s*<span>WhatsApp<\/span>/g,
  '<WhatsAppIcon className="w-4 h-4 fill-current" />'
);
leadDetail = leadDetail.replace(
  'className="px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-heading font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"',
  'className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition-all active:scale-95 shadow-sm flex items-center justify-center"'
);

// Add pipeline state in lead profile
if (!leadDetail.includes('isPipelineModalOpen')) {
  leadDetail = leadDetail.replace(
    "const [approachMessage, setApproachMessage] = useState('');",
    `const [approachMessage, setApproachMessage] = useState('');
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [pipelineStage, setPipelineStage] = useState('primeiro_contato');
  const [pipelineTitle, setPipelineTitle] = useState(
    lead?.services && lead.services.length > 0
      ? lead.services.join(' + ')
      : \`Oportunidade - \${lead?.company_name || ''}\`
  );
  const [pipelineValue, setPipelineValue] = useState('3500');

  const handleAddToPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    crmService.addOpportunity({
      lead_id: lead.id,
      lead_name: lead.name,
      company_name: lead.company_name,
      stage_slug: pipelineStage,
      title: pipelineTitle.trim() || \`Oportunidade - \${lead.company_name}\`,
      estimated_value: Number(pipelineValue) || 3500,
      probability:
        pipelineStage === 'fechado'
          ? 100
          : pipelineStage === 'negociacao'
          ? 70
          : pipelineStage === 'follow_up'
          ? 50
          : 30,
      score: lead.score || 85,
      temperature: lead.temperature || 'quente',
      priority: 'alta',
      services: lead.services || ['Site Institucional'],
      last_interaction: 'Adicionado ao pipeline',
    });

    setIsPipelineModalOpen(false);
    alert(\`Lead "\${lead.company_name}" adicionado com sucesso ao Pipeline!\`);
    router.push('/pipeline');
  };`
  );

  // Replace Proposta button with Colocar no Pipeline
  leadDetail = leadDetail.replace(
    /<Link href="\/propostas">[\s\S]*?<span>Criar Proposta<\/span>[\s\S]*?<\/Link>/,
    `<Button
              onClick={() => setIsPipelineModalOpen(true)}
              variant="primary"
              size="sm"
              className="gap-1.5 text-xs py-2"
            >
              <Kanban className="w-3.5 h-3.5 text-[#07100F]" />
              <span>Colocar no Pipeline</span>
            </Button>`
  );

  // Add Pipeline Modal before the last </div>
  const pipelineModalCode = `      {/* Modal Adicionar ao Pipeline */}
      <Modal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        title="Colocar Lead no Pipeline"
        subtitle={\`Configure a oportunidade para \${lead.company_name} no funil comercial\`}
        maxWidth="md"
      >
        <form onSubmit={handleAddToPipeline} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#9BA6A0] mb-1 font-medium">Título da Oportunidade *</label>
            <input
              type="text"
              required
              value={pipelineTitle}
              onChange={(e) => setPipelineTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#10201E] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9BA6A0] mb-1 font-medium">Valor Estimado (R$)</label>
              <input
                type="number"
                value={pipelineValue}
                onChange={(e) => setPipelineValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#10201E] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#9BA6A0] mb-1 font-medium">Estágio no Pipeline</label>
              <select
                value={pipelineStage}
                onChange={(e) => setPipelineStage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#10201E] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] focus:outline-none"
              >
                <option value="primeiro_contato">Primeiro Contato</option>
                <option value="negociacao">Negociação</option>
                <option value="fechado">Fechado</option>
                <option value="follow_up">Follow-up</option>
                <option value="lead_perdido">Lead Perdido</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(218,241,222,0.06)]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPipelineModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirmar e Ir para Pipeline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}`;

  leadDetail = leadDetail.replace(/ {4}<\/div>\s*\);\s*\}/, pipelineModalCode);
}
fs.writeFileSync('app/(dashboard)/leads/[id]/page.tsx', leadDetail, 'utf8');
console.log('8. leads/[id]/page.tsx updated');

// 9. CommandPalette.tsx (replace propostas with opportunities)
let cmd = fs.readFileSync('components/layout/CommandPalette.tsx', 'utf8');
cmd = cmd.replace(
  "const proposals = crmService.getProposals();",
  "const opportunities = crmService.getOpportunities();"
);
cmd = cmd.replace(
  /const filteredProposals = proposals\.filter\([\s\S]*?\);/,
  `const filteredOpportunities = opportunities.filter(
    (o) =>
      o.company_name.toLowerCase().includes(query.toLowerCase()) ||
      o.title.toLowerCase().includes(query.toLowerCase())
  );`
);
cmd = cmd.replace(
  /\{\/\* Propostas \*\/\}[\s\S]*?\{\/\* Serviços \*\/\}/,
  `{/* Oportunidades */}
              {filteredOpportunities.length > 0 && (
                <div>
                  <div className="text-[10px] font-heading font-semibold text-[#65706A] uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-[#8EB69B]" />
                    Oportunidades ({filteredOpportunities.length})
                  </div>
                  <div className="space-y-1">
                    {filteredOpportunities.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => navigateTo('/pipeline')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#10201E] cursor-pointer transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-[#E7ECE8]">
                            {opp.company_name} — {opp.title}
                          </span>
                          <span className="text-[11px] text-[#9BA6A0]">
                            Estágio: {opp.stage_slug.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#F1F9A1]">
                          R$ {opp.estimated_value.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serviços */}`
);
fs.writeFileSync('components/layout/CommandPalette.tsx', cmd, 'utf8');
console.log('9. CommandPalette.tsx updated');

// 10. leads/page.tsx
let leadsPage = fs.readFileSync('app/(dashboard)/leads/page.tsx', 'utf8');

// Ensure Kanban imported
if (!leadsPage.includes('Kanban,')) {
  leadsPage = leadsPage.replace('  Globe,\n} from \'lucide-react\';', '  Globe,\n  Kanban,\n} from \'lucide-react\';');
}

// Add state if needed
if (!leadsPage.includes('isPipelineModalOpen')) {
  leadsPage = leadsPage.replace(
    '  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);',
    `  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Pipeline modal states
  const [pipelineLead, setPipelineLead] = useState<Lead | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [pipelineStage, setPipelineStage] = useState('primeiro_contato');
  const [pipelineTitle, setPipelineTitle] = useState('');
  const [pipelineValue, setPipelineValue] = useState('3500');`
  );

  // Add handlers
  leadsPage = leadsPage.replace(
    '  const handleOpenMessageModal = (lead: Lead) => {',
    `  const handleOpenPipelineModal = (lead: Lead) => {
    setPipelineLead(lead);
    setPipelineStage('primeiro_contato');
    setPipelineTitle(
      lead.services && lead.services.length > 0
        ? lead.services.join(' + ')
        : \`Oportunidade - \${lead.company_name}\`
    );
    setPipelineValue('3500');
    setIsPipelineModalOpen(true);
  };

  const handleConfirmAddToPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineLead) return;

    crmService.addOpportunity({
      lead_id: pipelineLead.id,
      lead_name: pipelineLead.name,
      company_name: pipelineLead.company_name,
      stage_slug: pipelineStage,
      title: pipelineTitle.trim() || \`Oportunidade - \${pipelineLead.company_name}\`,
      estimated_value: Number(pipelineValue) || 3500,
      probability:
        pipelineStage === 'fechado'
          ? 100
          : pipelineStage === 'negociacao'
          ? 70
          : pipelineStage === 'follow_up'
          ? 50
          : 30,
      score: pipelineLead.score || 85,
      temperature: pipelineLead.temperature || 'quente',
      priority: 'alta',
      services: pipelineLead.services || ['Site Institucional'],
      last_interaction: 'Adicionado ao pipeline',
    });

    setIsPipelineModalOpen(false);
    alert(\`Lead "\${pipelineLead.company_name}" adicionado com sucesso ao Pipeline!\`);
  };

  const handleBulkAddToPipeline = () => {
    if (selectedLeadIds.length === 0) return;
    const selected = leads.filter((l) => selectedLeadIds.includes(l.id));
    selected.forEach((l) => {
      crmService.addOpportunity({
        lead_id: l.id,
        lead_name: l.name,
        company_name: l.company_name,
        stage_slug: 'primeiro_contato',
        title:
          l.services && l.services.length > 0
            ? l.services.join(' + ')
            : \`Oportunidade - \${l.company_name}\`,
        estimated_value: 3500,
        probability: 30,
        score: l.score || 85,
        temperature: l.temperature || 'quente',
        priority: 'alta',
        services: l.services || ['Site Institucional'],
        last_interaction: 'Adicionado ao pipeline',
      });
    });
    const count = selected.length;
    setSelectedLeadIds([]);
    alert(\`\${count} lead(s) adicionado(s) com sucesso ao Pipeline na etapa "Primeiro Contato"!\`);
  };

  const handleOpenMessageModal = (lead: Lead) => {`
  );

  // Bulk actions button
  leadsPage = leadsPage.replace(
    /<button\s+onClick=\{handleBulkDelete\}[\s\S]*?<\/button>/,
    `<div className="flex items-center gap-2 animate-in fade-in">
              <button
                onClick={handleBulkAddToPipeline}
                className="px-3 py-1.5 rounded-xl bg-[#163832] hover:bg-[#235347] border border-[#8EB69B]/40 text-[#F1F9A1] text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                title="Adicionar todos os leads selecionados ao funil comercial"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Mover para Pipeline ({selectedLeadIds.length})</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Selecionados ({selectedLeadIds.length})</span>
              </button>
            </div>`
  );
}

// Table Header: change Lead / Empresa to Empresa, remove Serviços Sugeridos and Próxima Ação
const oldHeader = `<th className="py-3 px-4">Lead / Empresa</th>
                <th className="py-3 px-4">Segmento</th>
                <th className="py-3 px-4">Temperatura</th>
                <th className="py-3 px-4 text-center">Score IA</th>
                <th className="py-3 px-4">Serviços Sugeridos</th>
                <th className="py-3 px-4">Próxima Ação</th>
                <th className="py-3 px-4 text-right">Ações</th>`;
const newHeader = `<th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">Segmento</th>
                <th className="py-3 px-4">Temperatura</th>
                <th className="py-3 px-4 text-center">Score IA</th>
                <th className="py-3 px-4 text-right">Ações</th>`;
leadsPage = leadsPage.replace(oldHeader, newHeader);

// Table Rows: replace Nome & Empresa with only Empresa, remove Serviços Sugeridos and Próxima Ação, add Pipeline button
const oldRowContent = /\{\/\* Nome & Empresa \*\/\}[\s\S]*?\{\/\* Ações: WhatsApp, Gerar Mensagem, Olho & Excluir \*\/\}\s*<td className="py-3\.5 px-4 text-right">\s*<div className="flex items-center justify-end gap-1\.5">/;
const newRowContent = `{/* Empresa (Apenas o nome da empresa) */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={\`/leads/\${lead.id}\`}
                        className="font-medium text-[#E7ECE8] group-hover:text-[#F1F9A1] transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{lead.company_name}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    {/* Segmento */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-mono text-[#8EB69B] px-2 py-0.5 rounded bg-[#10201E] border border-[rgba(218,241,222,0.06)]">
                        {lead.segment}
                      </span>
                    </td>

                    {/* Temperatura */}
                    <td className="py-3.5 px-4">
                      <Badge temperature={lead.temperature}>
                        {lead.temperature === 'quente' && '🔥 Quente'}
                        {lead.temperature === 'morno' && '● Morno'}
                        {lead.temperature === 'frio' && '○ Frio'}
                        {lead.temperature === 'desqualificado' && '− Não qualificado'}
                      </Badge>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={\`font-mono text-xs font-semibold px-2 py-0.5 rounded \${
                          lead.score >= 80
                            ? 'text-[#F1F9A1] bg-[#F1F9A1]/10'
                            : lead.score >= 60
                            ? 'text-[#8EB69B] bg-[#8EB69B]/10'
                            : 'text-[#9BA6A0] bg-[#10201E]'
                        }\`}
                      >
                        {lead.score}
                      </span>
                    </td>

                    {/* Ações: WhatsApp, Colocar no Pipeline, Gerar Mensagem, Olho & Excluir */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Chamar no WhatsApp (Só a logo) */}
                        <button
                          onClick={() => handleDirectWhatsApp(lead.whatsapp, lead.company_name)}
                          className="p-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition-all active:scale-95 shadow-sm flex items-center justify-center"
                          title={\`Chamar \${lead.company_name} no WhatsApp\`}
                        >
                          <WhatsAppIcon className="w-4 h-4 fill-current" />
                        </button>

                        {/* Botão Colocar no Pipeline */}
                        <button
                          onClick={() => handleOpenPipelineModal(lead)}
                          className="p-1.5 rounded-xl bg-[#10201E] hover:bg-[#163832] border border-[rgba(218,241,222,0.12)] text-[#8EB69B] hover:text-[#F1F9A1] transition-all active:scale-95 flex items-center justify-center"
                          title={\`Colocar \${lead.company_name} no Pipeline\`}
                        >
                          <Kanban className="w-3.5 h-3.5" />
                        </button>`;

if (oldRowContent.test(leadsPage)) {
  leadsPage = leadsPage.replace(oldRowContent, newRowContent);
}

// Add Modal in leadsPage if not present
if (!leadsPage.includes('title="Colocar Lead no Pipeline"')) {
  const modalCode = `      {/* Modal Adicionar Lead ao Pipeline */}
      <Modal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        title="Colocar Lead no Pipeline"
        subtitle={
          pipelineLead
            ? \`Configure a oportunidade para \${pipelineLead.company_name} no funil comercial\`
            : 'Adicionar oportunidade ao funil'
        }
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAddToPipeline} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#9BA6A0] mb-1 font-medium">Título da Oportunidade *</label>
            <input
              type="text"
              required
              value={pipelineTitle}
              onChange={(e) => setPipelineTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#10201E] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9BA6A0] mb-1 font-medium">Valor Estimado (R$)</label>
              <input
                type="number"
                value={pipelineValue}
                onChange={(e) => setPipelineValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#10201E] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#9BA6A0] mb-1 font-medium">Estágio no Pipeline</label>
              <select
                value={pipelineStage}
                onChange={(e) => setPipelineStage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#10201E] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] focus:outline-none cursor-pointer"
              >
                <option value="primeiro_contato">Primeiro Contato</option>
                <option value="negociacao">Negociação</option>
                <option value="fechado">Fechado</option>
                <option value="follow_up">Follow-up</option>
                <option value="lead_perdido">Lead Perdido</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(218,241,222,0.06)]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPipelineModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirmar Oportunidade
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}`;
  leadsPage = leadsPage.replace(/ {4}<\/div>\s*\);\s*\}/, modalCode);
}

fs.writeFileSync('app/(dashboard)/leads/page.tsx', leadsPage, 'utf8');
console.log('10. leads/page.tsx updated');

console.log('ALL UPDATES APPLIED SUCCESSFULLY!');

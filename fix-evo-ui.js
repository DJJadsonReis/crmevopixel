const fs = require('fs');
let text = fs.readFileSync('c:/Users/admin.rafael/Desktop/crmevo/app/(dashboard)/configuracoes/page.tsx', 'utf8');

const oldCard = `<Card className="p-6 space-y-4 border border-[var(--evo-border)]">
          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-evo-support">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                  WhatsApp (Evolution API)
                </h3>
                <span className="text-[11px] text-[var(--evo-muted)]">
                  Canal de envio para o Banco de Mensagens e régua de prospecção
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-evo-surface2 text-evo-support font-mono">
              Online
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Evolution API URL</label>
              <input
                type="text"
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Global API Key</label>
              <input
                type="password"
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--evo-border)]">
              <div className="flex items-center gap-2 text-xs text-[var(--evo-muted)]">
                <QrCode className="w-4 h-4 text-evo-support" />
                <span>Instância: <strong className="text-[var(--evo-text)] font-mono">evocrm-prod</strong></span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="text-xs h-7"
                onClick={() => alert('Abrindo QR Code para sincronização com o WhatsApp da EVO PIXEL...')}
              >
                Conectar via QR Code
              </Button>
            </div>
          </div>
        </Card>`;

const newCard = `<Card className="p-6 space-y-4 border border-[var(--evo-border)]">
          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-evo-support">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                  WhatsApp (Evolution API)
                </h3>
                <span className="text-[11px] text-[var(--evo-muted)]">
                  Canal de envio para o Banco de Mensagens e régua de prospecção
                </span>
              </div>
            </div>
            {evoStatus === 'online' && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#DAF1DE] text-green-900 border border-green-800/20 font-mono">
                Conectado
              </span>
            )}
            {evoStatus === 'offline' && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/20 text-red-400 border border-red-900/30 font-mono">
                Desconectado
              </span>
            )}
            {evoStatus === 'idle' && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-evo-surface2 text-evo-support font-mono">
                Offline
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Evolution API URL</label>
              <input
                type="text"
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                placeholder="https://api-evolution..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Global API Key</label>
              <input
                type="password"
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                placeholder="Colar API Key..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Nome da Instância</label>
              <input
                type="text"
                value={evolutionInstance}
                onChange={(e) => setEvolutionInstance(e.target.value)}
                placeholder="Ex: evocrm-prod"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>

            <div className="pt-2 flex flex-col gap-3 border-t border-[var(--evo-border)] mt-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-[10px] text-[var(--evo-muted)] flex-1">
                  {evoStatusMsg && <span className={evoStatus === 'online' ? 'text-evo-support' : 'text-amber-500'}>{evoStatusMsg}</span>}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs h-7 gap-1.5"
                  onClick={handleConnectEvolution}
                  disabled={evoStatus === 'loading'}
                >
                  {evoStatus === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                  Testar / Conectar
                </Button>
              </div>

              {evoQrCode && evoStatus === 'offline' && (
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border-2 border-evo-support/30 mt-2">
                  <img src={evoQrCode} alt="QR Code WhatsApp" className="w-48 h-48 object-contain rounded-lg" />
                  <p className="text-gray-500 text-[10px] mt-2 font-medium">Abra o WhatsApp e leia o QR Code</p>
                </div>
              )}
            </div>
          </div>
        </Card>`;

// Instead of string exact match (which can fail due to CRLF differences), we use substring indexing:
const startIndex = text.indexOf('<Card className="p-6 space-y-4 border border-[var(--evo-border)]">\r\n          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">\r\n            <div className="flex items-center gap-3">\r\n              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-evo-support">\r\n                <MessageSquare className="w-4 h-4" />\r\n              </div>\r\n              <div>\r\n                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">\r\n                  WhatsApp (Evolution API)');

if(startIndex === -1) {
    // try with \n
    const startIndex2 = text.indexOf('<Card className="p-6 space-y-4 border border-[var(--evo-border)]">\n          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">\n            <div className="flex items-center gap-3">\n              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-evo-support">\n                <MessageSquare className="w-4 h-4" />\n              </div>\n              <div>\n                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">\n                  WhatsApp (Evolution API)');
    
    if (startIndex2 === -1) {
       console.log('Could not find start index');
       process.exit(1);
    }
}

// Safer way is to use regex:
const re = /<Card className="p-6 space-y-4 border border-\[var\(--evo-border\)\]">[\s\S]*?Conectar via QR Code\s*<\/Button>\s*<\/div>\s*<\/div>\s*<\/Card>/m;
text = text.replace(re, newCard);

fs.writeFileSync('c:/Users/admin.rafael/Desktop/crmevo/app/(dashboard)/configuracoes/page.tsx', text, 'utf8');
console.log('UI Replaced!');

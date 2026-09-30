const fs = require('fs');
let text = fs.readFileSync('c:/Users/admin.rafael/Desktop/crmevo/app/(dashboard)/configuracoes/page.tsx', 'utf8');

const useEfectBlock = `
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEvoUrl = localStorage.getItem('EVO_evolutionUrl');
      const savedEvoKey = localStorage.getItem('EVO_evolutionApiKey');
      const savedEvoInst = localStorage.getItem('EVO_evolutionInstance');
      const savedN8n = localStorage.getItem('EVO_n8nWebhookUrl');
      
      if (savedEvoUrl) setEvolutionUrl(savedEvoUrl);
      if (savedEvoKey) setEvolutionApiKey(savedEvoKey);
      if (savedEvoInst) setEvolutionInstance(savedEvoInst);
      if (savedN8n) setN8nWebhookUrl(savedN8n);
    }
  }, []);

  const handleSaveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('EVO_evolutionUrl', evolutionUrl);
      localStorage.setItem('EVO_evolutionApiKey', evolutionApiKey);
      localStorage.setItem('EVO_evolutionInstance', evolutionInstance);
      localStorage.setItem('EVO_n8nWebhookUrl', n8nWebhookUrl);
      alert('Integrações (Evolution & n8n) salvas localmente com sucesso!');
    }
  };
`;

// Insert the hooks right after `const [n8nWebhookUrl, setN8nWebhookUrl] = useState('https://n8n.evopixel.com.br/webhook/crm-events');`
const injectionPoint = "const [n8nWebhookUrl, setN8nWebhookUrl] = useState('https://n8n.evopixel.com.br/webhook/crm-events');";
text = text.replace(injectionPoint, injectionPoint + '\n' + useEfectBlock);

// Replace the alert
const alertRegex = /onClick=\{\(\) \=\> alert\('Configurações salvas com sucesso!'\)\}/g;
text = text.replace(alertRegex, 'onClick={handleSaveSettings}');
// In case of encoding issues on the string:
const alertRegexFallback = /onClick=\{\(\) \=\> alert\('.*salvas.*'\)\}/g;
text = text.replace(alertRegexFallback, 'onClick={handleSaveSettings}');

fs.writeFileSync('c:/Users/admin.rafael/Desktop/crmevo/app/(dashboard)/configuracoes/page.tsx', text, 'utf8');
console.log('Done!');

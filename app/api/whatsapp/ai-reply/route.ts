export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { leadName, companyName, clientMessage, systemPrompt } = body;

    const contact = (leadName || '').split(' ')[0] || 'Dr(a)';
    const company = companyName || 'sua empresa';
    const message = (clientMessage || '').toLowerCase();

    // Respostas inteligentes pré-calculadas com base na intenção do cliente
    let replies: Array<{ title: string; text: string }> = [];

    if (message.includes('preço') || message.includes('quanto') || message.includes('valor')) {
      replies = [
        {
          title: 'Apresentar ROI & Parcelamento',
          text: `Olá ${contact}! O investimento é flexível e varia de acordo com os módulos que a *${company}* precisa. O melhor de tudo é que o projeto se paga com facilidade: com apenas 1 ou 2 novos contratos fechados via Google ou WhatsApp, o retorno já é 100% positivo. Posso te ligar 3 minutinhos para alinhar as opções?`,
        },
        {
          title: 'Agendar Alinhamento para Orçamento',
          text: `Com certeza, ${contact}! Para eu te passar um valor exato e sem surpresas, podemos fazer uma chamada rápida de 5 minutos hoje às 15h ou amanhã às 10h? Assim te mostro a estrutura ao vivo!`,
        },
        {
          title: 'Faixa de Valores Acessível',
          text: `Temos planos de implantação sob medida com mensalidades bem acessíveis para o porte da *${company}*, incluindo suporte contínuo e atualizações. Qual o melhor horário para alinharmos?`,
        },
      ];
    } else if (message.includes('como funciona') || message.includes('o que') || message.includes('detalhes')) {
      replies = [
        {
          title: 'Explicar os 3 Pilares',
          text: `Funciona de forma muito simples e direta, ${contact}: 1) Criamos seu Portal Institucional de Autoridade; 2) Otimizamos seu posicionamento no Google Maps; e 3) Conectamos um atendente IA no WhatsApp da *${company}* para responder na hora. Você teria 5 minutos amanhã para eu te mostrar na prática?`,
        },
        {
          title: 'Demonstração ao Vivo de 5min',
          text: `Posso compartilhar minha tela por 5 minutinhos com você para demonstrar um modelo idêntico rodando no seu nicho? Você vai ver exatamente como os clientes chegam e são atendidos. Qual dia fica melhor?`,
        },
      ];
    } else {
      replies = [
        {
          title: 'Convite para Reunião de 5min',
          text: `Perfeito, ${contact}! Para facilitar seu dia, você prefere que eu te ligue hoje no final da tarde ou amanhã pela manhã para um alinhamento rápido de 5 minutos?`,
        },
        {
          title: 'Compartilhar Diagnóstico Rápido',
          text: `Preparei um resumo com 3 melhorias que identifiquei na presença digital da *${company}*. Se fizer sentido, posso te enviar o PDF agora para você avaliar!`,
        },
        {
          title: 'Resposta Cordial e Prática',
          text: `Obrigado pelo retorno, ${contact}! Fico à disposição da *${company}*. Quer agendar para vermos isso ainda esta semana?`,
        },
      ];
    }

    return NextResponse.json({
      success: true,
      replies,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Erro ao gerar resposta com IA' },
      { status: 500 }
    );
  }
}

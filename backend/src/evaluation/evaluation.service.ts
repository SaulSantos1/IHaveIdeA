import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class EvaluationService {
  async evaluateAnswer(questionText: string, referenceAnswer: string, userAnswer: string): Promise<{ status: string, feedback: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('mock')) {
       // fallback mock se a key não estiver configurada no .env
       const isCr = userAnswer.length > 20;
       return { 
         status: isCr ? "CORRECT" : "WRONG", 
         feedback: isCr ? "[MOCK] Resposta validada." : "[MOCK] Resposta curta." 
       };
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Você é um avaliador técnico experiente, flexível e encorajador de uma plataforma de desafios diários ("I Have IdeA").
Desafio do dia: "${questionText}"
Gabarito Estrutural de Referência: "${referenceAnswer}"

Abaixo, segue a resposta dissertativa proferida por um desenvolvedor em treinamento:
"${userAnswer}"

Regras absolutas do sistema:
- O usuário não compila código, ele disserta sobre engenharia/arquitetura e conceitos.
- Você deve classificar a resposta em 3 categorias exatas: "CORRECT", "PARTIAL" ou "WRONG".
- Use "CORRECT" se a resposta capturar a essência do gabarito, mesmo que com palavras diferentes, de forma resumida ou focada em um caso de uso prático. Seja bem tolerante e recompense o raciocínio correto.
- Use "PARTIAL" se ele demonstrar entendimento básico ou mencionar parte dos conceitos esperados, mesmo que superficialmente. Valorize o esforço!
- Use "WRONG" APENAS se a resposta for completamente aleatória, totalmente errada em relação ao conceito central, vazia ou fora de contexto.

Sua saída deve OBRIGATORIAMENTE ser APENAS um JSON estrito, puro, sem markdown (sem \`\`\`json ou coisas do tipo) e sem texto explicativo adicional, contendo:
{"status": "CORRECT" | "PARTIAL" | "WRONG", "feedback": "seu comentário técnico e analítico construtivo em português ensinando o que faltou caso parcial, ou elogiando se correto. Sem rodeios, máximo 2 frases."}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(cleanJson);
      return {
         status: parsed.status || "WRONG",
         feedback: parsed.feedback || "Avaliação de integridade concluída."
      };
    } catch(e) {
      console.error("Erro na integração com o Gemini:", e);
      throw new InternalServerErrorException("A rede neural de avaliação falhou temporariamente. Tente de novo.");
    }
  }
}


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const d = new Date();
  d.setUTCHours(0,0,0,0);
  
  const existe = await prisma.question.findFirst();
  if (existe) {
     console.log('O banco já possui dados!');
     return;
  }

  await prisma.question.create({
    data: {
      question: 'Explique o motivo de containers Docker serem mais leves que Máquinas Virtuais tradicionais e quais trade-offs isso traz de segurança e engenharia.',
      reference: 'Containers usam o mesmo kernel do Host (através de cgroups/namespaces). Isso traz extrema velocidade e tamanho reduzido. No entanto, por compartilharem o SO, o isolamento e segurança absolutos são inferiores a uma VM que cria sua própria abstração de hardware via Hypervisor.',
      category: 'DEVOPS',
      difficulty: 'HARD',
      active_date: d,
    }
  });
  console.log('Seed realizado com sucesso. Pergunta Ativa Adicionada!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

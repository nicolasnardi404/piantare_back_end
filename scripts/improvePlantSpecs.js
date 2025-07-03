import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function improveSpecification(plant) {
  const prompt = `
Escreva um parágrafo conciso e envolvente em português sobre principalmente o papel ecológico da planta a seguir. 
Não comece o texto com frases como "Essa planta...", "Essas árvores...", "Esta espécie..." ou similares. 
Inicie diretamente com a informação principal, como se fosse a continuação de um texto.
Não repita o nome comum, nome científico, origem, altura ou categoria da planta—apenas foque no papel ecológico e conselhos de cultivo. 
Não use títulos ou tópicos; retorne apenas o texto melhorado.

Dados:
- Nome comum: ${plant.commonName}
- Nome científico: ${plant.scientificName}
- Origem: ${plant.origin}
- Altura: ${plant.height}
- Categoria: ${plant.category}
- Especificação atual: ${plant.specification || "Nenhuma"}

`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.7,
  });

  return completion.choices[0].message.content.trim();
}

async function main() {
  const plants = await prisma.plantSpecies.findMany({ take: 3 });

  for (const plant of plants) {
    try {
      const newSpec = await improveSpecification(plant);
      console.log(`\n${plant.commonName}`);
      console.log("Old specification:", plant.specification);
      console.log("New specification:", newSpec);
      await prisma.plantSpecies.update({
        where: { id: plant.id },
        data: { specification: newSpec },
      });
    } catch (err) {
      console.error(`Error updating ${plant.commonName}:`, err);
    }
  }
  await prisma.$disconnect();
}

main();

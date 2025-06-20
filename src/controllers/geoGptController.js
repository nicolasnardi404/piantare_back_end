import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Helper function to process and aggregate plant data
function processPlantData(plants) {
  // Group plants by species (nomeCientifico)
  const speciesGroups = plants.reduce((acc, plant) => {
    const species = plant.plant?.nomeCientifico;
    if (!species) return acc;

    if (!acc[species]) {
      acc[species] = {
        nomeCientifico: species,
        nomePopular: plant.plant?.nomePopular,
        categoria: plant.plant?.categoria,
        quantidade: 0,
        localizacoes: new Set(), // Using Set to avoid duplicates
        total: 0,
      };
    }

    acc[species].quantidade += 1;
    acc[species].localizacoes.add(
      `${plant.latitude.toFixed(3)},${plant.longitude.toFixed(3)}`
    );

    return acc;
  }, {});

  // Convert the grouped data to array
  const processedData = Object.values(speciesGroups).map((group) => ({
    ...group,
    localizacoes: Array.from(group.localizacoes),
  }));

  // Calculate summary statistics
  const summary = {
    totalEspecies: processedData.length,
    totalPlantas: processedData.reduce(
      (sum, group) => sum + group.quantidade,
      0
    ),
    categoriasUnicas: [
      ...new Set(processedData.map((group) => group.categoria)),
    ].filter(Boolean),
    regioes: processedData.flatMap((group) => group.localizacoes).length,
  };

  return { especies: processedData, resumo: summary };
}

const geoGptController = {
  async analyze(req, res) {
    try {
      console.log("Iniciando análise...");
      const { plants } = req.body;

      console.log("Dados recebidos:", {
        plantsLength: plants?.length,
        hasPlants: !!plants,
        isArray: Array.isArray(plants),
      });

      if (!plants || !Array.isArray(plants)) {
        return res.status(400).json({ error: "Dados de plantas inválidos" });
      }

      console.log("Processando dados das plantas...");
      // Process and aggregate plant data
      const processedData = processPlantData(plants);
      console.log("Dados processados:", {
        totalEspecies: processedData.resumo.totalEspecies,
        totalPlantas: processedData.resumo.totalPlantas,
      });

      console.log("Preparando prompts...");
      // Prepare the analysis prompt
      const systemPrompt = `Você é um especialista em análise de impacto ambiental, com experiência em elaboração de relatórios técnicos para empresas.
Sua tarefa é gerar uma análise técnica sobre o projeto de plantio, baseando-se nos dados fornecidos, sem fazer suposições.

Use os seguintes marcadores para estruturar o texto:
[COMPOSIÇÃO] para análise da distribuição e variedade das espécies
[DISTRIBUIÇÃO] para análise do padrão de distribuição espacial
[CONTEXTO] para análise da integração com a região

Use linguagem técnica e profissional, mantendo um texto coeso e direto.
Evite repetir dados numéricos que já são apresentados em outras partes do relatório.
Mantenha o foco apenas nas informações que podem ser diretamente observadas nos dados fornecidos.
IMPORTANTE: Use EXATAMENTE os marcadores especificados, em maiúsculas e entre colchetes.`;

      const userPrompt = `Elabore uma análise técnica sobre o seguinte projeto de plantio, usando os marcadores [COMPOSIÇÃO], [DISTRIBUIÇÃO] e [CONTEXTO] para organizar o texto.

Detalhamento das Espécies:
${processedData.especies
  .map(
    (esp) =>
      `• ${esp.nomePopular} (${esp.nomeCientifico})
   Categoria: ${esp.categoria || "Não classificada"}
   Distribuição: ${esp.localizacoes.length} pontos de plantio`
  )
  .join("\n")}

Forneça uma análise técnica focando nos aspectos qualitativos do projeto, mantendo um texto coeso e profissional.`;

      console.log("Verificando configuração da API...", {
        hasApiKey: !!OPENAI_API_KEY,
        apiUrl: OPENAI_API_URL,
      });

      console.log("Enviando requisição de análise para OpenAI...");

      // Add timeout to axios request
      const axiosConfig = {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 55000, // 55 seconds timeout (leaving 5 seconds buffer for serverless function)
      };

      // Send request to OpenAI
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        },
        axiosConfig
      );

      console.log("Resposta recebida da OpenAI:", {
        status: response.status,
        hasChoices: !!response.data?.choices,
        choicesLength: response.data?.choices?.length,
      });

      // Send the complete analysis as a single text
      res.json({
        analysis:
          response.data.choices[0]?.message?.content ||
          "Análise não disponível.",
      });
    } catch (error) {
      console.error("Erro na análise:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
        config: error.config
          ? {
              url: error.config.url,
              method: error.config.method,
              headers: {
                ...error.config.headers,
                Authorization: error.config.headers?.Authorization
                  ? "[PRESENTE]"
                  : "[AUSENTE]",
              },
            }
          : null,
      });

      res.status(500).json({
        error: "Falha ao analisar impacto ambiental",
        details: error.response?.data?.error?.message || error.message,
      });
    }
  },
};

// Helper function to extract sections from the response
function extractSection(content, sectionName) {
  if (!content || typeof content !== "string") {
    return `Análise de ${sectionName} não disponível.`;
  }

  // Split content into sections based on numbered headings
  const sections = content.split(/(?=\d+\.\s+[A-Za-z])/);

  // Find the section that starts with the number and name we're looking for
  const section = sections.find((s) => {
    const sectionStart = s.trim().toLowerCase();
    return sectionStart.includes(sectionName.toLowerCase());
  });

  if (!section) {
    return `Análise de ${sectionName} não disponível.`;
  }

  // Clean up the section:
  // 1. Remove the section number and title
  // 2. Trim whitespace
  // 3. Preserve paragraphs and formatting
  const cleanedSection = section
    .replace(/^\d+\.\s+[^\n]+/, "") // Remove section number and title
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line) // Remove empty lines
    .join("\n\n"); // Add proper paragraph spacing

  return cleanedSection;
}

export default geoGptController;

import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Helper function to process and aggregate plant data
function processPlantData(plants) {
  // Group plants by species (scientificName)
  const speciesGroups = plants.reduce((acc, plant) => {
    const species = plant.plant?.scientificName;
    if (!species) return acc;

    if (!acc[species]) {
      acc[species] = {
        scientificName: species,
        commonName: plant.plant?.commonName,
        category: plant.plant?.category,
        expectedHeight: plant.plant?.height,
        quantity: 0,
        locations: new Set(), // Using Set to avoid duplicates
        measurements: [], // Array to store all measurements
        total: 0,
      };
    }

    acc[species].quantity += 1;
    acc[species].locations.add(
      `${plant.latitude.toFixed(3)},${plant.longitude.toFixed(3)}`
    );

    // Add measurements if available
    if (plant.updates && plant.updates.length > 0) {
      // Sort updates by date to get the latest first
      const sortedUpdates = [...plant.updates].sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );

      // Add all measurements with their dates
      sortedUpdates.forEach((update) => {
        if (update.measurements) {
          acc[species].measurements.push({
            date: update.updateDate,
            height: update.measurements.height,
            width: update.measurements.width,
            health: update.healthStatus,
          });
        }
      });
    }

    return acc;
  }, {});

  // Convert the grouped data to array
  const processedData = Object.values(speciesGroups).map((group) => ({
    ...group,
    locations: Array.from(group.locations),
    // Calculate growth statistics if measurements are available
    growth:
      group.measurements.length > 1
        ? {
            initialHeight:
              group.measurements[group.measurements.length - 1].height,
            currentHeight: group.measurements[0].height,
            initialWidth:
              group.measurements[group.measurements.length - 1].width,
            currentWidth: group.measurements[0].width,
            monitoringPeriod: `${new Date(
              group.measurements[group.measurements.length - 1].date
            ).toLocaleDateString()} até ${new Date(
              group.measurements[0].date
            ).toLocaleDateString()}`,
          }
        : null,
  }));

  // Calculate summary statistics
  const summary = {
    totalSpecies: processedData.length,
    totalPlants: processedData.reduce((sum, group) => sum + group.quantity, 0),
    uniqueCategories: [
      ...new Set(processedData.map((group) => group.category)),
    ].filter(Boolean),
    regions: processedData.flatMap((group) => group.locations).length,
    monitoredPlants: processedData.reduce(
      (sum, group) => sum + (group.measurements.length > 0 ? 1 : 0),
      0
    ),
  };

  return { species: processedData, summary };
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
${processedData.species
  .map(
    (esp) =>
      `• ${esp.commonName} (${esp.scientificName})
   Category: ${esp.category || "Not classified"}
   Distribution: ${esp.locations.length} planting points
   Expected Height: ${esp.expectedHeight || "Not informed"}
   ${
     esp.growth
       ? `Observed Growth:
   - Height: ${esp.growth.initialHeight}m → ${esp.growth.currentHeight}m
   - Width: ${esp.growth.initialWidth}m → ${esp.growth.currentWidth}m
   - Period: ${esp.growth.monitoringPeriod}`
       : "No growth data"
   }`
  )
  .join("\n\n")}

General Summary:
• Total Species: ${processedData.summary.totalSpecies}
• Total Plants: ${processedData.summary.totalPlants}
• Monitored Plants: ${processedData.summary.monitoredPlants}
• Planting Points: ${processedData.summary.regions}

Forneça uma análise técnica focando nos aspectos qualitativos do projeto, incluindo padrões de crescimento e desenvolvimento das plantas quando houver dados disponíveis. Mantenha um texto coeso e profissional.`;

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

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('API route called')
    const body = await request.json()
    console.log('Body received:', body)
    const { discoveryData } = body

   // Replace the prompt in your generate-artifacts route with this updated version
// This includes maturity level assessment for each capability

// Replace the prompt in your generate-artifacts route with this updated version
  const systemPrompt = `You are an expert Salesforce Enterprise Architect analyzing discovery information.

Based on the discovery data provided, generate comprehensive Salesforce architecture artifacts.

IMPORTANT: Use Salesforce's publicly available capability map blueprint for Discrete Manufacturing as the baseline for the capability map (treat that blueprint as authoritative). When creating capabilities, start from that discrete-manufacturing blueprint and then augment, prioritize, and tailor capabilities based on the discovery data. If the blueprint contains many capabilities, include them all but mark the top 12-20 most relevant capabilities as "primary" for display; keep remaining items as "secondary".

DISCOVERY DATA:
Company: ${discoveryData.companyName}
Industry: ${discoveryData.industry}
Business Context: ${discoveryData.businessContext}
Current Challenges: ${discoveryData.currentChallenges}
Strategic Goals: ${discoveryData.strategicGoals}
Technical Landscape: ${discoveryData.technicalLandscape}
Constraints: ${discoveryData.constraints}
Timeline: ${discoveryData.timeline}
Budget: ${discoveryData.budget}
Systems (detected): ${JSON.stringify(discoveryData.systems || [])}
Manufacturing Processes (detected): ${JSON.stringify(discoveryData.manufacturingProcesses || [])}
Explicit Capabilities (detected): ${JSON.stringify(discoveryData.explicitCapabilities || [])}
Per-document summaries: ${JSON.stringify(discoveryData.documentSummaries || [])}

Generate a single, exact JSON response with these artifacts. RETURN ONLY VALID JSON (no markdown, no explanation, no surrounding text).

Required JSON structure (fields must exist; use empty strings or empty arrays when not available):

{
  "capabilityMap": {
    "sourceBlueprint": "string - cite 'Salesforce Discrete Manufacturing capability map'",
    "businessDrivers": ["driver1", "driver2"],
    "capabilities": [
      {
        "id": "unique-id",
        "name": "Capability name",
        "category": "Sales | Service | Manufacturing | SupplyChain | Commerce | Platform | Data | Other",
        "description": "Detailed description tailored to the client and the blueprint",
        "primaryOrSecondary": "primary|secondary",
        "maturityLevel": "Initial|Repeatable|Defined|Managed|Optimizing",
        "businessImpact": "High|Medium|Low",
        "recommendedSalesforceProducts": ["Sales Cloud","Manufacturing Cloud","MuleSoft","Data Cloud","Tableau","Einstein"],
        "notes": "Mapping rationale and discovery evidence"
      }
    ],
    "drawio": {
      "fileName": "capability-map-discrete-manufacturing.drawio",
      "drawioXml": "string - full DrawIO/diagrams.net XML content escaped as a string"
    }
  },

  "currentStateArchitecture": {
    "overview": "string",
    "systemsOfInnovation": [],
    "systemsOfDifferentiation": [],
    "systemsOfRecord": [],
    "integrationPatterns": [],
    "dataFlows": [],
    "painPoints": []
  },

  "futureStateArchitecture": {
    "overview": "string",
    "systemsOfInnovation": [],
    "systemsOfDifferentiation": [],
    "systemsOfRecord": [],
    "platformComponents": {},
    "integrationApproach": "string - high level approach (e.g., MuleSoft for integrations, Batch ETL, CDC, etc.)",
    "dataStrategy": "string - how data will be centralized or federated, identities, master data locations",
    "migrationNotes": []
  },

  "prioritizationMatrix": [],
  "strategicRoadmap": []
}

GUIDANCE AND RULES:
- Use the Salesforce Discrete Manufacturing capability map blueprint as the baseline. Where the discovery data indicates differences, annotate each capability with evidence from discovery and how it should be adapted.
- For each capability include: description, recommended Salesforce products, maturity assessment (use the provided maturity scale), and a concise business impact statement.
- Provide at least 12 primary capabilities (or fewer if discovery clearly limits scope) and include additional secondary capabilities from the blueprint.
- The drawio.drawioXml must be a complete diagrams.net (draw.io) XML document representing the capability map nodes grouped by category, with labels showing capability name, maturity, and recommended products. Ensure the XML can be saved as a .drawio file and opened in diagrams.net. If the complete blueprint is too large visually, prioritize primary capabilities as larger nodes and secondary as smaller/hidden layers.
 - For maturity levels, use the scale: Initial, Repeatable, Defined, Managed, Optimizing. Base assessments strictly on discovery evidence. If discovery lacks explicit systems, you may infer common systems for discrete manufacturing (ERP, MES, PLM, WMS, SCMS) but tag them as "inferred": true and include the rationale.
- Prioritization matrix: include 6-8 initiatives with varied value/effort using discovery data to justify ranking.
- Roadmap: create exactly 3 phases (Foundation, Build, Scale) and assign top initiatives to phases with estimated timelines tied to discovery timeline where possible.
- Return ONLY valid JSON that exactly follows the required structure above.
 - Architecture content rules (critical):
   - "currentStateArchitecture.overview" must summarize how the client's existing systems (listed above) interact across Systems of Record/Differentiation/Innovation.
   - For each system listed under the three categories, include: "name", "vendor", "type" (ERP/MES/CRM/PLM/Other), "deployment" (cloud/on-prem/hybrid), "primaryDataOwned", and at least one sentence of evidence from discovery or label as "inferred" with reason.
   - "integrationPatterns" should list observed integration types (API, batch ETL, file drops, EDI) and where they exist.
   - "dataFlows" should enumerate key data flows (e.g., order -> ERP -> MES -> shop-floor) with owners and direction.
   - "painPoints" should map pain to systems or flows (e.g., latency in order sync between MES and ERP causing delays).
   - "futureStateArchitecture.overview" must describe the target Salesforce-centered architecture and how Salesforce products map to capabilities, including where MuleSoft or middleware will mediate integrations, and specify recommended Data Cloud or MDM placement.
   - "migrationNotes" should provide 3-6 pragmatic steps to move from current to future (example: pilot integrations, consolidate master data, iterative rollout) with estimated relative effort.
   - If any architecture field cannot be directly derived from discovery data, synthesize minimal, conservative suggestions and mark them as "inferred" with rationale.
 - Return ONLY valid JSON that exactly follows the required structure above.
`;

// Use this prompt in your API call
    // Validate API key early and return a clear error if missing
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Anthropic API key is not configured. Set ANTHROPIC_API_KEY in the environment.');
    return NextResponse.json(
      { error: 'Anthropic API key is not configured. Set ANTHROPIC_API_KEY in the environment.' },
      { status: 500 }
    );
  }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        //'x-api-key':'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',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: systemPrompt }],
      }),
    })

        console.log('API Response status:', response.status)

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Anthropic API Error:', errorBody);
        const headersObj: Record<string, string> = {};
        // @ts-ignore
        response.headers.forEach((v: string, k: string) => { headersObj[k] = v });

        if (response.status === 429) {
          return NextResponse.json(
            {
              error: `Rate limit exceeded: API request failed: ${response.status} - ${errorBody}`,
              statusCode: response.status,
              headers: headersObj
            },
            { status: 429 }
          );
        }

        throw new Error(`API request failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json()
    const rawText: string = (data?.content && data.content[0] && data.content[0].text) || JSON.stringify(data)
    const text = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Robust JSON parsing helper for LLM outputs
    const tryParseLLMJson = (input: string) => {
      // 1) direct parse
      try { return JSON.parse(input); } catch (e) {}

      // 2) extract first {...} block
      const first = input.indexOf('{');
      const last = input.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        let candidate = input.slice(first, last + 1);
        // 3) common fixes: remove trailing commas
        candidate = candidate.replace(/,\s*(?=[}\]])/g, '');
        // 4) quote unquoted keys: { key: -> { "key":
        candidate = candidate.replace(/([,{\n\s])(\w+)\s*:/g, '$1"$2":');
        // 5) convert single-quoted strings to double quotes
        candidate = candidate.replace(/'([^']*)'/g, '"$1"');

        try { return JSON.parse(candidate); } catch (e) {
          // fall through
        }
      }

      // 6) last resort: try to coerce single quotes globally and parse
      try {
        let coerced = input.replace(/,\s*(?=[}\]])/g, '');
        coerced = coerced.replace(/([,{\n\s])(\w+)\s*:/g, '$1"$2":');
        coerced = coerced.replace(/'([^']*)'/g, '"$1"');
        return JSON.parse(coerced);
      } catch (e) {
        throw new Error('Failed to parse LLM JSON output');
      }
    }

    let parsed: any;
    try {
      parsed = tryParseLLMJson(text);
    } catch (parseErr) {
      console.error('Failed to parse LLM output as JSON. Raw text:\n', text.slice(0, 20000));
      return NextResponse.json({ error: 'Failed to parse model output as JSON', raw: text.slice(0, 20000) }, { status: 500 });
    }

    // If the model produced valid JSON but left architecture sections empty, synthesize minimal
    // current and future state architecture content from discoveryData and the capability map.
    const synthesizeArchitectures = (artifacts: any, discovery: any) => {
      const caps: any[] = (artifacts?.capabilityMap?.capabilities) || (artifacts?.capabilities) || [];
      const explicit: string[] = (discovery?.explicitCapabilities) || [];
      const systems = discovery?.systems || [];

      // Helpers
      const firstNames = (arr: any[], count = 5) => arr.slice(0, count).map((i: any) => (typeof i === 'string' ? i : (i.name || JSON.stringify(i)))).filter(Boolean);
      const detectCommonSystemsFromCaps = () => {
        const found: any[] = [];
        const mapping: { [k: string]: string } = { ERP: 'ERP', MES: 'MES', PLM: 'PLM', WMS: 'WMS', CRM: 'CRM' };
        const capNames = caps.map(c => (c && c.name ? String(c.name).toUpperCase() : ''));
        Object.keys(mapping).forEach(k => {
          if (capNames.some(n => n.includes(k))) found.push({ name: mapping[k], inferred: true, notes: `Inferred from capability names containing ${k}` });
        });
        return found;
      };

      // Ensure currentStateArchitecture exists
      artifacts.currentStateArchitecture = artifacts.currentStateArchitecture || {};
      const cur = artifacts.currentStateArchitecture;
      if (!cur.overview || String(cur.overview).trim() === '') {
        const sysList = firstNames(systems.length ? systems : detectCommonSystemsFromCaps());
        const capList = explicit.length ? explicit.slice(0, 6) : firstNames(caps, 6);
        cur.overview = `Observed systems: ${sysList.length ? sysList.join(', ') : 'none explicitly detected'}. Key capabilities: ${capList.length ? capList.join(', ') : 'none explicitly detected'}.`;
        cur.synthesized = true;
      }

      // Ensure category arrays exist and populate minimal entries if empty
      cur.systemsOfRecord = (cur.systemsOfRecord && cur.systemsOfRecord.length) ? cur.systemsOfRecord : (systems.length ? systems.filter((s: any) => (s.type || '').toLowerCase().includes('record') || (s.role || '').toLowerCase().includes('record')) : detectCommonSystemsFromCaps());
      cur.systemsOfDifferentiation = (cur.systemsOfDifferentiation && cur.systemsOfDifferentiation.length) ? cur.systemsOfDifferentiation : [];
      cur.systemsOfInnovation = (cur.systemsOfInnovation && cur.systemsOfInnovation.length) ? cur.systemsOfInnovation : [];
      cur.integrationPatterns = cur.integrationPatterns || ['inferred: API integrations, batch ETL (synthesized)'];
      cur.dataFlows = cur.dataFlows || [`Orders -> ERP -> MES (inferred from capabilities)`];
      cur.painPoints = cur.painPoints || [`No explicit pain points found in discovery; inferred potential sync latency between ERP and MES`];

      // Future state
      artifacts.futureStateArchitecture = artifacts.futureStateArchitecture || {};
      const fut = artifacts.futureStateArchitecture;
      if (!fut.overview || String(fut.overview).trim() === '') {
        // Try to detect recommended Salesforce products from capabilities
        const recommended = (caps.map(c => (c.recommendedSalesforceProducts || [])).flat().filter(Boolean) || []).slice(0, 5);
        const recStr = recommended.length ? recommended.join(', ') : 'Salesforce Manufacturing Cloud, MuleSoft, Data Cloud';
        fut.overview = `Target architecture: Salesforce-centered platform leveraging ${recStr}. Integrations via MuleSoft or API-led patterns and central data staging in Data Cloud/MDM. (This summary was synthesized from discovery and capabilities)`;
        fut.synthesized = true;
      }
      fut.integrationApproach = fut.integrationApproach || 'MuleSoft for APIs, CDC/ETL for bulk sync (synthesized)';
      fut.dataStrategy = fut.dataStrategy || 'Centralize master data in Data Cloud/MDM; replicate critical operational data to Salesforce for transactions (synthesized)';
      fut.migrationNotes = fut.migrationNotes && fut.migrationNotes.length ? fut.migrationNotes : [
        { step: 'Pilot', desc: 'Pilot Salesforce + one integration (ERP->Salesforce) to validate patterns', effort: 'low-medium' },
        { step: 'Consolidate Master Data', desc: 'Establish MDM/Data Cloud and reconcile key identifiers', effort: 'medium' },
        { step: 'Integrate MES', desc: 'Bring MES integrations online with APIs or batch patterns', effort: 'medium-high' }
      ];

      return artifacts;
    };

    try {
      parsed = synthesizeArchitectures(parsed, discoveryData);
    } catch (synthErr) {
      console.warn('Synthesis of architectures failed:', synthErr);
    }

    // Include the raw model output alongside parsed artifacts for debugging
    return NextResponse.json({ artifacts: parsed, rawModelOutput: rawText })
} catch (error) {
  console.error('Generation error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Failed to generate artifacts';
  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  );
}
}
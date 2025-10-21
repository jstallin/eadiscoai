import { NextRequest, NextResponse } from 'next/server';

interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  base64Data: string;
  success: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              ...files.map((file: ProcessedFile) => ({
                type: "document",
                source: {
                  type: "base64",
                  media_type: file.type || "application/pdf",
                  data: file.base64Data,
                },
              })),
              {
                type: "text",
                text: `You are analyzing discovery documents for a Salesforce Enterprise Architecture engagement. Extract the following information from these documents:

IMPORTANT: Your response MUST be ONLY valid JSON. Do not include any markdown formatting, backticks, or explanatory text. Start directly with { and end with }.

Extract and return this exact JSON structure:
{
  "companyName": "string - the company name",
  "industry": "string - the industry sector",
  "businessContext": "string - detailed business context, operations, size, market position",
  "currentChallenges": "string - key business and technical challenges they're facing",
  "strategicGoals": "string - their strategic goals and objectives for the next 1-3 years",
  "technicalLandscape": "string - current technology systems, platforms, and tools mentioned",
  "constraints": "string - budget constraints, compliance requirements, technical limitations",
  "timeline": "string - any mentioned project timelines or urgency",
  "budget": "string - budget ranges or financial constraints if mentioned"
}

Rules:
- Extract actual content from the documents
- Be comprehensive but concise
- If information is not found, use empty string ""
- Focus on information relevant to Salesforce implementation
- Combine information from all documents provided
- Return ONLY the JSON object, nothing else`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    
    // Strip markdown formatting if present
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const extractedData = JSON.parse(responseText);

    return NextResponse.json({ extractedData });

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze documents';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
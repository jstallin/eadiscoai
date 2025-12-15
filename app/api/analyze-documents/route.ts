import { NextRequest, NextResponse } from 'next/server';

// Dynamically require pdf-parse if available. It's optional in package.json so missing
// dependency won't crash the server. When present, we use it to extract text from PDFs
// and avoid sending large base64 blobs to the model.
let pdfParse: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  pdfParse = require('pdf-parse');
} catch (e) {
  // pdf-parse is optional; extraction will be disabled if it's not installed
  // This is intentionally a console.warn rather than throwing so devs can opt-in.
  // eslint-disable-next-line no-console
  console.warn('pdf-parse not installed — server-side PDF extraction disabled. Install pdf-parse to enable.');
}

interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  base64Data: string;
  success: boolean;
}

export async function POST(request: NextRequest) {
  // Validate API key early and return clear error for the frontend
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Anthropic API key is not configured. Set ANTHROPIC_API_KEY in the environment.');
    return NextResponse.json(
      { error: 'Anthropic API key is not configured. Set ANTHROPIC_API_KEY in the environment.' },
      { status: 500 }
    );
  }

  try {
    const { files } = await request.json();

    // Calculate approximate total payload size (bytes) from base64 data
    const totalBytes = (files || []).reduce((acc: number, f: ProcessedFile) => {
      if (!f.base64Data) return acc;
      // base64 to bytes: approx length * 3/4
      return acc + Math.ceil(f.base64Data.length * 3 / 4);
    }, 0);

    // If payload is very large, fail fast with actionable message.
    // Default to 8MB but allow override with UPLOAD_MAX_BYTES env var (in bytes)
    const envLimit = process.env.UPLOAD_MAX_BYTES ? parseInt(process.env.UPLOAD_MAX_BYTES, 10) : NaN;
    const MAX_BYTES = Number.isFinite(envLimit) && envLimit > 0 ? envLimit : 16_000_000; // default ~16MB

    console.log(`Total upload size: ${totalBytes} bytes; limit: ${MAX_BYTES} bytes`);

    if (totalBytes > MAX_BYTES) {
      console.error(`Total upload size too large: ${totalBytes} bytes (limit ${MAX_BYTES} bytes)`);
      return NextResponse.json(
        { error: `Total uploaded file size is too large (${Math.round(totalBytes / 1024)} KB). Limit is ${Math.round(MAX_BYTES / 1024)} KB. Try uploading fewer/smaller files or switch to text extraction before sending to the API.` },
        { status: 413 }
      );
    }

    // Helper: fetch with retries for transient network errors (EPIPE, ECONNRESET)
    const fetchWithRetries = async (url: string, options: any, retries = 2, backoff = 500) => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch(url, options);

          // Retry on transient 5xx responses
          if ([502, 503, 504].includes(res.status) && attempt < retries) {
            console.warn(`Received ${res.status} from ${url}, retrying in ${backoff}ms (attempt ${attempt + 1}/${retries})`);
            await new Promise(r => setTimeout(r, backoff));
            backoff *= 2;
            continue;
          }

          return res;
        } catch (err: any) {
          const isTransient = err && (err.code === 'EPIPE' || err.code === 'ECONNRESET' || err.type === 'request-timeout');
          if (attempt < retries && isTransient) {
            console.warn(`Fetch failed (${err.code}), retrying in ${backoff}ms...`);
            await new Promise(r => setTimeout(r, backoff));
            backoff *= 2;
            continue;
          }
          throw err;
        }
      }
      // If we exhausted retries, make one final attempt which will throw or return
      return fetch(url, options);
    };

    // Server-side extraction: convert PDFs and text files into smaller textual payloads
    // so we send the model extracted text instead of huge base64 blobs when possible.
    const processedForModel: Array<{ type: 'text' | 'document'; text?: string; document?: any }> = [];

    for (const file of (files || []) as ProcessedFile[]) {
      try {
        const lower = (file.name || '').toLowerCase();
        const media = (file.type || '').toLowerCase();

        // If pdf-parse is available, attempt to extract text
        if (pdfParse && (lower.endsWith('.pdf') || media === 'application/pdf')) {
          const buffer = Buffer.from(file.base64Data || '', 'base64');
          const pdfData = await pdfParse(buffer);
          const text = pdfData && pdfData.text ? String(pdfData.text).trim() : '';
          if (text && text.length > 20) {
            processedForModel.push({ type: 'text', text: `--- Begin extracted text from ${file.name} ---\n${text}\n--- End extracted text ---` });
            continue;
          }
        }

        // If it's a plain text file, decode and send as text
        if (media.startsWith('text/') || lower.endsWith('.txt')) {
          const decoded = Buffer.from(file.base64Data || '', 'base64').toString('utf8');
          processedForModel.push({ type: 'text', text: `--- Begin text file ${file.name} ---\n${decoded}\n--- End text file ---` });
          continue;
        }

        // Fallback: send as base64 document (existing behavior)
        processedForModel.push({ type: 'document', document: {
          type: 'document',
          source: {
            type: 'base64',
            media_type: file.type || 'application/octet-stream',
            data: file.base64Data,
          }
        } });
      } catch (err) {
        console.warn('Error extracting file, falling back to base64 send:', file.name, err);
        processedForModel.push({ type: 'document', document: {
          type: 'document',
          source: {
            type: 'base64',
            media_type: file.type || 'application/octet-stream',
            data: file.base64Data,
          }
        } });
      }
    }

    // Build message contents: include all extracted texts then any binary documents, then the instruction
    const messageContents: any[] = [];
    for (const p of processedForModel) {
      if (p.type === 'text' && p.text) messageContents.push({ type: 'text', text: p.text });
      else if (p.type === 'document' && p.document) messageContents.push(p.document);
    }

    // Final instruction message to the model
    messageContents.push({
      type: 'text',
      text: `You are analyzing discovery documents for a Salesforce Enterprise Architecture engagement. Extract the following information from these documents:\n\nIMPORTANT: Your response MUST be ONLY valid JSON. Do not include any markdown formatting, backticks, or explanatory text. Start directly with { and end with }.\n\nExtract and return this exact JSON structure (add additional manufacturing/capability-focused fields to help artifact generation):\n{\n  "companyName": "string - the company name",\n  "industry": "string - the industry sector",\n  "businessContext": "string - detailed business context, operations, size, market position",\n  "currentChallenges": "string - key business and technical challenges they're facing",\n  "strategicGoals": "string - their strategic goals and objectives for the next 1-3 years",\n  "technicalLandscape": "string - current technology systems, platforms, and tools mentioned",\n  "constraints": "string - budget constraints, compliance requirements, technical limitations",\n  "timeline": "string - any mentioned project timelines or urgency",\n  "budget": "string - budget ranges or financial constraints if mentioned",\n  "systems": ["array of system objects found in documents, include name, vendor, type (ERP/MES/CRM/PLM/Other), brief notes"],\n  "manufacturingProcesses": ["list any manufacturing-specific processes mentioned (e.g., production planning, MES, quality management, shop floor execution)"],\n  "explicitCapabilities": ["capabilities explicitly mentioned in the documents or RFPs (e.g., order management, inventory, BOM management, quality control)"],\n  "documentSummaries": ["concise per-document one-sentence summary useful for traceability"]\n}\n\nRules:\n- Extract actual content from the provided extracted texts or attached documents.\n- Be comprehensive but concise.\n- If information is not found, use empty string \"\" or empty array [].\n- Focus on information relevant to Salesforce implementation and discrete manufacturing capabilities.\n- Combine information from all documents provided where appropriate.\n- Return ONLY the JSON object, nothing else`
    });

    const response = await fetchWithRetries("https://api.anthropic.com/v1/messages", {
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
            content: messageContents
          }
        ]
      })
    });

    if (!response.ok) {
      const raw = await response.text();
      // Collect response headers for diagnostics (rate limit info)
      const headersObj: Record<string, string> = {};
      // @ts-ignore - headers.forEach exists on Fetch API Headers
      response.headers.forEach((v: string, k: string) => { headersObj[k] = v });

      // Truncate raw body for safety
      const rawTruncated = raw && raw.length > 2000 ? `${raw.slice(0, 2000)}\n...[truncated]` : raw;

      // Log the full raw response on server for debugging (may be HTML from upstream)
      console.error(`Upstream API returned ${response.status}. Response body (truncated):\n${rawTruncated}`);

      if ([429].includes(response.status)) {
        return NextResponse.json(
          {
            error: `Rate limit exceeded: API request failed: ${response.status}`,
            statusCode: response.status,
            headers: headersObj,
            raw: rawTruncated
          },
          { status: 429 }
        );
      }

      // For other non-OK responses (502/503/504 etc.) return a helpful payload with headers and truncated raw body
      return NextResponse.json(
        {
          error: `Upstream API request failed: ${response.status}`,
          statusCode: response.status,
          headers: headersObj,
          raw: rawTruncated
        },
        { status: 502 }
      );
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
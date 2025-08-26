// app/api/consultants/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      type, 
      consultant, 
      name, 
      systemPrompt, 
      userPrompt, 
      question,
      context,
      consultantInfo 
    } = body;

    // Validate required fields
    if (!type || !consultant || !name) {
      return NextResponse.json(
        { error: "Missing required fields: type, consultant, name" },
        { status: 400 }
      );
    }

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error("N8N_WEBHOOK_URL environment variable is not set");
      return NextResponse.json(
        { error: "N8N webhook URL is not configured" },
        { status: 500 }
      );
    }

    console.log(`Processing ${type} request for ${name}...`);

    // Prepare payload for n8n
    const payload = {
      type,
      consultant,
      name,
      systemPrompt,
      userPrompt,
      question,
      context,
      consultantInfo,
      timestamp: new Date().toISOString(),
      // Add any additional metadata
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userAgent: req.headers.get('user-agent') || 'unknown',
    };

    // Send request to n8n
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any additional headers n8n might need
        "User-Agent": "Legendary-Minds-Platform/1.0",
      },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`N8N responded with status ${n8nResponse.status}:`, errorText);
      throw new Error(`N8N webhook failed with status: ${n8nResponse.status}`);
    }

    // Parse the response from n8n
    const responseData = await n8nResponse.json();
    
    console.log(`${name} consultation completed successfully`);

    // Return the response to the client
    return NextResponse.json(responseData);

  } catch (error: unknown) {
    let errorMessage = "Failed to process consultant request";
    let errorDetails = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = "Failed to process consultant request";
      errorDetails = error.message;
    } else {
      errorMessage = "An unexpected error occurred";
      errorDetails = String(error);
    }

    console.error("Error processing consultant request:", error);
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for health checks
export async function GET() {
  return NextResponse.json(
    { 
      status: "healthy", 
      service: "consultant-api",
      timestamp: new Date().toISOString() 
    },
    { status: 200 }
  );
}
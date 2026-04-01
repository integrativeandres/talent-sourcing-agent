import { NextRequest, NextResponse } from "next/server";
import { generateStrategy } from "@/lib/generate-strategy";
import { HiringBrief } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log("REQUEST BODY:", body);

  const { role, company, description } = body as HiringBrief;

  if (!role?.trim() || !company?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "role, company, and description are required" },
      { status: 400 }
    );
  }

  try {
    const strategy = await generateStrategy({ role, company, description });

    console.log("STRATEGY OUTPUT:", strategy);

    return NextResponse.json(strategy);
  } catch (error) {
    console.error("ERROR GENERATING STRATEGY:", error);

    return NextResponse.json(
      { error: "Failed to generate strategy" },
      { status: 500 }
    );
  }
}
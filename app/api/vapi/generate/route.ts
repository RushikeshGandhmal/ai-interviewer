import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const {
    type,
    role,
    level,
    techstack,
    amount,
    userid,
    jobDescription,
    resumeText,
  } = await request.json();

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `You are an Nora AI assistant.

        Your task is to generate a set of thoughtful, role-specific interview questions for a candidate. Use the following inputs to tailor the questions:

        - Job Role: ${role}
        - Experience Level: ${level}
        - Tech Stack: ${techstack}
        - Interview Type: ${type} (focus on technical or behavioral)
        - Job Description: ${jobDescription}
        - Candidate Resume: ${resumeText}
        - Number of Questions: ${amount}

        Please ensure:
        - The questions are relevant to the candidate’s background and job expectations.
        - No special characters like "/", "*", or non-speakable symbols are included.
        - Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]

        Do not include any introductory text, explanations, or closing statements — just the array of questions.
        `,
    });

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: JSON.parse(questions),
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}

import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Generate account summary based on account data, deals, projects, etc.
export async function generateAccountSummary(accountData: any): Promise<string> {
  try {
    const prompt = `
    Please provide a comprehensive summary of this account based on the following data:
    ${JSON.stringify(accountData, null, 2)}

    Include:
    1. Overview of account status and health
    2. Summary of active deals and their stages
    3. Summary of ongoing projects and their status
    4. Key metrics and insights
    5. Recent activities and interactions

    Format this as a professional summary that an account manager would find useful.
    `;

    const message = await anthropic.messages.create({
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-7-sonnet-20250219',
    });

    if (message.content[0].type === 'text') {
      return message.content[0].text;
    }
    return "Failed to generate summary.";
  } catch (error: any) {
    console.error("Failed to generate account summary:", error);
    throw new Error(`Failed to generate account summary: ${error.message}`);
  }
}

// Generate next steps recommendations for an account
export async function generateNextStepsRecommendations(accountData: any): Promise<string> {
  try {
    const prompt = `
    Based on the following account data, suggest 3-5 actionable next steps for the account manager:
    ${JSON.stringify(accountData, null, 2)}

    For each recommended step:
    1. Provide a clear, specific action
    2. Include a brief explanation of why this action is important
    3. Suggest a timeframe for completion (immediate, within a week, etc.)
    4. If applicable, mention potential impact on account health or deal progression

    Format these as a prioritized list that an account manager can easily follow.
    `;

    const message = await anthropic.messages.create({
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-7-sonnet-20250219',
    });

    if (message.content[0].type === 'text') {
      return message.content[0].text;
    }
    return "Failed to generate recommendations.";
  } catch (error: any) {
    console.error("Failed to generate next steps recommendations:", error);
    throw new Error(`Failed to generate next steps recommendations: ${error.message}`);
  }
}

// Generate a task playbook for an account based on its current state
export async function generateTaskPlaybook(accountData: any): Promise<any> {
  try {
    const prompt = `
    Create a detailed task playbook for managing this account based on the following data:
    ${JSON.stringify(accountData, null, 2)}

    The playbook should include:
    1. A sequence of tasks organized by timeline (immediate, short-term, long-term)
    2. For each task:
       - Clear title/description
       - Estimated effort (low, medium, high)
       - Expected outcome
       - Suggested owner role (account manager, support, etc.)
    3. Critical checkpoints or milestones
    4. Potential risks and mitigation strategies

    Format your response as a structured JSON array of task objects with these properties:
    {
      tasks: [
        {
          "title": "Task title",
          "description": "Detailed description",
          "timeline": "immediate|short-term|long-term",
          "effort": "low|medium|high",
          "outcome": "Expected outcome",
          "owner": "Suggested role",
          "isCheckpoint": boolean
        },
        ...
      ]
    }
    `;

    const message = await anthropic.messages.create({
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-7-sonnet-20250219',
    });

    // Parse the JSON response from Anthropic
    if (message.content[0].type === 'text') {
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("Failed to parse response as JSON");
      }
      
      const taskPlaybook = JSON.parse(jsonMatch[0]);
      return taskPlaybook;
    }
    
    throw new Error("Failed to get text response from API");
  } catch (error: any) {
    console.error("Failed to generate task playbook:", error);
    throw new Error(`Failed to generate task playbook: ${error.message}`);
  }
}
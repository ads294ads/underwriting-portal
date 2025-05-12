import OpenAI from 'openai';

async function testOpenAI() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("Testing OpenAI API with GPT-4o...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert financial document analyzer."
        },
        {
          role: "user",
          content: "Analyze this simplified financial statement for a loan application:\nRevenue: $1.25M\nExpenses: $1.03M\nNet Income: $220K\nDebt-to-Equity: 0.45\nCurrent Ratio: 2.3"
        }
      ],
      max_tokens: 100
    });

    console.log("API Response:", response.choices[0].message.content);
    console.log("Test successful - OpenAI API key is working correctly!");
    
    return true;
  } catch (error) {
    console.error("Error testing OpenAI API:", error.message);
    return false;
  }
}

// Run the test
testOpenAI()
  .then(result => {
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
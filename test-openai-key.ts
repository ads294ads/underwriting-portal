import OpenAI from 'openai';

async function testOpenAIKey() {
  try {
    // Initialize the OpenAI client with the environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("Testing OpenAI API key...");
    
    // Make a simple request to check if the key is valid
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Please respond with 'OpenAI API key is working correctly!' if you receive this message."
        }
      ],
      max_tokens: 50
    });

    console.log("OpenAI API Response:", response.choices[0].message.content);
    console.log("API key is valid and working correctly!");
    
    return true;
  } catch (error) {
    console.error("Error testing OpenAI API key:", error);
    return false;
  }
}

// Run the test
testOpenAIKey()
  .then((success) => {
    if (success) {
      console.log("Test completed successfully.");
    } else {
      console.log("Test failed. Please check your API key and try again.");
    }
  })
  .catch((error) => {
    console.error("Unexpected error during test:", error);
  });
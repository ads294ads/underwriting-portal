// Test script to verify API keys are working
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API...");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: "Hello, can you respond with just 'OpenAI API working'?" }],
      max_completion_tokens: 10
    });
    
    console.log("✅ OpenAI API Response:", response.choices[0].message.content);
    return true;
  } catch (error) {
    console.log("❌ OpenAI API Error:", error.message);
    return false;
  }
}

async function testAnthropic() {
  try {
    console.log("Testing Anthropic API...");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hello, can you respond with just 'Anthropic API working'?" }],
    });
    
    const textContent = response.content[0];
    if (textContent.type === 'text') {
      console.log("✅ Anthropic API Response:", textContent.text);
      return true;
    }
  } catch (error) {
    console.log("❌ Anthropic API Error:", error.message);
    return false;
  }
}

async function testAPIs() {
  console.log("=== API Key Testing ===");
  
  const openaiWorks = await testOpenAI();
  const anthropicWorks = await testAnthropic();
  
  console.log("\n=== Results ===");
  console.log("OpenAI:", openaiWorks ? "✅ Working" : "❌ Failed");
  console.log("Anthropic:", anthropicWorks ? "✅ Working" : "❌ Failed");
  
  if (openaiWorks && anthropicWorks) {
    console.log("\n🎉 All APIs are working correctly!");
  } else {
    console.log("\n⚠️  Some APIs are not working. Check your API keys.");
  }
}

testAPIs().catch(console.error);
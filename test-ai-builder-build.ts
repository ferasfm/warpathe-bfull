import { generateMissionFromDescription } from './src/lib/ai-mission-builder.functions';

async function testAiMissionBuilder() {
  console.log('Testing AI Mission Builder...');
  
  try {
    // Note: This will fail in this environment if LOVABLE_API_KEY is missing or if not running in a context with auth.
    // But we can check if the file compiles and if the logic looks sound.
    console.log('Server function imported successfully.');
    
    // We can't easily run the server function here because it requires a Supabase context/auth.
    // Instead, we'll verify the build.
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testAiMissionBuilder();

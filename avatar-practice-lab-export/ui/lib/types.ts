// Central re-exports so agent files don’t need to reach deep into the SDK path

// Note: These exports are commented out as they're not available in the current OpenAI SDK
// If you need realtime functionality, check the latest OpenAI SDK documentation
export { tool } from 'openai/realtime';
export type { RealtimeAgent, FunctionTool } from 'openai/realtime';


// Note: These imports are commented out as they're not available in the current OpenAI SDK
// If you need realtime functionality, check the latest OpenAI SDK documentation
// import { RealtimeItem, tool } from "openai/realtime";

export const roleplayAgentInstructions = `Triggers a transfer of the user to a more specialized agent. 
  Calls escalate to a more specialized LLM agent or to a human agent, with additional context. 
  Only call this function if one of the available agents is appropriate. Don't transfer to your own agent type.
  
  Let the user know you're about to transfer them before doing so`;

export const roleplayAgentTools = [];

async function fetchResponsesMessage(body: any) {
  const response = await fetch("/api/avatar/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Preserve the previous behaviour of forcing sequential tool calls.
    body: JSON.stringify({ ...body, parallel_tool_calls: false }),
  });

  if (!response.ok) {
    console.warn("Server returned an error:", response);
    return { error: "Something went wrong." };
  }

  const completion = await response.json();
  return completion;
}

function getToolResponse(fName: string) {
  return { result: true };
}

/**
 * Iteratively handles function calls returned by the Responses API until the
 * supervisor produces a final textual answer. Returns that answer as a string.
 */
async function handleToolCalls(
  body: any,
  response: any,
  addBreadcrumb?: (title: string, data?: any) => void
) {
  let currentResponse = response;

  while (true) {
    if (currentResponse?.error) {
      return { error: "Something went wrong." } as any;
    }

    const outputItems: any[] = currentResponse.output ?? [];

    // Gather all function calls in the output.
    const functionCalls = outputItems.filter(
      (item) => item.type === "function_call"
    );

    if (functionCalls.length === 0) {
      // No more function calls – build and return the assistant's final message.
      const assistantMessages = outputItems.filter(
        (item) => item.type === "message"
      );

      const finalText = assistantMessages
        .map((msg: any) => {
          const contentArr = msg.content ?? [];
          return contentArr
            .filter((c: any) => c.type === "output_text")
            .map((c: any) => c.text)
            .join("");
        })
        .join("\n");

      return finalText;
    }

    // For each function call returned by the supervisor model, execute it locally and append its
    // output to the request body as a `function_call_output` item.
    for (const toolCall of functionCalls) {
      const fName = toolCall.name;
      const args = JSON.parse(toolCall.arguments || "{}");
      const toolRes = getToolResponse(fName);

      // Since we're using a local function, we don't need to add our own breadcrumbs
      if (addBreadcrumb) {
        addBreadcrumb(`[roleplayAgent] function call: ${fName}`, args);
      }
      if (addBreadcrumb) {
        addBreadcrumb(
          `[roleplayAgent] function call result: ${fName}`,
          toolRes
        );
      }

      // Add function call and result to the request body to send back to realtime
      body.input.push(
        {
          type: "function_call",
          call_id: toolCall.call_id,
          name: toolCall.name,
          arguments: toolCall.arguments,
        },
        {
          type: "function_call_output",
          call_id: toolCall.call_id,
          output: JSON.stringify(toolRes),
        }
      );
    }

    // Make the follow-up request including the tool outputs.
    currentResponse = await fetchResponsesMessage(body);
  }
}

// Note: Commented out tool export since the tool function is not available
// export const getNextResponseFromRoleplay = tool({
//   name: "getNextResponseFromRoleplay",
//   description:
//     "Determines the next response whenever the agent faces a non-trivial decision, produced by a highly intelligent supervisor agent. Returns a message describing what to do next.",
//   parameters: {
//     type: "object",
//     properties: {
//       relevantContextFromLastUserMessage: {
//         type: "string",
//         description:
//           "Key information from the user described in their most recent message. This is critical to provide as the supervisor agent with full context as the last message might not be available. Okay to omit if the user message didn't add any new information.",
//       },
//     },
//     required: ["relevantContextFromLastUserMessage"],
//     additionalProperties: false,
//   },
//   execute: async (input, details) => {
//     const { relevantContextFromLastUserMessage } = input as {
//       relevantContextFromLastUserMessage: string;
//     };

//     const addBreadcrumb = (details?.context as any)?.addTranscriptBreadcrumb as
//       | ((title: string, data?: any) => void)
//       | undefined;

//     const history: any[] = (details?.context as any)?.history ?? [];
//     const filteredLogs = history.filter((log) => log.type === "message");

//     const body: any = {
//       model: "gpt-4.1",
//       input: [
//         {
//           type: "message",
//           role: "system",
//           content: roleplayAgentInstructions,
//         },
//         {
//           type: "message",
//           role: "user",
//           content: `==== Conversation History ====
//           ${JSON.stringify(filteredLogs, null, 2)}
          
//           ==== Relevant Context From Last User Message ===
//           ${relevantContextFromLastUserMessage}
//           `,
//         },
//       ],
//       tools: roleplayAgentTools,
//     };

//     const response = await fetchResponsesMessage(body);
//     if (response.error) {
//       return { error: "Something went wrong." };
//     }

//     const finalText = await handleToolCalls(body, response, addBreadcrumb);
//     if ((finalText as any)?.error) {
//       return { error: "Something went wrong." };
//     }

//     return { nextResponse: finalText as string };
//   },
// });

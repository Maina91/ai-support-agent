import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda } from "@langchain/core/runnables";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  FunctionMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { StateGraph } from "@langchain/langgraph";
import config from "../config/index.js";
import { toolFactory, ToolResult } from "../tools/index.js";
import {
  SYSTEM_PROMPT,
  EVALUATION_PROMPT,
  TOOL_RESPONSE_PROMPT,
  HUMAN_ESCALATION_PROMPT,
} from "./prompts.js";
import { ConversationContext } from "../memory/types.js";

interface AgentState {
  messages: BaseMessage[];
  context: ConversationContext;
  toolCalls: {
    tool: string;
    input: Record<string, any>;
    result?: ToolResult;
  }[];
  currentThought?: string;
  plan?: string[];
  response?: string;
  confidenceScore?: number;
  needsHumanIntervention?: boolean;
}

export function createAgentWorkflow() {
  const llm = new ChatOpenAI({
    modelName: config.openai.model,
    temperature: config.openai.temperature,
    openAIApiKey: config.openai.apiKey,
    streaming: config.openai.streamMode,
  });

  const tools = toolFactory.getAllTools();
  const toolSchemas = tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
    },
  }));

  const llmWithTools = llm.bind({ tools: toolSchemas });

  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: { value: (x) => x, default: () => [] },
      context: {
        value: (x) => x,
        default: () => ({ sessionId: "", userId: "", history: [] }),
      },
      toolCalls: { value: (x) => x, default: () => [] },
      currentThought: { value: (x) => x, default: () => undefined },
      plan: { value: (x) => x, default: () => undefined },
      response: { value: (x) => x, default: () => undefined },
      confidenceScore: { value: (x) => x, default: () => undefined },
      needsHumanIntervention: { value: (x) => x, default: () => undefined },
    },
  });

  const constructMessages = async (state: AgentState) => {
    const systemMessage = new SystemMessage(SYSTEM_PROMPT);
    const userMessages = state.context.history
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      );

    if (state.context.relevantMemories?.length) {
      const contextAddition =
        "Here's some relevant information from previous conversations:\n" +
        state.context.relevantMemories
          .map((mem) => `- ${mem.content}`)
          .join("\n");
      userMessages.unshift(new SystemMessage(contextAddition));
    }

    return { ...state, messages: [systemMessage, ...userMessages] };
  };

  const analyzeRequest = async (state: AgentState) => {
    try {
      const response = await llmWithTools.invoke(state.messages);
      if (response.tool_calls?.length) {
        return {
          ...state,
          toolCalls: response.tool_calls.map((tc) => ({
            tool: tc.name,
            input: tc.args,
          })),
        };
      }
      return { ...state, response: response.content.toString() };
    } catch (error) {
      console.error("Error in analyzeRequest:", error);
      return {
        ...state,
        needsHumanIntervention: true,
        response:
          "I'm having trouble processing your request. Let me connect you with a human support agent.",
      };
    }
  };

  const executeTools = async (state: AgentState) => {
    const updatedToolCalls = [...(state.toolCalls ?? [])];
    for (let i = 0; i < updatedToolCalls.length; i++) {
      if (!updatedToolCalls[i].result) {
        try {
          const tool = toolFactory.createTool(updatedToolCalls[i].tool);
          if (!tool)
            throw new Error(`Tool '${updatedToolCalls[i].tool}' not found`);
          updatedToolCalls[i].result = await tool.execute(
            updatedToolCalls[i].input
          );
        } catch (err) {
          updatedToolCalls[i].result = {
            success: false,
            result: "Tool execution failed",
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }
    }
    const toolMessages = updatedToolCalls.map(
      (tc) =>
        new FunctionMessage(
          JSON.stringify(tc.result ?? "Tool execution pending"),
          tc.tool
        )
    );
    return {
      ...state,
      toolCalls: updatedToolCalls,
      messages: [...state.messages, ...toolMessages],
    };
  };

  const generateResponse = async (state: AgentState) => {
    if (state.response) return state;
    try {
      const userQuery =
        state.messages.filter((m) => m instanceof HumanMessage).pop()
          ?.content || "";
      const toolResults = state.toolCalls
        .map(
          (tc) =>
            `Tool: ${tc.tool}\nInput: ${JSON.stringify(tc.input)}\nResult: ${JSON.stringify(tc.result?.result)}`
        )
        .join("\n\n");
      const promptMessage = new SystemMessage(
        TOOL_RESPONSE_PROMPT.replace("{user_query}", userQuery).replace(
          "{tool_results}",
          toolResults
        )
      );
      const response = await llm.invoke([...state.messages, promptMessage]);
      return { ...state, response: response.content.toString() };
    } catch (error) {
      console.error("Error in generateResponse:", error);
      return {
        ...state,
        needsHumanIntervention: true,
        response:
          "I'm having trouble generating a response. Let me connect you with a human support agent.",
      };
    }
  };

  const evaluateResponse = async (state: AgentState) => {
    if (!state.response)
      return { ...state, needsHumanIntervention: true, confidenceScore: 0 };
    try {
      const userQuery =
        state.messages.filter((m) => m instanceof HumanMessage).pop()
          ?.content || "";
      const context =
        state.context.relevantMemories
          ?.map((mem) => mem.content)
          .join("\n\n") ?? "No relevant context available";
      const prompt = EVALUATION_PROMPT.replace("{response}", state.response)
        .replace("{query}", userQuery)
        .replace("{context}", context);
      const evalResult = await llm.invoke([new SystemMessage(prompt)]);
      const score = evalResult.content
        .toString()
        .match(/Overall confidence score: (\d+\.\d+)/i);
      const confidenceScore = score
        ? parseFloat(score[1])
        : config.agent.feedback.confidenceThreshold - 0.1;
      const needsHumanMatch = evalResult.content
        .toString()
        .match(
          /Does this response require human review\? \(Yes\/No\)\s*(Yes|No)/i
        );
      const needsHumanIntervention = needsHumanMatch
        ? needsHumanMatch[1].toLowerCase() === "yes"
        : confidenceScore < config.agent.feedback.confidenceThreshold;
      return { ...state, confidenceScore, needsHumanIntervention };
    } catch (error) {
      console.error("Error in evaluateResponse:", error);
      return { ...state, needsHumanIntervention: true, confidenceScore: 0 };
    }
  };

  const prepareHumanHandoff = async (state: AgentState) => {
    if (!state.needsHumanIntervention) return state;
    try {
      const userQuery =
        state.messages.filter((m) => m instanceof HumanMessage).pop()
          ?.content || "";
      const reason =
        state.confidenceScore === 0
          ? "Failed to generate or evaluate a response"
          : `Response confidence score (${state.confidenceScore}) is below threshold`;
      const prompt = HUMAN_ESCALATION_PROMPT.replace(
        "{user_query}",
        userQuery
      ).replace("{escalation_reason}", reason);
      const result = await llm.invoke([new SystemMessage(prompt)]);
      return { ...state, response: result.content.toString() };
    } catch (error) {
      console.error("Error in prepareHumanHandoff:", error);
      return {
        ...state,
        response:
          "I need to connect you with a human support agent for further assistance. Please wait while I transfer your conversation.",
      };
    }
  };

  const routeAfterAnalyze = new RunnableLambda({
    func: (state: AgentState) => {
      if (state.toolCalls?.some((tc) => !tc.result)) return "executeTools";
      if (!state.toolCalls?.length) return "evaluateResponse";
      return "executeTools";
    },
  });

  const routeAfterEvaluate = new RunnableLambda({
    func: (state: AgentState) =>
      state.needsHumanIntervention ? "prepareHumanHandoff" : "end",
  });

  workflow
    .addNode("constructMessages", constructMessages)
    .addNode("analyzeRequest", analyzeRequest)
    .addNode("executeTools", executeTools)
    .addNode("generateResponse", generateResponse)
    .addNode("evaluateResponse", evaluateResponse)
    .addNode("prepareHumanHandoff", prepareHumanHandoff)
    .addNode("end", async (state) => state)
    .addEdge("constructMessages", "analyzeRequest")
    .addConditionalEdges("analyzeRequest", routeAfterAnalyze)
    .addEdge("executeTools", "generateResponse")
    .addEdge("generateResponse", "evaluateResponse")
    .addConditionalEdges("evaluateResponse", routeAfterEvaluate)
    .addEdge("prepareHumanHandoff", "end")

  return workflow.compile();
}

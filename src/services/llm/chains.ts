import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatMemory } from 'langchain/memory';
import type { StructuredToolInterface } from '@langchain/core/tools';

const STORY_SYSTEM_TEMPLATE = `You are a Dungeon Master running a tabletop RPG campaign. You narrate the story, control NPCs, describe environments, and adjudicate game mechanics.

RPG System: {rpgSystem}
Campaign: {campaignName}

Rules:
- Stay in character as the DM
- Describe scenes vividly but concisely
- Present meaningful choices to players
- Use dice rolls for uncertain outcomes
- Track character state and world changes
- Be consistent with established lore and previous events`;

const CHARACTER_SHEET_SYSTEM_TEMPLATE = `You are an expert RPG character sheet generator. Given a character concept, you create a complete, balanced character sheet.

RPG System: {rpgSystem}

Rules:
- Generate stats appropriate for the RPG system
- Ensure the character is balanced and playable
- Include all required fields for the system
- Provide flavorful descriptions`;

const SUMMARY_SYSTEM_TEMPLATE = `You are a concise story summarizer for a tabletop RPG campaign. Your job is to compress conversation history into a brief summary that preserves key plot points, character developments, and world state changes.

Rules:
- Preserve all important plot developments
- Keep character names and relationships
- Note any world state changes
- Be concise — aim for 2-3 sentences per major event
- Do not include dice roll details, only outcomes`;

export function createStoryChain(
  llm: ChatOpenAI,
  memory: BaseChatMemory,
  tools: StructuredToolInterface[],
) {
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(STORY_SYSTEM_TEMPLATE),
    new MessagesPlaceholder('history'),
    HumanMessagePromptTemplate.fromTemplate('{input}'),
  ]);

  const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;

  return prompt.pipe(llmWithTools);
}

export function createCharacterSheetChain(llm: BaseChatModel) {
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(CHARACTER_SHEET_SYSTEM_TEMPLATE),
    HumanMessagePromptTemplate.fromTemplate('{characterConcept}'),
  ]);

  return prompt.pipe(llm);
}

export function createSummaryChain(llm: BaseChatModel) {
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(SUMMARY_SYSTEM_TEMPLATE),
    HumanMessagePromptTemplate.fromTemplate('{conversationHistory}'),
  ]);

  return prompt.pipe(llm);
}

export { STORY_SYSTEM_TEMPLATE, CHARACTER_SHEET_SYSTEM_TEMPLATE, SUMMARY_SYSTEM_TEMPLATE };

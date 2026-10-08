import {
  createToolHandler,
  defineToolSet,
  type InputSchemaMetaType,
  type OutputSchemaMetaType,
  type SecretSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

import { submitGeneration, retrieveTask } from './src/client.ts';

const secretSchema = z.object({
  apiKey: z.string().min(1).meta({
    title: 'Ace Data Cloud API key',
    description: 'Create an application API key at platform.acedata.cloud. Do not include Bearer.',
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

const outputSchema = z.object({
  taskId: z.string().meta({ title: 'Task ID' } satisfies OutputSchemaMetaType),
  traceId: z.string().meta({ title: 'Trace ID' } satisfies OutputSchemaMetaType),
  status: z.enum(['pending', 'succeeded', 'failed']).meta({ title: 'Task status' } satisfies OutputSchemaMetaType),
  success: z.boolean().meta({ title: 'Succeeded' } satisfies OutputSchemaMetaType),
  mediaUrls: z.array(z.string()).meta({ title: 'Media URLs' } satisfies OutputSchemaMetaType),
  costCredits: z.number().nullable().meta({ title: 'Reported Credits' } satisfies OutputSchemaMetaType)
});

const generateHandler = createToolHandler({
  inputSchema: z.object({
    text: z.string().trim().min(1).max(10000).meta({ title: 'Text', isToolParam: true } satisfies InputSchemaMetaType),
    model: z.string().trim().min(1).max(256).default('s2-pro').meta({ title: 'Model' } satisfies InputSchemaMetaType),
    format: z.string().trim().min(1).max(256).default('mp3').meta({ title: 'Format' } satisfies InputSchemaMetaType),
  }),
  outputSchema,
  secretSchema,
  handler: async (input, ctx) => submitGeneration(input, ctx.secrets?.apiKey ?? '')
});

const retrieveHandler = createToolHandler({
  inputSchema: z.object({
    taskId: z.string().trim().min(1).meta({
      title: 'Task ID',
      description: 'Bind to Generate → Task ID. Querying this ID does not generate again.',
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema,
  secretSchema,
  handler: async (input, ctx) => retrieveTask(input.taskId, ctx.secrets?.apiKey ?? '')
});

export default defineToolSet({
  manifest: {
    pluginId: 'acedataFishAudio',
    version: '0.1.0',
    name: { en: 'Ace Data Cloud Fish Audio', 'zh-CN': 'Ace Data Cloud Fish Audio 语音' },
    description: {
      en: 'Generate audio with Fish Audio through Ace Data Cloud and retrieve the same task.',
      'zh-CN': '通过 Ace Data Cloud Fish Audio 语音生成并查询同一任务。'
    },
    versionDescription: { en: 'Initial release', 'zh-CN': '首次发布' },
    author: 'Ace Data Cloud',
    repoUrl: 'https://github.com/AceDataCloud/FishAudioFastGPT',
    tutorialUrl: 'https://github.com/AceDataCloud/FishAudioFastGPT#quick-start',
    tags: ['multimodal'],
    permission: []
  },
  secretSchema,
  children: [
    {
      id: 'generate',
      name: { en: 'Generate audio', 'zh-CN': '生成Fish Audio 语音' },
      description: { en: 'Submit one Fish Audio generation and return its task ID.', 'zh-CN': '提交一次Fish Audio 语音生成并返回任务 ID。' },
      toolDescription: 'Submit once. Do not call again to check a pending task.',
      handler: generateHandler
    },
    {
      id: 'retrieveTask',
      name: { en: 'Retrieve task', 'zh-CN': '查询任务' },
      description: { en: 'Read the status and result of an existing Fish Audio task.', 'zh-CN': '读取已有Fish Audio 语音任务的状态和结果。' },
      toolDescription: 'Read an existing task by ID without submitting a new generation.',
      handler: retrieveHandler
    }
  ]
});

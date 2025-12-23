import { Tool } from './types';

export const toolsData: Tool[] = [
  // --- HOT (Featured) ---
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '国产最强开源模型，编程与数理逻辑极出色。',
    url: 'https://www.deepseek.com',
    categoryId: 'work', // Programming -> Work
    isHot: true,
    tags: ['开源', '编程', '强推'],
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: '国内首选，支持超长文件分析，阅读论文必备。',
    url: 'https://kimi.moonshot.cn',
    categoryId: 'chat',
    isHot: true,
    tags: ['长文本', '学术', '免费'],
  },
  {
    id: 'suno',
    name: 'Suno',
    description: 'AI 音乐界的天花板，写词、作曲、编曲一键完成。',
    url: 'https://suno.com',
    categoryId: 'media', // Audio -> Media
    isHot: true,
    tags: ['音乐', '神曲'],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: '全球画质天花板，艺术感、细节无可挑剔。',
    url: 'https://www.midjourney.com',
    categoryId: 'media', // Image -> Media
    isHot: true,
    tags: ['画质', '艺术', '付费'],
  },
  {
    id: 'gamma',
    name: 'Gamma',
    description: '手机也能看，输入文字一键生成精美 PPT 或网页。',
    url: 'https://gamma.app',
    categoryId: 'work',
    isHot: true,
    tags: ['PPT', '网页'],
  },

  // --- CHAT (对话) ---
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: '全球最强综合 AI，支持对话、联网、插件。',
    url: 'https://chat.openai.com',
    categoryId: 'chat',
    tags: ['对话', '标杆'],
  },
  {
    id: 'claude',
    name: 'Claude',
    description: '文本创作极佳，逻辑严密，超长文档理解神器。',
    url: 'https://claude.ai',
    categoryId: 'chat',
    tags: ['写作', '文档'],
  },
  {
    id: 'doubao',
    name: '豆包',
    description: '字节出品，手机端语音交互极其流畅。',
    url: 'https://www.doubao.com',
    categoryId: 'chat',
    tags: ['语音', '字节'],
  },
  {
    id: 'chatglm',
    name: '智谱清言',
    description: '清华系背景，学术分析与智能体应用能力强。',
    url: 'https://chatglm.cn',
    categoryId: 'chat',
    tags: ['清华', '学术'],
  },

  // --- STUDY (学习) ---
  {
    id: 'chatpdf',
    name: 'ChatPDF',
    description: '与 PDF 对话，快速提取论文重点。',
    url: 'https://www.chatpdf.com',
    categoryId: 'study',
    tags: ['PDF', '阅读'],
  },
  {
    id: 'duolingo-max',
    name: 'Duolingo Max',
    description: 'GPT-4 加持的语言学习，支持角色扮演对话。',
    url: 'https://www.duolingo.com',
    categoryId: 'study',
    tags: ['语言', '学习'],
  },

  // --- WORK (办公 - Includes Code, Search, Write, Translate, Scan) ---
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'AI 搜索先驱，实时查资料并附带参考来源。',
    url: 'https://www.perplexity.ai',
    categoryId: 'work',
    tags: ['搜索', '实时'],
  },
  {
    id: 'genspark',
    name: 'Genspark',
    description: '新一代 AI 搜索，生成定制化的 Spark 页面。',
    url: 'https://www.genspark.ai',
    categoryId: 'work',
    tags: ['搜索', '聚合'],
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    description: '笔记助手，自动总结、扩写、整理知识库。',
    url: 'https://www.notion.so',
    categoryId: 'work',
    tags: ['笔记', '知识库'],
  },
  {
    id: 'xiezuomao',
    name: '秘塔写作猫',
    description: '国内专业写作助手，纠错、公文润色效果好。',
    url: 'https://xiezuomao.com',
    categoryId: 'work',
    tags: ['纠错', '公文'],
  },
  {
    id: 'deepl',
    name: 'DeepL',
    description: '最准确的 AI 翻译工具，语境理解能力强。',
    url: 'https://www.deepl.com',
    categoryId: 'work',
    tags: ['翻译', '准确'],
  },
  {
    id: 'immersive-translate',
    name: '沉浸式翻译',
    description: '浏览器插件，双语对照网页翻译体验极佳。',
    url: 'https://immersive-translate.com',
    categoryId: 'work',
    tags: ['插件', '双语'],
  },
  {
    id: 'camscanner',
    name: '扫描全能王',
    description: '智能扫描文档，自动去除杂乱背景。',
    url: 'https://www.camscanner.com',
    categoryId: 'work',
    tags: ['扫描', '文档'],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: '新一代 AI 代码编辑器，编程效率提升神器。',
    url: 'https://cursor.sh',
    categoryId: 'work',
    tags: ['编辑器', '编程'],
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: '最流行的 AI 编程助手，自动补全代码。',
    url: 'https://github.com/features/copilot',
    categoryId: 'work',
    tags: ['补全', '插件'],
  },
  {
    id: 'otter',
    name: 'Otter.ai',
    description: '英文会议神器，实时转录并自动生成摘要。',
    url: 'https://otter.ai',
    categoryId: 'work',
    tags: ['会议', '转录'],
  },

  // --- LIFE (生活 - New) ---
  // (Reserved for future life/lifestyle tools)

  // --- MEDIA (多媒体 - Includes Image, Video, Audio) ---
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    description: '高度自由的开源绘图，支持本地化与插件扩展。',
    url: 'https://stability.ai',
    categoryId: 'media',
    tags: ['开源', '本地'],
  },
  {
    id: 'canva-magic',
    name: 'Canva Magic',
    description: '设计小白神器，AI 一键海报、修图、排版。',
    url: 'https://www.canva.com',
    categoryId: 'media',
    tags: ['设计', '排版'],
  },
  {
    id: 'remove-bg',
    name: 'Remove.bg',
    description: '一键智能抠图。',
    url: 'https://www.remove.bg',
    categoryId: 'media',
    tags: ['抠图', '便捷'],
  },
  {
    id: 'luma',
    name: 'Luma Dream',
    description: '视频生成动作连贯，画质极其真实。',
    url: 'https://lumalabs.ai/dream-machine',
    categoryId: 'media',
    tags: ['视频', '真实'],
  },
  {
    id: 'pika',
    name: 'Pika Art',
    description: '顶尖的视频/动画生成工具，动态效果自然。',
    url: 'https://pika.art',
    categoryId: 'media',
    tags: ['动画', '视频'],
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    description: '数字人视频生成，多国口型同步，营销必备。',
    url: 'https://www.heygen.com',
    categoryId: 'media',
    tags: ['数字人', '营销'],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: '全球最像真人的 AI 配音，支持声音克隆。',
    url: 'https://elevenlabs.io',
    categoryId: 'media',
    tags: ['配音', '克隆'],
  },

  // --- AGENT (智能体) ---
  {
    id: 'manus',
    name: 'Manus AI',
    description: '通用代理黑马，自动在网页上完成复杂任务。',
    url: 'https://manus.im',
    categoryId: 'agent',
    tags: ['代理', '自动化'],
  },
  {
    id: 'coze',
    name: 'Coze (扣子)',
    description: '字节出品，零代码快速搭建 AI 智能体 Bot。',
    url: 'https://www.coze.cn',
    categoryId: 'agent',
    tags: ['Bot', '低代码'],
  }
];
import { LucideIcon } from 'lucide-react';

export type CategoryId = 
  | 'new' 
  | 'news'       // 资讯 (New)
  | 'chat'       // 对话
  | 'study'      // 学习
  | 'work'       // 办公 (Includes Code, Search, Write, Translate, Scan)
  | 'life'       // 生活
  | 'media'      // 多媒体 (Includes Image, Video, Audio)
  | 'agent';     // 智能体

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  color: string; // Tailwind color class for accents
  iconColor: string; // Specific text color for the icon
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string; // Optional custom image
  categoryId: CategoryId;
  isHot?: boolean;
  tags?: string[]; // New: List of tags like "Free", "Open Source"
}

export interface NewsItem {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
}
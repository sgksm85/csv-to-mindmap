import { marked } from "marked";

// Markdownを解析して返す関数
export const parseMarkdown = async (markdownText: string) => {
  // markedライブラリでMarkdownをHTMLに変換
  return marked(markdownText);
};
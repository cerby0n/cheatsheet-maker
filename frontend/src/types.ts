/**
 * Type definitions for the Cheatsheet Creator application
 */

export type BlockType = "text" | "code" | "table" | "calculation" | "list" | "checkbox" | "reference" | "image";

export interface ReferenceCardRow {
  description: string;
  code: string;
  example?: string;  // Optional third column for examples
}

export interface Block {
  id: string;
  type: BlockType;
  title?: string;
  content: string;
  x: number;  // Grid column position
  y: number;  // Grid row position
  w: number;  // Grid width
  h: number;  // Grid height
  language?: string;  // For code blocks
  referenceData?: ReferenceCardRow[];  // For reference card blocks
  imageUrl?: string;  // For image blocks
  imageAlt?: string;  // Alt text for image blocks
}

export interface Section {
  id: string;
  title: string;
  titleColor?: string;  // Hex color for title
  titleSize?: 'sm' | 'md' | 'lg' | 'xl';  // Title size
  blocks: Block[];
}

export interface Cheatsheet {
  id: string;
  name: string;
  sections: Section[];
  created: string;
  updated: string;
}

export interface CheatsheetCreate {
  name: string;
}

export interface CheatsheetUpdate {
  name?: string;
  sections?: Section[];
}

// src/utils/pdfManager.ts

export interface Story {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  remoteUrl?: string;
  localUri?: string;
  isLocal?: boolean;
}

export const checkLocalStory = async (storyId: string): Promise<string | null> => {
  return null;
};

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

// Sample stories for the app
export const SAMPLE_STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    remoteUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'story-2',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    remoteUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];

export const checkLocalStory = async (storyId: string): Promise<string | null> => {
  return null;
};

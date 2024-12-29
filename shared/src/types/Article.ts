export interface Article {
    id: string;
    properties: {
      [key: string]: string | string[] | boolean | undefined | number;
    };
    cover: {
      type: string;
      external?: { url: string };
      file?: { url: string; expiry_time: string };
    } | null;
    url: string | null;
    content?: string;
  }


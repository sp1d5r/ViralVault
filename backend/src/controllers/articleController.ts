import { Request, Response } from 'express';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionToMarkdown } from "notion-to-md";
import {Article} from 'shared';
import {config} from 'dotenv';

config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const getArticles = async (req: Request, res: Response) => {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID as string,
    });
    
    const articles: Article[] = response.results
      .filter((page): page is PageObjectResponse => 'properties' in page)
      .map((page: PageObjectResponse) => {
        const properties: { [key: string]: string | string[] | boolean | undefined | number } = {};

        for (const [key, value] of Object.entries(page.properties)) {
          switch (value.type) {
            case 'title':
              properties[key] = value.title[0]?.plain_text || '';
              break;
            case 'rich_text':
              properties[key] = value.rich_text[0]?.plain_text || '';
              break;
            case 'date':
              properties[key] = value.date?.start || undefined;
              break;
            case 'checkbox':
              properties[key] = value.checkbox;
              break;
            case 'multi_select':
              properties[key] = value.multi_select.map((item) => item.name);
              break;
            case 'select':
              properties[key] = value.select?.name || undefined;
              break;
            case 'number':
              properties[key] = value.number || 0;
              break;
            case 'url':
              properties[key] = value.url || "";
              break;
            default:
              properties[key] = JSON.stringify(value);
          }
        }

        return {
          id: page.id,
          properties,
          url: page.url,
          cover: page.cover,
        };
      });

    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles from Notion:', error);
    res.status(500).json({ error: 'Failed to fetch articles from Notion' });
  }
};

export const getArticleBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID as string,
        filter: {
          property: "Slug",
          rich_text: {
            equals: slug
          }
        }
      });
  
      if (response.results.length === 0) {
        res.status(404).json({ error: "Article not found" });
        return;
      }
  
      const page = response.results[0] as PageObjectResponse;
      const n2m = new NotionToMarkdown({ notionClient: notion });
      const mdblocks = await n2m.pageToMarkdown(page.id);
      const mdString = n2m.toMarkdownString(mdblocks);
  
      const properties: { [key: string]: string | string[] | boolean | undefined | number } = {};
  
      for (const [key, value] of Object.entries(page.properties)) {
        switch (value.type) {
          case 'title':
            properties[key] = value.title[0]?.plain_text || '';
            break;
          case 'rich_text':
            properties[key] = value.rich_text[0]?.plain_text || '';
            break;
          case 'date':
            properties[key] = value.date?.start || undefined;
            break;
          case 'checkbox':
            properties[key] = value.checkbox;
            break;
          case 'multi_select':
            properties[key] = value.multi_select.map((item) => item.name);
            break;
          case 'select':
            properties[key] = value.select?.name || undefined;
            break;
          case 'number':
            properties[key] = value.number || undefined;
            break;
          case 'url':
            properties[key] = value.url || undefined;
            break;
          default:
            properties[key] = JSON.stringify(value);
        }
      }
  
      const article: Article = {
        id: page.id,
        properties,
        url: page.url,
        cover: page.cover,
        content: mdString.parent
      };
  
      res.json(article);
    } catch (error) {
      console.error('Error fetching article from Notion:', error);
      res.status(500).json({ error: 'Failed to fetch article from Notion' });
    }
  };
  
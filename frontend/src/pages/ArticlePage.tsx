import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {Article} from "shared";
import ScrollableLayout from "../layouts/ScrollableLayout";
import { useApi } from "../contexts/ApiContext";


export const ArticlePage: React.FC = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { slug } = useParams<{ slug: string }>();
  const { apiUrl } = useApi();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/articles/${slug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch article');
        }
        const data = await response.json();
        console.log(data);
        setArticle(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to fetch article");
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, apiUrl]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!article) return <div>Article not found</div>;

  return (
    <ScrollableLayout>
      <div className="container mx-auto px-4 py-8 dark:text-white">
        {article.cover && article.cover.type === 'external' && (
            <img 
                src={article.cover.external?.url} 
                alt="Article cover" 
                className="w-full h-64 object-cover mb-4 rounded"
            />
        )}
        <h1 className="text-4xl font-bold mb-4">{article.properties.Name}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">{article.properties.Description}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
        Published: {article.properties.Date}
        </p>
        <div className="prose dark:prose-invert max-w-none">
          {article.content ? <ReactMarkdown>{article.content!}</ReactMarkdown> : <p>... Wow... There's nothing here</p>}
        </div>
      </div>
    </ScrollableLayout>
  );
};
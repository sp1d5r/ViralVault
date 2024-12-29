import React, { useState, useEffect } from "react";
import ScrollableLayout from "../layouts/ScrollableLayout";
import {Article} from "shared";
import { useApi } from "../contexts/ApiContext";
import { Link } from "react-router-dom";

export interface ArticlesProps {}


export const Articles: React.FC<ArticlesProps> = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { apiUrl } = useApi();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/articles`);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }
        const data = await response.json();
        setArticles(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to fetch articles");
        setLoading(false);
      }
    };

    fetchArticles();
  }, [apiUrl]);

  return (
    <ScrollableLayout>
      <div className="container mx-auto px-4 py-8 dark:text-white">
        <h1 className="text-4xl font-bold mb-8">Articles</h1>
        {loading && <p>Loading articles...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="border rounded-lg overflow-hidden shadow-lg">
                {article.cover && article.cover.type === 'external' && (
                  <img 
                    src={article.cover.external?.url} 
                    alt="Article cover" 
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{article.properties.Name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{article.properties.Description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {article.properties.Tags && Array.isArray(article.properties.Tags) && article.properties.Tags.map((tag: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Published: {article.properties.Date}
                  </p>
                  <Link 
                    to={`/article/${article.properties.Slug}`}
                    className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollableLayout>
  );
};
import React, { useState, useEffect } from 'react';
import { Button } from "../../shadcn/button";
import { Textarea } from "../../shadcn/textarea";
import { Input } from "../../shadcn/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../shadcn/card";
import { Badge } from "../../shadcn/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../shadcn/tabs";
import { Loader2, Save, Edit, Eye, Settings, FileText, Sparkles, Users, Target } from 'lucide-react';
import { useApi } from '../../../contexts/ApiContext';
import { useToast } from '../../../contexts/ToastProvider';
import { useAuth } from '../../../contexts/AuthenticationProvider';

interface SystemPromptData {
    id: string;
    userId: string;
    name: string;
    description: string;
    category: 'app-context' | 'story-generation' | 'custom';
    content: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

interface EditablePrompt {
    name: string;
    description: string;
    content: string;
}

export const SystemPromptManager: React.FC = () => {
    const [prompts, setPrompts] = useState<SystemPromptData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<SystemPromptData | null>(null);
    const [editableContent, setEditableContent] = useState<EditablePrompt>({
        name: '',
        description: '',
        content: ''
    });
    const { fetchWithAuth } = useApi();
    const { toast } = useToast();
    const { authState } = useAuth();

    // Default system prompts
    const defaultPrompts = [
        {
            name: "ViralVault App Context",
            description: "Core information about what ViralVault is and how it works",
            category: 'app-context' as const,
            content: `# ViralVault System Context

## App Overview
ViralVault is an AI-powered content analytics and story generation platform designed for social media creators, influencers, and content marketers. It transforms raw social media data into compelling narratives and actionable insights.

**Target Audience:** Social media creators, influencers, content marketers, and businesses looking to optimize their social media presence and create data-driven content strategies.
**Core Value Proposition:** Turn your social media analytics into compelling stories that drive business growth and audience engagement.

## How It Works
ViralVault connects to your social media accounts, analyzes your content performance data, and uses AI to generate insights, recommendations, and compelling story-based presentations. The platform tracks metrics like views, engagement rates, audience retention, and growth patterns to help you understand what content resonates with your audience and why.

## Key Features
- Comprehensive social media analytics and performance tracking
- AI-powered content analysis and optimization recommendations
- Story slide generation from analytics data
- Post performance heatmaps and trend analysis
- Audience engagement insights and growth tracking
- Content strategy optimization based on data patterns
- Export capabilities for presentations and reports
- Real-time performance monitoring and alerts

## Key Benefits
- Data-driven content decisions based on real performance metrics
- Automated story generation for presentations and client pitches
- Comprehensive analytics that go beyond basic platform insights
- AI-powered recommendations for content optimization
- Professional presentation materials generated from your data
- Time-saving automation of repetitive analysis tasks

## Use Cases
- Content creators analyzing their best-performing posts
- Influencers creating pitch decks for brand collaborations
- Marketing teams presenting social media ROI to stakeholders
- Agencies creating performance reports for clients
- Businesses optimizing their social media strategy
- Personal brand building and audience growth analysis

## Technical Stack
- Frontend: React with TypeScript, Tailwind CSS, Framer Motion
- Backend: Node.js with Express, TypeScript
- Database: Firebase Firestore
- Authentication: Firebase Auth
- AI Integration: Claude API
- Deployment: Pulumi infrastructure as code
- Payment Processing: Stripe

## Business Model
Freemium SaaS model with tiered pricing based on features and usage limits. Premium plans include advanced analytics, unlimited story generation, and priority support.

## AI Assistant Guidelines
- Always consider the user's role as a content creator or marketer
- Focus on actionable insights and practical recommendations
- Use data to tell compelling stories rather than just presenting numbers
- Maintain a professional yet approachable tone
- Prioritize business value and growth opportunities
- Consider the broader context of social media marketing and content strategy`
        },
        {
            name: "Story Generation Instructions",
            description: "Specific guidance for generating compelling story slides",
            category: 'story-generation' as const,
            content: `# Story Slide Generation Instructions

You are an expert content strategist and data storyteller working with ViralVault. Your job is to transform social media analytics data into compelling, narrative-driven slides that tell a story.

## Your Approach
1. **Find the Story**: Look for patterns, trends, and interesting data points that can form a narrative
2. **Structure the Journey**: Create a beginning, middle, and end that takes the audience on a journey
3. **Make it Relatable**: Connect data to real business outcomes and human experiences
4. **Provide Context**: Explain why the data matters and what it means for the creator's business
5. **Include Action Items**: End with clear next steps and recommendations

## Slide Structure Guidelines
- **Title Slide**: Compelling headline that captures the main story
- **Context/Background**: Set the scene and explain what we're analyzing
- **The Journey**: 3-5 slides showing progression, challenges, and breakthroughs
- **Key Insights**: 2-3 slides highlighting the most important findings
- **Impact**: Show the business value and results achieved
- **Next Steps**: Actionable recommendations for continued growth

## Tone and Style
- Professional but not corporate
- Data-driven but human-centered
- Inspiring and motivational
- Clear and easy to understand
- Focused on business value and growth

## Data Presentation
- Use percentages and ratios to show relative performance
- Include before/after comparisons when possible
- Highlight trends and patterns over time
- Connect metrics to business outcomes
- Use visual language that can be translated into charts/graphs

Remember: You're not just presenting data - you're telling a story that will help creators grow their business and achieve their goals.`
        }
    ];

    useEffect(() => {
        // Debug: Check if user is authenticated
        console.log('SystemPromptManager - Auth State:', authState);
        console.log('SystemPromptManager - User:', authState?.user);
        
        if (authState?.user) {
            loadPrompts();
        } else {
            console.log('SystemPromptManager - No user authenticated');
            setLoading(false);
        }
    }, [authState]);

    const loadPrompts = async () => {
        try {
            console.log('SystemPromptManager - Loading prompts...');
            const response = await fetchWithAuth('api/system-prompts');
            console.log('SystemPromptManager - Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('SystemPromptManager - Prompts loaded:', data);
                
                if (data && data.length > 0) {
                    setPrompts(data);
                } else {
                    console.log('SystemPromptManager - No prompts found, creating defaults');
                    // If no prompts exist, create default ones
                    await createDefaultPrompts();
                }
            } else {
                console.log('SystemPromptManager - Response not ok, creating defaults');
                // If API fails, create default ones
                await createDefaultPrompts();
            }
        } catch (error) {
            console.error('SystemPromptManager - Error loading prompts:', error);
            // Create default prompts if API fails
            await createDefaultPrompts();
        } finally {
            setLoading(false);
        }
    };

    const createDefaultPrompts = async () => {
        console.log('SystemPromptManager - Creating default prompts...');
        
        try {
            // Create each default prompt via API
            const createdPrompts: SystemPromptData[] = [];
            
            for (const prompt of defaultPrompts) {
                const response = await fetchWithAuth('api/system-prompts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: prompt.name,
                        description: prompt.description,
                        category: prompt.category,
                        content: prompt.content
                    })
                });
                
                if (response.ok) {
                    const createdPrompt = await response.json();
                    createdPrompts.push(createdPrompt);
                    console.log('SystemPromptManager - Created prompt:', createdPrompt.name);
                } else {
                    console.error('SystemPromptManager - Failed to create prompt:', prompt.name);
                }
            }
            
            setPrompts(createdPrompts);
            console.log('SystemPromptManager - Default prompts created:', createdPrompts.length);
            
        } catch (error) {
            console.error('SystemPromptManager - Error creating default prompts:', error);
            // Fallback to local prompts if API fails
            const localPrompts: SystemPromptData[] = defaultPrompts.map((prompt, index) => ({
                id: `default-${index}`,
                userId: 'default',
                name: prompt.name,
                description: prompt.description,
                category: prompt.category,
                content: prompt.content,
                isActive: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }));
            setPrompts(localPrompts);
        }
    };

    const startEditing = (prompt: SystemPromptData) => {
        setEditingPrompt(prompt);
        setEditableContent({
            name: prompt.name,
            description: prompt.description,
            content: prompt.content
        });
    };

    const cancelEditing = () => {
        setEditingPrompt(null);
        setEditableContent({ name: '', description: '', content: '' });
    };

    const savePrompt = async () => {
        if (!editingPrompt) return;

        setSaving(true);
        try {
            const response = await fetchWithAuth('api/system-prompts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPrompt.id,
                    name: editableContent.name,
                    description: editableContent.description,
                    content: editableContent.content
                })
            });

            if (response.ok) {
                const updatedPrompt = await response.json();
                setPrompts(prev => prev.map(p => 
                    p.id === editingPrompt.id ? updatedPrompt : p
                ));
                toast({
                    title: "Prompt Updated",
                    description: "System prompt has been saved successfully.",
                });
                cancelEditing();
            } else {
                throw new Error('Failed to save prompt');
            }
        } catch (error) {
            console.error('Error saving prompt:', error);
            toast({
                title: "Error",
                description: "Failed to save system prompt. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const togglePromptActive = async (promptId: string, isActive: boolean) => {
        try {
            const response = await fetchWithAuth('api/system-prompts/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptId, isActive })
            });

            if (response.ok) {
                setPrompts(prev => prev.map(p => 
                    p.id === promptId ? { ...p, isActive } : p
                ));
                toast({
                    title: "Prompt Updated",
                    description: `Prompt ${isActive ? 'activated' : 'deactivated'} successfully.`,
                });
            }
        } catch (error) {
            console.error('Error toggling prompt:', error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'app-context':
                return <Settings className="h-4 w-4" />;
            case 'story-generation':
                return <Sparkles className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'app-context':
                return 'bg-blue-500/20 text-blue-300';
            case 'story-generation':
                return 'bg-purple-500/20 text-purple-300';
            default:
                return 'bg-gray-500/20 text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-white">Loading system prompts...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-4xl font-semibold text-white mb-2">System Prompts</h2>
                <p className="text-neutral-400">Manage the AI context and instructions used throughout ViralVault</p>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-neutral-800/50">
                    <TabsTrigger value="all">All Prompts</TabsTrigger>
                    <TabsTrigger value="app-context">App Context</TabsTrigger>
                    <TabsTrigger value="story-generation">Story Generation</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {prompts.map((prompt) => (
                        <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            onEdit={startEditing}
                            onToggleActive={togglePromptActive}
                            isEditing={editingPrompt?.id === prompt.id}
                            editableContent={editableContent}
                            onContentChange={setEditableContent}
                            onSave={savePrompt}
                            onCancel={cancelEditing}
                            saving={saving}
                            getCategoryIcon={getCategoryIcon}
                            getCategoryColor={getCategoryColor}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="app-context" className="space-y-4">
                    {prompts.filter(p => p.category === 'app-context').map((prompt) => (
                        <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            onEdit={startEditing}
                            onToggleActive={togglePromptActive}
                            isEditing={editingPrompt?.id === prompt.id}
                            editableContent={editableContent}
                            onContentChange={setEditableContent}
                            onSave={savePrompt}
                            onCancel={cancelEditing}
                            saving={saving}
                            getCategoryIcon={getCategoryIcon}
                            getCategoryColor={getCategoryColor}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="story-generation" className="space-y-4">
                    {prompts.filter(p => p.category === 'story-generation').map((prompt) => (
                        <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            onEdit={startEditing}
                            onToggleActive={togglePromptActive}
                            isEditing={editingPrompt?.id === prompt.id}
                            editableContent={editableContent}
                            onContentChange={setEditableContent}
                            onSave={savePrompt}
                            onCancel={cancelEditing}
                            saving={saving}
                            getCategoryIcon={getCategoryIcon}
                            getCategoryColor={getCategoryColor}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                    {prompts.filter(p => p.category === 'custom').map((prompt) => (
                        <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            onEdit={startEditing}
                            onToggleActive={togglePromptActive}
                            isEditing={editingPrompt?.id === prompt.id}
                            editableContent={editableContent}
                            onContentChange={setEditableContent}
                            onSave={savePrompt}
                            onCancel={cancelEditing}
                            saving={saving}
                            getCategoryIcon={getCategoryIcon}
                            getCategoryColor={getCategoryColor}
                        />
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
};

interface PromptCardProps {
    prompt: SystemPromptData;
    onEdit: (prompt: SystemPromptData) => void;
    onToggleActive: (promptId: string, isActive: boolean) => void;
    isEditing: boolean;
    editableContent: EditablePrompt;
    onContentChange: (content: EditablePrompt) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    getCategoryIcon: (category: string) => React.ReactNode;
    getCategoryColor: (category: string) => string;
}

const PromptCard: React.FC<PromptCardProps> = ({
    prompt,
    onEdit,
    onToggleActive,
    isEditing,
    editableContent,
    onContentChange,
    onSave,
    onCancel,
    saving,
    getCategoryIcon,
    getCategoryColor
}) => {
    return (
        <Card className="bg-neutral-900/50 border-neutral-700">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-neutral-800/50 rounded-lg">
                                {getCategoryIcon(prompt.category)}
                            </div>
                            <div className="flex-1">
                                {isEditing ? (
                                    <Input
                                        value={editableContent.name}
                                        onChange={(e) => onContentChange({ ...editableContent, name: e.target.value })}
                                        className="bg-neutral-800/50 border-neutral-600 text-white"
                                        placeholder="Prompt name"
                                    />
                                ) : (
                                    <CardTitle className="text-white text-lg">{prompt.name}</CardTitle>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={getCategoryColor(prompt.category)}>
                                        {prompt.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Badge>
                                    <Badge variant={prompt.isActive ? "default" : "secondary"}>
                                        {prompt.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        {isEditing ? (
                            <Input
                                value={editableContent.description}
                                onChange={(e) => onContentChange({ ...editableContent, description: e.target.value })}
                                className="bg-neutral-800/50 border-neutral-600 text-white mt-2"
                                placeholder="Prompt description"
                            />
                        ) : (
                            <p className="text-neutral-300 text-sm">{prompt.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(prompt)}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onToggleActive(prompt.id, !prompt.isActive)}
                                >
                                    {prompt.isActive ? "Deactivate" : "Activate"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-4">
                        <Textarea
                            value={editableContent.content}
                            onChange={(e) => onContentChange({ ...editableContent, content: e.target.value })}
                            className="bg-neutral-800/50 border-neutral-600 text-white min-h-[300px] font-mono text-sm"
                            placeholder="Enter your system prompt content..."
                        />
                        <div className="flex items-center gap-2">
                            <Button onClick={onSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="bg-neutral-800/30 rounded-lg p-3">
                            <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono">
                                {prompt.content}
                            </pre>
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>Last updated: {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                            <span>{prompt.content.length} characters</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 
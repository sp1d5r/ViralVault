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
            name: "Nadeen App Context",
            description: "Core information about Nadeen meditation app and emotional marketing approach",
            category: 'app-context' as const,
            content: `# Nadeen System Context

## App Overview
Nadeen is a personalized iPhone meditation app designed to help people cope with real emotional stress. It provides short, daily meditations that are emotionally on point and tailored to individual needs.

**Target Audience:** People experiencing emotional challenges like anxiety, burnout, heartbreak, exam stress, work pressure, relationship issues, and general life overwhelm.
**Core Value Proposition:** Emotional support that gets you — short, daily meditations that actually understand what you're going through.

## How It Works
Nadeen offers personalized meditation experiences that address specific emotional states and life situations. Users can access short, focused meditation sessions designed to help them navigate difficult emotions and find moments of calm and clarity.

## Key Features
- Personalized meditation recommendations based on emotional state
- Short, focused meditation sessions (5-15 minutes)
- Emotionally intelligent content that addresses real pain points
- Daily meditation practice with progress tracking
- Variety of meditation styles and approaches
- Calming, authentic visual and audio experiences

## Key Benefits
- Immediate emotional relief and stress reduction
- Building sustainable meditation habits through short sessions
- Feeling understood and supported during difficult times
- Developing emotional resilience and coping skills
- Finding moments of peace in busy, stressful lives
- Personalized approach that grows with the user

## Use Cases
- People dealing with work-related stress and burnout
- Students facing exam anxiety and academic pressure
- Individuals navigating relationship challenges and heartbreak
- Anyone experiencing general anxiety or overwhelm
- People seeking to build meditation habits
- Those looking for emotional support and self-care tools

## Brand Voice & Approach
- Vulnerable but strong — we acknowledge emotional pain without pity
- Natural and conversational — authentic, not overly polished
- Emotionally intelligent — we understand the nuances of human experience
- Hopeful but realistic — we don't promise miracles, just meaningful progress
- Inclusive and relatable — our content speaks to real people in real situations

## AI Assistant Guidelines
- Always focus on emotional authenticity and human experience
- Create content that feels genuine and relatable
- Avoid clichés and overly positive messaging
- Acknowledge real pain while offering genuine hope
- Focus on small, meaningful shifts rather than dramatic transformations
- Consider the emotional journey and psychological impact of content`
        },
        {
            name: "Story Generation Instructions",
            description: "Specific guidance for generating compelling story slides",
            category: 'story-generation' as const,
            content: `# Nadeen Story Slide Generation Instructions

You are an expert emotional marketer and story-based ad strategist working on Nadeen — a personalized iPhone meditation app designed to help people cope with real emotional stress.

## Your Approach
1. **Start with the Emotion**: Identify a specific emotional challenge (e.g., anxiety, burnout, heartbreak, exam stress) the user might be facing.
2. **Set the Scene**: Craft a relatable moment or pain point from everyday life. Make it real, even uncomfortable.
3. **Introduce the Turning Point**: Show the shift — the moment they seek help, pause, or realize they need change.
4. **Present Nadeen**: Introduce the app as the emotional support they didn't know they needed. Focus on the fact that it gets them — short, daily meditations, emotionally on point.
5. **End with Hope**: Finish with a sense of calm, progress, or transformation. Don't overpromise. Just make it feel like "this could actually help."

## Slide Tone & Style
- Vulnerable but strong — we acknowledge emotional pain without pity
- Natural and conversational — each slide can be a full thought or sentence (not limited to 5–8 words)
- Native to TikTok/IG Stories — vertical, swipable, each slide should have emotional tension or resolution
- Visually grounded — background should feel cinematic or authentic, not overly polished
- Bold, large captions — readable, emotionally clear, and designed for TikTok-native storytelling

## Output Structure
Return slides in this format:

Slide 1:
Main Text: [Opening emotional tension]
Caption: [Expanded version — 1–2 sentences for deeper emotional context]

Slide 2:
Main Text: [More tension / relatable moment]
Caption: [Deeper context, something visual or memorable]

Slide 3:
Main Text: [Turning point or shift]
Caption: [Action they took or moment of self-awareness]

Slide 4:
Main Text: [Nadeen enters — short value prop]
Caption: [Why Nadeen felt different / how it helped emotionally]

Slide 5:
Main Text: [Emotional payoff or hope]
Caption: [Grounded progress — not perfect, but meaningful]

Slide 6:
Main Text: [CTA — "Start with 1 free meditation"]
Caption: [Warm, honest invitation to try it — no pressure]

Make sure the full story is emotionally fair and believable — no instant miracles, just a small but real shift. Avoid clichés. Focus on internal emotional truth.`
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
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-semibold text-white mb-2">System Prompts</h2>
                        <p className="text-neutral-400">Manage your AI system prompts for content generation</p>
                    </div>
                </div>

                <Tabs defaultValue="app-context" className="space-y-4">
                    <TabsList className="bg-neutral-800/50 border border-neutral-700">
                        <TabsTrigger value="app-context" className="text-neutral-300 data-[state=active]:text-white">App Context</TabsTrigger>
                        <TabsTrigger value="story-generation" className="text-neutral-300 data-[state=active]:text-white">Story Generation</TabsTrigger>
                        <TabsTrigger value="custom" className="text-neutral-300 data-[state=active]:text-white">Custom</TabsTrigger>
                    </TabsList>

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
                            <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
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
                            <Button variant="outline" size="sm" onClick={onCancel}>
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
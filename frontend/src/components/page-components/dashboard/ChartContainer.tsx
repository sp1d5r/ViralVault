import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Save } from 'lucide-react';
import { Button } from '../../shadcn/button';
import { Input } from '../../shadcn/input';
import { Label } from '../../shadcn/label';
import {
    ChartContainer,
    ChartTooltip,
} from '../../shadcn/chart';
import {
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';

interface DataPoint {
    x: number;
    y: number;
}

interface GraphContainerProps {
    title: string;
    xAxisTitle: string;
    yAxisTitle: string;
    borderColor?: string;
    data?: DataPoint[];
    xAxisType: 'hours' | 'seconds';
    maxXValue?: number;
    maxYValue?: number;
    onSubmit?: (newData: DataPoint[]) => void;
    interpolate?: boolean;
}

export const GraphContainer: React.FC<GraphContainerProps> = ({
    title,
    xAxisTitle,
    yAxisTitle,
    borderColor = 'border-indigo-500',
    data,
    xAxisType,
    maxXValue,
    maxYValue,
    onSubmit,
    interpolate = false,
}) => {

    // All hooks must be at the top level
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState<DataPoint[]>(data || []);
    const [showData, setShowData] = useState(!!data?.length);
    const [customMaxX, setCustomMaxX] = useState<number>(maxXValue || (xAxisType === 'hours' ? 24 : 0));
    const [isSettingMaxX, setIsSettingMaxX] = useState(!maxXValue && xAxisType === 'seconds');
    const [isDragging, setIsDragging] = useState(false);
    const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    // Prevent text selection during editing
    useEffect(() => {
        if (isEditing) {
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = '';
        }
        
        return () => {
            document.body.style.userSelect = '';
        };
    }, [isEditing]);

    // Handle mouse up for drag end
    useEffect(() => {
        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                setActivePointIndex(null);
            }
        };

        if (isDragging) {
            document.addEventListener('mouseup', handleMouseUp);
            return () => document.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isDragging]);

    const handleChartMouseMove = (e: any) => {
        if (!isDragging || activePointIndex === null || !e?.chartY) {
            return;
        }

        // Get the actual chart height from the ref
        const chartHeight = chartRef.current?.clientHeight || 250;
        const valueRange = maxYValue || 100;
        
        // Account for chart padding (approximately 5px top and 5px bottom = 10px total)
        const effectiveChartHeight = chartHeight - 50;
        // Adjust mouse position relative to the padding (5px from top)
        const adjustedChartY = e.chartY - 5;
        
        // Adjust the calculation to use the effective height
        const newY = Math.max(0, Math.min(valueRange, 
            valueRange * (1 - (adjustedChartY / effectiveChartHeight))
        ));

        setEditableData(prev => {
            const currentY = prev[activePointIndex].y;
            const newValue = Number(newY.toFixed(1));
            
            if (Math.abs(currentY - newValue) > 0.01) {
                const newData = [...prev];
                newData[activePointIndex] = {
                    ...newData[activePointIndex],
                    y: newValue
                };
                return newData;
            }
            return prev;
        });
    };

    // Generate initial data points
    const initializeData = () => {
        if (xAxisType === 'seconds' && !customMaxX) {
            setIsSettingMaxX(true);
            return;
        }

        const newData: DataPoint[] = [];
        const steps = xAxisType === 'hours' ? 24 : customMaxX;
        
        for (let i = 0; i <= steps; i++) {
            newData.push({ x: i, y: 0 });
        }
        
        setEditableData(newData);
        setShowData(true);
        setIsEditing(true);
    };

    const interpolatePoints = (data: DataPoint[]): DataPoint[] => {
        const result = [...data];
        
        // Find segments between non-zero points and interpolate
        let lastNonZeroIndex = 0;
        let lastNonZeroValue = result[0].y;

        for (let i = 1; i < result.length; i++) {
            if (result[i].y !== 0) {
                // Found next non-zero point, interpolate between lastNonZero and here
                const startValue = lastNonZeroValue;
                const endValue = result[i].y;
                const gap = i - lastNonZeroIndex;
                
                // Fill in all points between last non-zero and current
                for (let j = 1; j < gap; j++) {
                    const fraction = j / gap;
                    result[lastNonZeroIndex + j].y = Number(
                        (startValue + (endValue - startValue) * fraction).toFixed(1)
                    );
                }
                
                lastNonZeroIndex = i;
                lastNonZeroValue = endValue;
            }
        }

        // Handle trailing zeros if they exist
        if (lastNonZeroIndex < result.length - 1) {
            const gap = result.length - lastNonZeroIndex;
            const startValue = lastNonZeroValue;
            
            // Fill in remaining points, going down to zero
            for (let i = 1; i < gap; i++) {
                const fraction = i / gap;
                result[lastNonZeroIndex + i].y = Number(
                    (startValue * (1 - fraction)).toFixed(1)
                );
            }
        }

        return result;
    };

    const handleSubmit = () => {
        // Apply interpolation before submitting if enabled
        const finalData = interpolate ? interpolatePoints(editableData) : editableData;
        onSubmit?.(finalData);
        setIsEditing(false);
    };

    // Setting max X value for video duration
    if (isSettingMaxX) {
        return (
            <div className={`border ${borderColor} rounded-lg p-4 h-[300px]`}>
                <div className="h-full flex flex-col items-center justify-center gap-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <div className="w-full md:w-64 space-y-2">
                        <Label>Video Duration (seconds)</Label>
                        <Input
                            type="number"
                            min="1"
                            value={customMaxX}
                            onChange={(e) => setCustomMaxX(parseInt(e.target.value) || 0)}
                        />
                        <Button
                            onClick={() => {
                                setIsSettingMaxX(false);
                                initializeData();
                            }}
                            disabled={!customMaxX}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Empty State
    if (!showData) {
        return (
            <div className={`border ${borderColor} rounded-lg p-4 h-[300px]`}>
                <div className="h-full flex flex-col items-center justify-center gap-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Button
                        variant="outline"
                        onClick={initializeData}
                        className="flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Data
                    </Button>
                </div>
            </div>
        );
    }

    // View/Edit Mode
    return (
        <div className={`border ${borderColor} rounded-lg p-4`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <div className="flex gap-2">
                    {isEditing && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleSubmit}
                        >
                            <Save size={16} className="mr-2" />
                            Submit
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        <Edit size={16} />
                    </Button>
                </div>
            </div>

            <div className="h-[250px] w-[calc(100%+8px)] -mx-4 md:w-full md:mx-0" ref={chartRef}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                        data={editableData}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={() => {
                            setIsDragging(false);
                            setActivePointIndex(null);
                        }}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="x"
                            label={{ value: xAxisTitle, position: 'bottom' }}
                            type="number"
                            domain={[0, customMaxX]}
                        />
                        <YAxis
                            label={{ 
                                value: yAxisTitle, 
                                angle: -90, 
                                position: 'left' 
                            }}
                            domain={[0, maxYValue || 100]}
                        />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (active && payload?.length) {
                                    return (
                                        <div className="bg-background border rounded-lg p-2">
                                            <p>{`${xAxisTitle}: ${payload[0].payload.x}`}</p>
                                            <p>{`${yAxisTitle}: ${payload[0].payload.y}`}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="y"
                            stroke="white"
                            dot={isEditing ? {
                                r: 4,
                                cursor: isDragging ? 'grabbing' : 'grab',
                                onMouseDown: (e: any, payload: any) => {
                                    // console.log('Dot mouse down raw:', {
                                    //     e,
                                    //     payload,
                                    //     value: payload?.value,
                                    //     dataIndex: payload?.payload?.index
                                    // });
                                    
                                    // The index is in payload.payload.index
                                    const index = payload?.payload?.index;
                                    
                                    // console.log('Dot mouse down processed:', {
                                    //     index,
                                    //     allData: editableData,
                                    //     currentPoint: editableData[index]
                                    // });
                                    
                                    if (typeof index === 'number') {
                                        setIsDragging(true);
                                        setActivePointIndex(index);
                                    }
                                }
                            } : false}
                            activeDot={isEditing ? {
                                r: 6,
                                cursor: isDragging ? 'grabbing' : 'grab',
                                onMouseDown: (e: any, payload: any) => {
                                    // For activeDot, the index is in payload.index
                                    // console.log('ActiveDot mouse down:', {
                                    //     payload,
                                    //     index: payload?.index
                                    // });
                                    
                                    if (typeof payload?.index === 'number') {
                                        setIsDragging(true);
                                        setActivePointIndex(payload.index);
                                    }
                                }
                            } : { r: 4 }}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
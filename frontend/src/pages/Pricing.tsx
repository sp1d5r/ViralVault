import React from "react";
import ScrollableLayout from "../layouts/ScrollableLayout";
import { Sparkle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/shadcn/card";
import { Button } from "../components/shadcn/button";
import { Slider } from "../components/shadcn/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/shadcn/table";

export interface PricingProps {}

export const Pricing: React.FC<PricingProps> = () => {
    return (
        <ScrollableLayout>
            <div className="container mx-auto px-4 py-8 dark:text-white">
                <div className="text-left my-8">
                    <h1 className="text-2xl md:text-5xl font-bold flex items-center justify-start gap-2 mb-2">
                        <Sparkle />
                        We've got a pricing plan
                    </h1>
                    <h2 className="text-2xl md:text-5xl font-bold mb-4">that's perfect for you</h2>
                    <p className="md:text-xl text-gray-600">
                        We believe Untitled should be accessible to all companies, no matter the size.
                    </p>
                </div>

                <div className="mb-8">
                    <Slider defaultValue={[10]} max={100} step={1} className="w-full" />
                    <p className="text-center mt-2">10 users</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Feature</TableHead>
                            {["Basic", "Business", "Enterprise"].map((plan, index) => (
                                <TableHead>
                                    <Card key={plan} className="my-2">
                                        <CardHeader>
                                            <CardTitle>{plan} plan</CardTitle>
                                            <CardDescription>{index === 0 ? "Our most popular plan." : index === 1 ? "Best for growing teams." : "Best for large teams."}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-4xl font-bold">${10 * Math.pow(2, index)}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full">Get started</Button>
                                        </CardFooter>
                                    </Card>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[
                            { name: "Basic features", basic: true, business: true, enterprise: true },
                            { name: "Users", basic: "10", business: "20", enterprise: "Unlimited" },
                            { name: "Individual data", basic: "20GB", business: "40GB", enterprise: "Unlimited" },
                            { name: "Support", basic: true, business: true, enterprise: true },
                            { name: "Automated workflows", basic: false, business: true, enterprise: true },
                            { name: "200+ integrations", basic: false, business: true, enterprise: true },
                        ].map((feature) => (
                            <TableRow key={feature.name}>
                                <TableCell>{feature.name}</TableCell>
                                <TableCell>{renderFeatureValue(feature.basic)}</TableCell>
                                <TableCell>{renderFeatureValue(feature.business)}</TableCell>
                                <TableCell>{renderFeatureValue(feature.enterprise)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </ScrollableLayout>
    );
};

const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
        return value ? "✓" : "—";
    }
    return value;
};
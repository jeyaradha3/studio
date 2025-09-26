"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { ChartConfig } from "@/components/ui/chart";

import {
  Landmark,
  Percent,
  CalendarClock,
  Combine,
  TrendingUp,
  Sparkles,
  RotateCcw,
  Calculator,
} from "lucide-react";

import { getInvestmentSuggestions } from "@/ai/flows/investment-suggestions";

const formSchema = z.object({
  principal: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .min(1, "Principal must be greater than 0."),
  rate: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .min(0.1, "Rate must be greater than 0.")
    .max(100, "Rate cannot exceed 100%."),
  years: z.coerce
    .number({ invalid_type_error: "Please enter a valid integer." })
    .int("Please enter a whole number for years.")
    .min(1, "Period must be at least 1 year."),
  compounding: z.string(),
  riskProfile: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
});

type FormValues = z.infer<typeof formSchema>;

interface CalculationResult {
  principal: number;
  maturityAmount: number;
  interestEarned: number;
}

const compoundingOptions = [
  { label: "Annually", value: "1" },
  { label: "Semi-Annually", value: "2" },
  { label: "Quarterly", value: "4" },
  { label: "Monthly", value: "12" },
];

const chartConfig = {
  principal: {
    label: "Principal",
    color: "green",
  },
  interest: {
    label: "Interest",
    color: "red",
  },
} satisfies ChartConfig;

const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    })}`;
}

export default function Home() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 100000,
      rate: 6.5,
      years: 5,
      compounding: "4",
      riskProfile: "moderate",
    },
  });

  const onSubmit = (values: FormValues) => {
    setIsCalculating(true);
    setAiSuggestion(null);

    setTimeout(() => {
      const P = values.principal;
      const r = values.rate / 100;
      const n = Number(values.compounding);
      const t = values.years;
      const maturityAmount = P * Math.pow(1 + r / n, n * t);
      const interestEarned = maturityAmount - P;

      setResult({
        principal: P,
        maturityAmount,
        interestEarned,
      });
      setIsCalculating(false);
    }, 500); // Simulate calculation delay
  };

  const handleClear = () => {
    form.reset();
    setResult(null);
    setAiSuggestion(null);
  };
  
  const handleGetSuggestions = async () => {
    if (!result) return;
    setIsFetchingSuggestions(true);

    try {
      const input = {
        fdAmount: result.principal,
        interestRate: form.getValues("rate"),
        period: form.getValues("years"),
        maturityAmount: result.maturityAmount,
        interestEarned: result.interestEarned,
        riskProfile: form.getValues("riskProfile"),
      };
      const response = await getInvestmentSuggestions(input);
      setAiSuggestion(response.suggestions);
    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch investment suggestions. Please try again.",
      });
    } finally {
      setIsFetchingSuggestions(false);
    }
  };
  
  const chartData = result
    ? [
        { name: "Principal", value: result.principal, fill: "var(--color-principal)" },
        { name: "Interest", value: result.interestEarned, fill: "var(--color-interest)" },
      ]
    : [];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="text-primary" />
              FD Calculator
            </CardTitle>
            <CardDescription>
              Enter your Fixed Deposit details to calculate maturity amount and interest.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Landmark size={16}/> Principal Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 100000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Percent size={16}/> Annual Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 6.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CalendarClock size={16}/> Period (Years)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compounding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Combine size={16}/> Compounding Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select compounding frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {compoundingOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between gap-4">
                <Button type="button" variant="outline" onClick={handleClear} className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button type="submit" disabled={isCalculating} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {isCalculating ? "Calculating..." : "Calculate"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <div className="space-y-8">
          {result && (
            <div className="animate-in fade-in-50 duration-500">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <TrendingUp className="text-primary"/>
                    Calculation Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Principal Amount</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(result.principal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Interest</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(result.interestEarned)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Maturity Amount</p>
                      <p className="text-3xl font-bold text-accent-foreground">
                        {formatCurrency(result.maturityAmount)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <RechartsTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            strokeWidth={2}
                            paddingAngle={5}
                          >
                           {chartData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                     <div className="flex justify-center gap-4 text-sm mt-2">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--color-principal)'}}></span>Principal</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--color-interest)'}}></span>Interest</div>
                    </div>
                  </div>
                </CardContent>
                 <CardFooter>
                  <Button onClick={handleGetSuggestions} disabled={isFetchingSuggestions} className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isFetchingSuggestions ? "Getting Insights..." : "Get AI Investment Insights"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {(isFetchingSuggestions || aiSuggestion) && (
             <div className="animate-in fade-in-50 duration-500">
               <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="text-primary"/>
                        AI-Powered Investment Insights
                    </CardTitle>
                    <CardDescription>Based on your returns and risk profile.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetchingSuggestions ? (
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : (
                      <div className="text-sm text-foreground whitespace-pre-wrap">{aiSuggestion}</div>
                    )}
                </CardContent>
               </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

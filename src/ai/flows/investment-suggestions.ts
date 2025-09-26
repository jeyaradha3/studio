'use server';

/**
 * @fileOverview Provides AI-powered investment suggestions based on FD returns and market trends.
 *
 * - getInvestmentSuggestions - A function to generate investment suggestions.
 * - InvestmentSuggestionsInput - The input type for the getInvestmentSuggestions function.
 * - InvestmentSuggestionsOutput - The return type for the getInvestmentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentSuggestionsInputSchema = z.object({
  fdAmount: z.number().describe('The fixed deposit amount.'),
  interestRate: z.number().describe('The interest rate of the fixed deposit.'),
  period: z.number().describe('The period of the fixed deposit in years.'),
  maturityAmount: z.number().describe('The calculated maturity amount of the fixed deposit.'),
  interestEarned: z.number().describe('The total interest earned from the fixed deposit.'),
  riskProfile: z
    .string()
    .optional()
    .describe(
      'The risk profile of the user, e.g., conservative, moderate, aggressive. If not provided, assume moderate.'
    ),
});
export type InvestmentSuggestionsInput = z.infer<
  typeof InvestmentSuggestionsInputSchema
>;

const InvestmentSuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe(
      'A list of investment suggestions based on the FD returns, current market trends, and the user risk profile.'
    ),
});
export type InvestmentSuggestionsOutput = z.infer<
  typeof InvestmentSuggestionsOutputSchema
>;

export async function getInvestmentSuggestions(
  input: InvestmentSuggestionsInput
): Promise<InvestmentSuggestionsOutput> {
  return investmentSuggestionsFlow(input);
}

const getMarketTrend = ai.defineTool({
  name: 'getMarketTrend',
  description:
    'Returns the current market trends and analysis for the investment market.',
  inputSchema: z.object({
    market: z.string().describe('The investment market type, e.g., stock, bond, etc.'),
  }),
  outputSchema: z.string(),
},
async (input) => {
    // Dummy data for demonstration purposes
    console.log('Getting market trend for ' + input.market);
    if (input.market === 'stock') {
      return 'The stock market is currently experiencing high volatility due to recent economic data releases.';
    } else if (input.market === 'bond') {
      return 'Bond yields are currently low due to the central bank policy.';
    } else {
      return 'Real estate market is stable with moderate growth.';
    }
  }
);

const prompt = ai.definePrompt({
  name: 'investmentSuggestionsPrompt',
  tools: [getMarketTrend],
  input: {schema: InvestmentSuggestionsInputSchema},
  output: {schema: InvestmentSuggestionsOutputSchema},
  prompt: `You are an experienced financial advisor providing investment suggestions.

  Based on the user's fixed deposit details and their risk profile, suggest potentially more lucrative investment opportunities.
  Consider current market trends to provide relevant and timely advice.

  Fixed Deposit Amount: {{fdAmount}}
  Interest Rate: {{interestRate}}
  Period: {{period}} years
  Maturity Amount: {{maturityAmount}}
  Interest Earned: {{interestEarned}}
  Risk Profile: {{riskProfile}}

  Include analysis of stock, bond and real estate market and suggest opportunities where user can invest.
  If the user has a conservative risk profile, suggest low-risk investments. If the user has an aggressive risk profile, suggest high-risk, high-reward investments.

  Use the getMarketTrend tool to get the current market trends for different investment markets.
  `,
});

const investmentSuggestionsFlow = ai.defineFlow(
  {
    name: 'investmentSuggestionsFlow',
    inputSchema: InvestmentSuggestionsInputSchema,
    outputSchema: InvestmentSuggestionsOutputSchema,
  },
  async input => {
    // Set default risk profile to moderate if not provided
    const riskProfile = input.riskProfile || 'moderate';

    const enrichedInput = {
      ...input,
      riskProfile,
    };

    const {output} = await prompt(enrichedInput);
    return output!;
  }
);

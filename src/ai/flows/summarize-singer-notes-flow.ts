'use server';
/**
 * @fileOverview A Genkit flow for summarizing singer notes.
 *
 * - summarizeSingerNotes - A function that handles the summarization of singer notes.
 * - SummarizeSingerNotesInput - The input type for the summarizeSingerNotes function.
 * - SummarizeSingerNotesOutput - The return type for the summarizeSingerNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSingerNotesInputSchema = z.object({
  notes: z.string().describe('The detailed notes provided by the singer.'),
});
export type SummarizeSingerNotesInput = z.infer<typeof SummarizeSingerNotesInputSchema>;

const SummarizeSingerNotesOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the singer\'s notes.'),
});
export type SummarizeSingerNotesOutput = z.infer<typeof SummarizeSingerNotesOutputSchema>;

export async function summarizeSingerNotes(input: SummarizeSingerNotesInput): Promise<SummarizeSingerNotesOutput> {
  return summarizeSingerNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSingerNotesPrompt',
  input: {schema: SummarizeSingerNotesInputSchema},
  output: {schema: SummarizeSingerNotesOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing special requests or instructions from karaoke singers.

Read the following notes and provide a concise summary, highlighting any key adjustments, tempo changes, special performance requests, or contact information relevant to the host.

Notes: {{{notes}}}`,
});

const summarizeSingerNotesFlow = ai.defineFlow(
  {
    name: 'summarizeSingerNotesFlow',
    inputSchema: SummarizeSingerNotesInputSchema,
    outputSchema: SummarizeSingerNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const gymReviews = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gym-reviews' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    summary: z.string().optional(),
  }),
});

export const collections = { 'gym-reviews': gymReviews };

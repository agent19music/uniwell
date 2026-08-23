import { z } from 'zod';

export const journalDraftSchema = z.object({
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(1, 'Write something before saving'),
});

export type JournalDraft = z.infer<typeof journalDraftSchema>;

export type LessonJournalBlock = {
  id: string;
  kind: "note" | "snippet";
  text: string;
  screenId?: string | null;
  createdAt: Date;
};

export type LessonJournalEntry = {
  id: string;
  userId: string;
  profileId: string;
  sourceType: "omniKuno_lesson";
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
  blocks: LessonJournalBlock[];
  createdAt: Date;
  updatedAt: Date;
};

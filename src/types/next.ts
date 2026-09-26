// Utility type for page searchParams prop (Next.js 16 — async searchParams)
export type SearchParamProps<T extends string = string> = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined> & Partial<Record<T, string | string[] | undefined>>
  >;
};

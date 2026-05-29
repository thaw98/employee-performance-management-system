/** Display appraisal rating enums (e.g. NEEDS_IMPROVEMENT) as readable labels. */
export function formatRatingCategory(category: string | null | undefined): string {
  if (!category) return 'N/A';
  return category.replace(/_/g, ' ');
}

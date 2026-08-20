/** Generates stable "Entity A", "Entity B", … labels for entities a restricted-pillar
 * viewer isn't allowed to see the real name or figures of. Order follows the input
 * array, not alphabetical, so the same entity gets the same letter across renders. */
export function anonymizedEntityLabel(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26));
  return `Entity ${letter}`;
}

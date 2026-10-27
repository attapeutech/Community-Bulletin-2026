export type StoreOption = { id: string; label: string };

/** Store picker labels: "Fast Eddies #FE-001" */
export function storeOptions(rows: { id: string; storeName: string; storeNumber: string | null }[]): StoreOption[] {
  return rows.map(r => ({ id: r.id, label: r.storeNumber ? `${r.storeName} #${r.storeNumber.replace(/^#/, "")}` : r.storeName }));
}

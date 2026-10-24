export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

export function effectiveStatus<T extends { status: string; season_closed?: number }>(row: T) {
  const { season_closed, ...rest } = row;
  return { ...rest, status: season_closed ? "fechada" : row.status };
}

export const SEASON_CLOSED_SQL = `EXISTS (SELECT 1 FROM seasons s WHERE s.deleted_at IS NULL AND s.kind = 'fechada'
  AND (s.attraction_id IS NULL OR s.attraction_id = a.id) AND date('now') BETWEEN s.start_date AND s.end_date)`;

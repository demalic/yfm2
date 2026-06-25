import type { PostgrestError } from '@supabase/supabase-js';
import {
  loadDevDatabase,
  saveDevDatabase,
  type DevDatabase,
} from './devStore';
import type { Member, Lead, ImportBatch, FCCLocation } from '../types';

type TableName = keyof DevDatabase;
type Row = Member | Lead | ImportBatch | FCCLocation | { key: string; value: unknown; updated_at: string };

function pgError(code: string, message: string): PostgrestError {
  return { code, message, details: '', hint: '', name: 'PostgrestError' };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

type Filter =
  | { type: 'eq'; col: string; val: unknown }
  | { type: 'ilike'; col: string; val: string }
  | { type: 'in'; col: string; vals: unknown[] }
  | { type: 'not_is'; col: string; val: null }
  | { type: 'or'; expr: string };

class DevQueryBuilder<T extends Row = Row> {
  private table: TableName;
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private filters: Filter[] = [];
  private orderCol?: string;
  private orderAsc = true;
  private limitCount?: number;
  private wantSingle = false;
  private selectAfterWrite = false;
  private insertRows: Record<string, unknown>[] = [];
  private updateRow: Record<string, unknown> = {};
  private upsertRows: Record<string, unknown>[] = [];

  constructor(table: TableName) {
    this.table = table;
  }

  select(_cols = '*') {
    if (this.op === 'insert' || this.op === 'upsert') {
      this.selectAfterWrite = true;
      return this;
    }
    this.op = 'select';
    return this;
  }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = 'insert';
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(row: Record<string, unknown>) {
    this.op = 'update';
    this.updateRow = row;
    return this;
  }

  upsert(rows: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = 'upsert';
    this.upsertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  ilike(col: string, val: string) {
    this.filters.push({ type: 'ilike', col, val });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push({ type: 'in', col, vals });
    return this;
  }

  not(col: string, op: string, val: null) {
    if (op === 'is' && val === null) {
      this.filters.push({ type: 'not_is', col, val: null });
    }
    return this;
  }

  or(expr: string) {
    this.filters.push({ type: 'or', expr });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  private getRows(db: DevDatabase): Row[] {
    return clone(db[this.table] as Row[]);
  }

  private setRows(db: DevDatabase, rows: Row[]) {
    (db[this.table] as Row[]) = rows;
  }

  private matchOr(row: Row, expr: string): boolean {
    // rep.eq.Name,rep.is.null
    const parts = expr.split(',');
    return parts.some((part) => {
      const [field, op, rawVal] = part.split('.');
      const val = (row as Record<string, unknown>)[field];
      if (op === 'eq') return String(val) === rawVal;
      if (op === 'is' && rawVal === 'null') return val == null;
      return false;
    });
  }

  private applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) => {
      return this.filters.every((f) => {
        const val = (row as Record<string, unknown>)[f.col];
        switch (f.type) {
          case 'eq':
            return val === f.val;
          case 'ilike': {
            const hay = String(val ?? '').toLowerCase();
            const needle = f.val.replace(/%/g, '').toLowerCase();
            if (f.val.includes('%')) return hay.includes(needle);
            return hay === needle;
          }
          case 'in':
            return f.vals.includes(val);
          case 'not_is':
            return val != null;
          case 'or':
            return this.matchOr(row, f.expr);
          default:
            return true;
        }
      });
    });
  }

  private applySort(rows: Row[]): Row[] {
    if (!this.orderCol) return rows;
    const col = this.orderCol;
    const asc = this.orderAsc;
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[col];
      const bv = (b as Record<string, unknown>)[col];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : 1;
      return asc ? cmp : -cmp;
    });
  }

  private finalizeResult(rows: Row[]): { data: T | T[] | null; error: PostgrestError | null } {
    if (this.wantSingle) {
      if (rows.length === 0) {
        return { data: null, error: pgError('PGRST116', 'JSON object requested, multiple (or no) rows returned') };
      }
      if (rows.length > 1) {
        return { data: null, error: pgError('PGRST116', 'JSON object requested, multiple (or no) rows returned') };
      }
      return { data: rows[0] as T, error: null };
    }
    return { data: rows as T[], error: null };
  }

  then<TResult1 = { data: T | T[] | null; error: PostgrestError | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | T[] | null; error: PostgrestError | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute(): { data: T | T[] | null; error: PostgrestError | null } {
    const db = loadDevDatabase();

    if (this.op === 'select') {
      let rows = this.getRows(db);
      rows = this.applyFilters(rows);
      rows = this.applySort(rows);
      if (this.limitCount != null) rows = rows.slice(0, this.limitCount);

      return this.finalizeResult(rows);
    }

    if (this.op === 'insert') {
      const created = new Date().toISOString();
      const inserted: Row[] = this.insertRows.map((row) => ({
        id: crypto.randomUUID(),
        created_at: created,
        ...row,
      })) as Row[];

      const existing = this.getRows(db);
      this.setRows(db, [...existing, ...inserted]);
      saveDevDatabase(db);

      if (this.selectAfterWrite || this.wantSingle) {
        return this.finalizeResult(inserted);
      }
      return { data: null, error: null };
    }

    if (this.op === 'update') {
      let rows = this.getRows(db);
      const ids = new Set(
        this.applyFilters(rows).map((r) => (r as Record<string, unknown>).id)
      );
      rows = rows.map((row) =>
        ids.has((row as Record<string, unknown>).id)
          ? ({ ...row, ...this.updateRow } as Row)
          : row
      );
      this.setRows(db, rows);
      saveDevDatabase(db);
      return { data: null, error: null };
    }

    if (this.op === 'delete') {
      let rows = this.getRows(db);
      const toDelete = new Set(
        this.applyFilters(rows).map((r) => (r as Record<string, unknown>).id)
      );
      rows = rows.filter((row) => !toDelete.has((row as Record<string, unknown>).id));
      this.setRows(db, rows);
      saveDevDatabase(db);
      return { data: null, error: null };
    }

    if (this.op === 'upsert') {
      if (this.table !== 'settings') {
        return { data: null, error: pgError('42P01', 'Upsert not supported for table') };
      }
      let rows = this.getRows(db) as { key: string; value: unknown; updated_at: string }[];
      for (const row of this.upsertRows) {
        const key = String(row.key);
        const idx = rows.findIndex((r) => r.key === key);
        const entry = {
          key,
          value: row.value,
          updated_at: String(row.updated_at ?? new Date().toISOString()),
        };
        if (idx >= 0) rows[idx] = entry;
        else rows.push(entry);
      }
      this.setRows(db, rows as Row[]);
      saveDevDatabase(db);
      return { data: null, error: null };
    }

    return { data: null, error: pgError('unknown', 'Unsupported operation') };
  }
}

export function createDevSupabaseClient() {
  return {
    from(table: TableName) {
      return new DevQueryBuilder(table);
    },
  };
}

export type DevSupabaseClient = ReturnType<typeof createDevSupabaseClient>;

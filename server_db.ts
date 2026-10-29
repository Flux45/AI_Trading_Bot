import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import type {
  ExecutedPosition,
  TradeHistoryRecord,
  TransactionRecord,
  AutonomousLiveCampaign,
  AdaptiveTradingModel,
} from "./src/types.ts";

export type { ExecutedPosition, TradeHistoryRecord, TransactionRecord };

export type TradingSystemMode = "intraday" | "long";

const DATA_DIR = path.join(process.cwd(), "data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

const DB_PATHS: Record<TradingSystemMode, string> = {
  intraday: path.join(DATA_DIR, "intraday_trades.sqlite"),
  long: path.join(DATA_DIR, "long_trades.sqlite"),
};

const JSON_STATE_PATHS: Record<TradingSystemMode, string> = {
  intraday: path.join(DATA_DIR, "portfolio_state_intraday.json"),
  long: path.join(DATA_DIR, "portfolio_state_long.json"),
};

const dbInstances: { intraday?: DatabaseSync; long?: DatabaseSync } = {};

export function normalizeSystemMode(mode?: string): TradingSystemMode {
  if (!mode) return "intraday";
  const m = mode.toLowerCase();
  return m === "long" || m === "swing" || m === "cnc" ? "long" : "intraday";
}

export function formatDurationMs(durationMs: number): string {
  if (!durationMs || durationMs <= 0) return "0s";
  const totalSeconds = Math.floor(durationMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function getDatabase(modeInput?: string): DatabaseSync {
  const mode = normalizeSystemMode(modeInput);
  if (!dbInstances[mode]) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const db = new DatabaseSync(DB_PATHS[mode]);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
    initSchema(db);
    dbInstances[mode] = db;
  }
  return dbInstances[mode]!;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS positions (
      order_id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      action TEXT NOT NULL,
      shares INTEGER NOT NULL,
      entry_price REAL NOT NULL,
      fill_price REAL NOT NULL,
      stop_loss REAL NOT NULL,
      target_price REAL NOT NULL,
      capital_allocated REAL NOT NULL,
      rupee_risk REAL NOT NULL,
      timestamp TEXT NOT NULL,
      entry_time TEXT,
      trade_mode TEXT,
      product_type TEXT,
      holding_duration TEXT,
      current_price REAL,
      unrealized_pnl REAL,
      unrealized_pnl_pct REAL,
      status TEXT NOT NULL,
      breached_stop_ticks INTEGER DEFAULT 0,
      breached_target_ticks INTEGER DEFAULT 0,
      strategy_id TEXT,
      strategy_name TEXT,
      market_scenario_rationale TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trade_history (
      id INTEGER PRIMARY KEY,
      order_id TEXT,
      ticker TEXT NOT NULL,
      company_name TEXT,
      bias TEXT NOT NULL,
      action TEXT NOT NULL,
      shares INTEGER NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL NOT NULL,
      pnl_realized REAL NOT NULL,
      pnl_pct REAL NOT NULL,
      lesson TEXT,
      timestamp TEXT NOT NULL,
      entry_time TEXT,
      exit_time TEXT,
      duration_ms INTEGER,
      duration_formatted TEXT,
      exit_reason TEXT,
      trade_mode TEXT,
      product_type TEXT,
      gain_loss_diagnosis TEXT,
      execution_mode TEXT DEFAULT 'PAPER',
      strategy_id TEXT,
      strategy_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      ticker TEXT NOT NULL,
      company_name TEXT,
      sector TEXT,
      action TEXT NOT NULL,
      type TEXT NOT NULL,
      shares INTEGER NOT NULL,
      price REAL NOT NULL,
      total_value REAL NOT NULL,
      stop_loss REAL,
      target_price REAL,
      rupee_risk REAL,
      realized_pnl REAL,
      realized_pnl_pct REAL,
      execution_mode TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      strategy_id TEXT,
      strategy_name TEXT,
      trade_mode TEXT,
      product_type TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS algo_strategy_ledgers (
      strategy_id TEXT PRIMARY KEY,
      ledger_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      event_type TEXT NOT NULL,
      order_id TEXT,
      ticker TEXT,
      message TEXT NOT NULL,
      payload_json TEXT
    );

    CREATE TABLE IF NOT EXISTS heartbeat_pings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      duration_ms REAL DEFAULT 0,
      status_code INTEGER DEFAULT 200,
      active_positions_count INTEGER DEFAULT 0,
      memory_mb REAL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS analyst_learning_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      version TEXT NOT NULL,
      executive_summary TEXT NOT NULL,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Run non-destructive column additions for existing SQLite databases
  try { db.exec("ALTER TABLE positions ADD COLUMN entry_time TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE positions ADD COLUMN trade_mode TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE positions ADD COLUMN product_type TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE positions ADD COLUMN holding_duration TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE positions ADD COLUMN strategy_id TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE positions ADD COLUMN strategy_name TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE positions ADD COLUMN market_scenario_rationale TEXT;"); } catch (_) {}

  try { db.exec("ALTER TABLE trade_history ADD COLUMN company_name TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN entry_time TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN exit_time TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN duration_ms INTEGER;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN duration_formatted TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN exit_reason TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN trade_mode TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN product_type TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN gain_loss_diagnosis TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN strategy_id TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE trade_history ADD COLUMN strategy_name TEXT;"); } catch (_) {}

  try { db.exec("ALTER TABLE transactions ADD COLUMN trade_mode TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE transactions ADD COLUMN product_type TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE transactions ADD COLUMN strategy_id TEXT;"); } catch (_) {}
  try { db.exec("ALTER TABLE transactions ADD COLUMN strategy_name TEXT;"); } catch (_) {}
}

// Save or update an active position in SQLite
export function dbSavePosition(pos: ExecutedPosition, modeInput?: string): void {
  try {
    const mode = normalizeSystemMode(pos.trade_mode || modeInput);
    const db = getDatabase(mode);
    const now = new Date().toISOString();
    const entryTime = pos.entry_time || pos.timestamp || now;
    const prodType = pos.product_type || (mode === "intraday" ? "MIS" : "CNC");

    const stmt = db.prepare(`
      INSERT INTO positions (
        order_id, ticker, action, shares, entry_price, fill_price, stop_loss, target_price,
        capital_allocated, rupee_risk, timestamp, entry_time, trade_mode, product_type, holding_duration,
        current_price, unrealized_pnl, unrealized_pnl_pct, status, breached_stop_ticks, breached_target_ticks,
        strategy_id, strategy_name, market_scenario_rationale, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(order_id) DO UPDATE SET
        current_price = excluded.current_price,
        unrealized_pnl = excluded.unrealized_pnl,
        unrealized_pnl_pct = excluded.unrealized_pnl_pct,
        status = excluded.status,
        breached_stop_ticks = excluded.breached_stop_ticks,
        breached_target_ticks = excluded.breached_target_ticks,
        strategy_id = coalesce(excluded.strategy_id, positions.strategy_id),
        strategy_name = coalesce(excluded.strategy_name, positions.strategy_name),
        market_scenario_rationale = coalesce(excluded.market_scenario_rationale, positions.market_scenario_rationale),
        holding_duration = excluded.holding_duration,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      pos.order_id,
      pos.ticker,
      pos.action,
      pos.shares,
      pos.entry_price,
      pos.fill_price,
      pos.stop_loss,
      pos.target_price,
      pos.capital_allocated,
      pos.rupee_risk,
      pos.timestamp || now,
      entryTime,
      mode.toUpperCase(),
      prodType,
      pos.holding_duration || null,
      pos.current_price ?? pos.fill_price,
      pos.unrealized_pnl ?? 0,
      pos.unrealized_pnl_pct ?? 0,
      pos.status || "OPEN",
      pos.breached_stop_ticks ?? 0,
      pos.breached_target_ticks ?? 0,
      pos.strategy_id || null,
      pos.strategy_name || null,
      pos.market_scenario_rationale || null,
      pos.timestamp || now,
      now
    );

    dbLogAudit("POSITION_SAVED", `[${mode.toUpperCase()}] Position ${pos.order_id} (${pos.ticker}) saved in SQLite database.`, pos.order_id, pos.ticker, pos, mode);
  } catch (err: any) {
    console.error(`[DB Error ${modeInput}] Failed to save position to SQLite:`, err?.message || err);
  }
}

// Delete position from active table upon closing
export function dbRemovePosition(orderId: string, modeInput?: string): void {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const stmt = db.prepare("DELETE FROM positions WHERE order_id = ?");
    stmt.run(orderId);
    dbLogAudit("POSITION_CLOSED", `[${mode.toUpperCase()}] Position ${orderId} removed from active positions.`, orderId, undefined, undefined, mode);
  } catch (err: any) {
    console.error(`[DB Error ${modeInput}] Failed to remove position from SQLite:`, err?.message || err);
  }
}

// Get all open active positions
export function dbGetActivePositions(modeInput?: string): ExecutedPosition[] {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const stmt = db.prepare("SELECT * FROM positions WHERE status = 'OPEN' ORDER BY timestamp DESC");
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      order_id: String(r.order_id),
      ticker: String(r.ticker),
      action: r.action as "BUY" | "SELL",
      shares: Number(r.shares),
      entry_price: Number(r.entry_price),
      fill_price: Number(r.fill_price),
      stop_loss: Number(r.stop_loss),
      target_price: Number(r.target_price),
      capital_allocated: Number(r.capital_allocated),
      rupee_risk: Number(r.rupee_risk),
      timestamp: String(r.timestamp),
      entry_time: r.entry_time ? String(r.entry_time) : String(r.timestamp),
      trade_mode: (r.trade_mode || (mode === "intraday" ? "INTRADAY" : "LONG")) as any,
      product_type: (r.product_type || (mode === "intraday" ? "MIS" : "CNC")) as any,
      holding_duration: r.holding_duration ? String(r.holding_duration) : undefined,
      current_price: Number(r.current_price || r.fill_price),
      unrealized_pnl: Number(r.unrealized_pnl || 0),
      unrealized_pnl_pct: Number(r.unrealized_pnl_pct || 0),
      status: r.status as "OPEN" | "CLOSED",
      breached_stop_ticks: Number(r.breached_stop_ticks || 0),
      breached_target_ticks: Number(r.breached_target_ticks || 0),
      strategy_id: r.strategy_id ? String(r.strategy_id) : undefined,
      strategy_name: r.strategy_name ? String(r.strategy_name) : undefined,
      market_scenario_rationale: r.market_scenario_rationale ? String(r.market_scenario_rationale) : undefined,
    }));
  } catch (err: any) {
    console.error(`[DB Error ${modeInput}] Failed to get active positions:`, err?.message || err);
    return [];
  }
}

// Save closed trade history
export function dbSaveTradeHistory(rec: TradeHistoryRecord, modeInput?: string): void {
  try {
    const mode = normalizeSystemMode(rec.trade_mode || modeInput);
    const db = getDatabase(mode);
    const now = new Date().toISOString();
    const entryTime = rec.entry_time || rec.timestamp || now;
    const exitTime = rec.exit_time || now;
    const durMs = rec.duration_ms || Math.max(0, new Date(exitTime).getTime() - new Date(entryTime).getTime());
    const durFmt = rec.duration || formatDurationMs(durMs);
    const prodType = rec.product_type || (mode === "intraday" ? "MIS" : "CNC");

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO trade_history (
        id, order_id, ticker, company_name, bias, action, shares, entry_price, exit_price,
        pnl_realized, pnl_pct, lesson, timestamp, entry_time, exit_time, duration_ms, duration_formatted,
        exit_reason, trade_mode, product_type, gain_loss_diagnosis, execution_mode,
        strategy_id, strategy_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      rec.id,
      rec.order_id || `TRADE_${rec.id}`,
      rec.ticker,
      rec.company_name || rec.ticker,
      rec.bias || "BULLISH",
      rec.action,
      rec.shares,
      rec.entry_price,
      rec.exit_price,
      rec.pnl_realized,
      rec.pnl_pct,
      rec.lesson || "",
      rec.timestamp || now,
      entryTime,
      exitTime,
      durMs,
      durFmt,
      rec.exit_reason || (rec.pnl_realized >= 0 ? "Target Exit" : "Stop Loss Exit"),
      mode.toUpperCase(),
      prodType,
      rec.gain_loss_diagnosis || (rec.pnl_realized >= 0 ? "Target reached via strategy edge." : "Stop-loss protected risk capital."),
      rec.execution_mode || "PAPER",
      rec.strategy_id || null,
      rec.strategy_name || null,
      now
    );

    dbLogAudit("TRADE_HISTORY_RECORDED", `[${mode.toUpperCase()}] Closed trade ${rec.id} (${rec.ticker}) recorded. P&L: ₹${rec.pnl_realized} (${durFmt})`, rec.order_id, rec.ticker, rec, mode);
  } catch (err: any) {
    console.error(`[DB Error ${modeInput}] Failed to save trade history:`, err?.message || err);
  }
}

export function dbGetTradeHistory(modeInput?: string): TradeHistoryRecord[] {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const stmt = db.prepare("SELECT * FROM trade_history ORDER BY id DESC");
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      order_id: r.order_id ? String(r.order_id) : undefined,
      ticker: String(r.ticker),
      company_name: r.company_name ? String(r.company_name) : String(r.ticker),
      bias: r.bias as "BULLISH" | "BEARISH" | "NEUTRAL",
      action: r.action as "BUY" | "SELL",
      shares: Number(r.shares),
      entry_price: Number(r.entry_price),
      exit_price: Number(r.exit_price),
      pnl_realized: Number(r.pnl_realized),
      pnl_pct: Number(r.pnl_pct),
      lesson: String(r.lesson || ""),
      timestamp: String(r.timestamp),
      entry_time: r.entry_time ? String(r.entry_time) : undefined,
      exit_time: r.exit_time ? String(r.exit_time) : undefined,
      duration: r.duration_formatted ? String(r.duration_formatted) : undefined,
      duration_ms: r.duration_ms ? Number(r.duration_ms) : undefined,
      exit_reason: r.exit_reason ? String(r.exit_reason) : undefined,
      trade_mode: (r.trade_mode || (mode === "intraday" ? "INTRADAY" : "LONG")) as any,
      product_type: (r.product_type || (mode === "intraday" ? "MIS" : "CNC")) as any,
      gain_loss_diagnosis: r.gain_loss_diagnosis ? String(r.gain_loss_diagnosis) : undefined,
      execution_mode: String(r.execution_mode || "PAPER"),
      strategy_id: r.strategy_id ? String(r.strategy_id) : undefined,
      strategy_name: r.strategy_name ? String(r.strategy_name) : undefined,
    }));
  } catch (err: any) {
    console.error(`[DB Error ${modeInput}] Failed to get trade history:`, err?.message || err);
    return [];
  }
}

// Save transaction record
export function dbSaveTransaction(txn: TransactionRecord, modeInput?: string): void {
  try {
    const mode = normalizeSystemMode(txn.product_type === "CNC" ? "long" : modeInput);
    const db = getDatabase(mode);
    const now = new Date().toISOString();
    const prodType = txn.product_type || (mode === "intraday" ? "MIS" : "CNC");

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO transactions (
        id, order_id, timestamp, ticker, company_name, sector, action, type,
        shares, price, total_value, stop_loss, target_price, rupee_risk,
        realized_pnl, realized_pnl_pct, execution_mode, status, notes,
        strategy_id, strategy_name, trade_mode, product_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      txn.id,
      txn.order_id,
      txn.timestamp || now,
      txn.ticker,
      txn.company_name || txn.ticker,
      txn.sector || "NSE Equities",
      txn.action,
      txn.type,
      txn.shares,
      txn.price,
      txn.total_value,
      txn.stop_loss ?? null,
      txn.target_price ?? null,
      txn.rupee_risk ?? null,
      txn.realized_pnl ?? null,
      txn.realized_pnl_pct ?? null,
      txn.execution_mode,
      txn.status,
      txn.notes || "",
      txn.strategy_id || null,
      txn.strategy_name || null,
      mode.toUpperCase(),
      prodType,
      now
    );

    dbLogAudit("TRANSACTION_LOGGED", `[${mode.toUpperCase()}] Transaction ${txn.id} for ${txn.ticker} (${txn.type}) logged.`, txn.order_id, txn.ticker, undefined, mode);
  } catch (err: any) {
    console.error(`[DB Error ${modeInput}] Failed to save transaction:`, err?.message || err);
  }
}

export function dbGetTransactions(modeInput?: string): TransactionRecord[] {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const stmt = db.prepare("SELECT * FROM transactions ORDER BY id DESC");
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: String(r.id),
      order_id: String(r.order_id),
      timestamp: String(r.timestamp),
      ticker: String(r.ticker),
      company_name: String(r.company_name || r.ticker),
      sector: String(r.sector || "NSE Equities"),
      action: r.action as "BUY" | "SELL",
      type: r.type as any,
      shares: Number(r.shares),
      price: Number(r.price),
      total_value: Number(r.total_value),
      stop_loss: r.stop_loss !== null ? Number(r.stop_loss) : undefined,
      target_price: r.target_price !== null ? Number(r.target_price) : undefined,
      rupee_risk: r.rupee_risk !== null ? Number(r.rupee_risk) : undefined,
      realized_pnl: r.realized_pnl !== null ? Number(r.realized_pnl) : undefined,
      realized_pnl_pct: r.realized_pnl_pct !== null ? Number(r.realized_pnl_pct) : undefined,
      execution_mode: r.execution_mode as "PAPER" | "ZERODHA",
      status: r.status as any,
      notes: String(r.notes || ""),
      strategy_id: r.strategy_id ? String(r.strategy_id) : undefined,
      strategy_name: r.strategy_name ? String(r.strategy_name) : undefined,
      trade_mode: (r.trade_mode || (mode === "intraday" ? "INTRADAY" : "LONG")) as any,
      product_type: (r.product_type || (mode === "intraday" ? "MIS" : "CNC")) as any,
    }));
  } catch (err: any) {
    console.error(`[DB Error ${modeInput}] Failed to get transactions:`, err?.message || err);
    return [];
  }
}

// Strategy Ledgers Store
export function dbSaveStrategyLedger(ledger: any, modeInput?: string): void {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO algo_strategy_ledgers (strategy_id, ledger_json, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(ledger.strategy_id, JSON.stringify(ledger), now);
  } catch (err: any) {
    console.error("[DB Error] Failed to save strategy ledger:", err?.message || err);
  }
}

export function dbGetStrategyLedgers(modeInput?: string): any[] {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const rows = db.prepare("SELECT ledger_json FROM algo_strategy_ledgers").all() as any[];
    return rows.map((r) => JSON.parse(r.ledger_json));
  } catch (err: any) {
    console.error("[DB Error] Failed to get strategy ledgers:", err?.message || err);
    return [];
  }
}

export function dbGetStrategyLedger(strategyId: string, modeInput?: string): any | null {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const row = db.prepare("SELECT ledger_json FROM algo_strategy_ledgers WHERE strategy_id = ?").get(strategyId) as any;
    if (row && row.ledger_json) {
      return JSON.parse(row.ledger_json);
    }
  } catch (err: any) {
    console.error(`[DB Error] Failed to get strategy ledger ${strategyId}:`, err?.message || err);
  }
  return null;
}

export function dbSaveAnalystLog(report: any): void {
  try {
    const db = getDatabase("intraday");
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO analyst_learning_log (timestamp, version, executive_summary, report_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      report.timestamp || now,
      report.evolutionLevel || "Level 5",
      report.executiveSummary || "Analyst daily review",
      JSON.stringify(report),
      now
    );
  } catch (err: any) {
    console.error("[DB Error] Failed to save analyst log:", err?.message || err);
  }
}

export function dbGetAnalystLogs(limit: number = 20): any[] {
  try {
    const db = getDatabase("intraday");
    const rows = db.prepare("SELECT * FROM analyst_learning_log ORDER BY id DESC LIMIT ?").all(limit) as any[];
    return rows.map((r) => {
      try {
        return JSON.parse(r.report_json);
      } catch {
        return {
          timestamp: r.timestamp,
          evolutionLevel: r.version,
          executiveSummary: r.executive_summary,
        };
      }
    });
  } catch (err: any) {
    console.error("[DB Error] Failed to get analyst logs:", err?.message || err);
    return [];
  }
}

export function dbGetLatestAnalystLog(): any | null {
  try {
    const db = getDatabase("intraday");
    const row = db.prepare("SELECT * FROM analyst_learning_log ORDER BY id DESC LIMIT 1").get() as any;
    if (row && row.report_json) {
      return JSON.parse(row.report_json);
    }
  } catch (err: any) {
    console.error("[DB Error] Failed to get latest analyst log:", err?.message || err);
  }
  return null;
}

// Key-Value Store
export function dbSetKV(key: string, value: any, modeInput?: string): void {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO kv_store (key, value, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(key, JSON.stringify(value), new Date().toISOString());
  } catch (err: any) {
    console.error(`[DB Error] Failed to set KV ${key}:`, err?.message || err);
  }
}

export function dbGetKV<T>(key: string, modeInput?: string): T | null {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const stmt = db.prepare("SELECT value FROM kv_store WHERE key = ?");
    const row = stmt.get(key) as any;
    if (row && row.value) {
      return JSON.parse(row.value) as T;
    }
  } catch (err: any) {
    console.error(`[DB Error] Failed to get KV ${key}:`, err?.message || err);
  }
  return null;
}

// Audit logger
export function dbLogAudit(eventType: string, message: string, orderId?: string, ticker?: string, payload?: any, modeInput?: string): void {
  try {
    const mode = normalizeSystemMode(modeInput);
    const db = getDatabase(mode);
    const stmt = db.prepare(`
      INSERT INTO audit_events (timestamp, event_type, order_id, ticker, message, payload_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      new Date().toISOString(),
      eventType,
      orderId || null,
      ticker || null,
      message,
      payload ? JSON.stringify(payload) : null
    );
  } catch (_) {}
}

// Atomic file write for JSON state mirror
export function atomicWriteJSON(filePath: string, data: any): void {
  try {
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err: any) {
    console.warn("[Atomic Write Warning]:", err?.message || err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (_) {}
  }
}

// Complete State Flush for a specific mode
export function flushCompleteState(
  executedPositions: ExecutedPosition[],
  tradeHistory: TradeHistoryRecord[],
  transactionsLedger: TransactionRecord[],
  currentLiveCampaign: any,
  adaptiveTradingModel: any,
  lastActionSummary: string,
  modeInput?: string
): void {
  try {
    const mode = normalizeSystemMode(modeInput);

    // 1. Persist each position to SQLite
    for (const pos of executedPositions) {
      dbSavePosition(pos, mode);
    }

    // 2. Persist trades & transactions to SQLite
    for (const th of tradeHistory.slice(0, 100)) {
      dbSaveTradeHistory(th, mode);
    }
    for (const txn of transactionsLedger.slice(0, 150)) {
      dbSaveTransaction(txn, mode);
    }

    // 3. Persist campaign & model to KV
    dbSetKV("currentLiveCampaign", currentLiveCampaign, mode);
    dbSetKV("adaptiveTradingModel", adaptiveTradingModel, mode);
    dbSetKV("lastActionSummary", lastActionSummary, mode);

    // 4. Atomically write to mode-specific JSON mirror
    const payload = {
      savedAt: new Date().toISOString(),
      mode: mode.toUpperCase(),
      executedPositions,
      tradeHistory,
      transactionsLedger,
      currentLiveCampaign,
      adaptiveTradingModel,
      lastActionSummary,
    };
    atomicWriteJSON(JSON_STATE_PATHS[mode], payload);

    // Also write backup
    const backupFile = path.join(BACKUP_DIR, `snapshot_${mode}_${new Date().toISOString().slice(0, 13)}.json`);
    if (!fs.existsSync(backupFile)) {
      atomicWriteJSON(backupFile, payload);
    }
  } catch (err: any) {
    console.error(`[Persistence Error ${modeInput}] flushCompleteState failed:`, err?.message || err);
  }
}

// Generate Realistic Seed Data if Database is Freshly Initialized
function getSeedTrades(mode: TradingSystemMode): {
  positions: ExecutedPosition[];
  trades: TradeHistoryRecord[];
  transactions: TransactionRecord[];
} {
  const nowMs = Date.now();

  if (mode === "intraday") {
    // Pure Intraday (MIS) trades entered within today's market hours with exact minute/hour timings
    const baseToday = new Date();
    baseToday.setHours(9, 15, 0, 0);
    const todayMorning = baseToday.getTime();

    const trades: TradeHistoryRecord[] = [
      {
        id: 101,
        order_id: "INTRA_CL_101",
        ticker: "KOTAKBANK",
        company_name: "Kotak Mahindra Bank Ltd",
        bias: "BULLISH",
        action: "BUY",
        shares: 8,
        entry_price: 1740.0,
        exit_price: 1782.0,
        pnl_realized: 336.0,
        pnl_pct: 2.41,
        entry_time: new Date(todayMorning + 15 * 60000).toISOString(), // 09:30 AM
        exit_time: new Date(todayMorning + 145 * 60000).toISOString(), // 11:40 AM
        duration: "2h 10m 00s",
        duration_ms: 130 * 60000,
        exit_reason: "🎯 Take-Profit Target Hit (+2.41%)",
        trade_mode: "INTRADAY",
        product_type: "MIS",
        strategy_id: "algo-ofi-microstructure-02",
        strategy_name: "Order Flow Imbalance",
        gain_loss_diagnosis: "Institutional order flow delta showed persistent aggressive ask lifting above session VWAP. Momentum accelerated directly into ₹1,782 target bracket.",
        lesson: "Waiting for VWAP absorption retest before entering order flow momentum trades dramatically increases intraday risk-reward.",
        timestamp: new Date(todayMorning + 145 * 60000).toISOString(),
        execution_mode: "PAPER",
      },
      {
        id: 102,
        order_id: "INTRA_CL_102",
        ticker: "TCS",
        company_name: "Tata Consultancy Services Ltd",
        bias: "BULLISH",
        action: "BUY",
        shares: 4,
        entry_price: 2120.0,
        exit_price: 2091.5,
        pnl_realized: -114.0,
        pnl_pct: -1.34,
        entry_time: new Date(todayMorning + 50 * 60000).toISOString(), // 10:05 AM
        exit_time: new Date(todayMorning + 92 * 60000).toISOString(), // 10:47 AM
        duration: "42m 00s",
        duration_ms: 42 * 60000,
        exit_reason: "🛡️ Hard Stop-Loss Triggered (-1.34%)",
        trade_mode: "INTRADAY",
        product_type: "MIS",
        strategy_id: "algo-volatility-breakout",
        strategy_name: "Intraday Momentum Breakout",
        gain_loss_diagnosis: "False morning breakout at ₹2,120 resistance with sudden sector-wide IT selloff. Stop-loss promptly cut loss at ₹2,091.50, protecting 98.7% of position capital.",
        lesson: "Avoid trading breakout continuation before 10:30 AM when broader Nifty IT breadth is diverging negatively.",
        timestamp: new Date(todayMorning + 92 * 60000).toISOString(),
        execution_mode: "PAPER",
      },
      {
        id: 103,
        order_id: "INTRA_CL_103",
        ticker: "INFY",
        company_name: "Infosys Ltd",
        bias: "BULLISH",
        action: "BUY",
        shares: 10,
        entry_price: 1480.0,
        exit_price: 1514.5,
        pnl_realized: 345.0,
        pnl_pct: 2.33,
        entry_time: new Date(todayMorning + 110 * 60000).toISOString(), // 11:05 AM
        exit_time: new Date(todayMorning + 250 * 60000).toISOString(), // 01:25 PM
        duration: "2h 20m 00s",
        duration_ms: 140 * 60000,
        exit_reason: "🎯 Take-Profit Target Hit (+2.33%)",
        trade_mode: "INTRADAY",
        product_type: "MIS",
        strategy_id: "algo-vwap-mean-reversion",
        strategy_name: "VWAP Mean Reversion",
        gain_loss_diagnosis: "Price stretched to -2.2 standard deviations below VWAP with extreme selling exhaustion. Clean snapback reversion yielded +₹345 gain.",
        lesson: "Midday VWAP mean-reversion on high-liquidity large caps offers exceptional win rates during range-bound regimes.",
        timestamp: new Date(todayMorning + 250 * 60000).toISOString(),
        execution_mode: "PAPER",
      },
      {
        id: 104,
        order_id: "INTRA_CL_104",
        ticker: "HDFCBANK",
        company_name: "HDFC Bank Ltd",
        bias: "BULLISH",
        action: "BUY",
        shares: 12,
        entry_price: 718.0,
        exit_price: 729.0,
        pnl_realized: 132.0,
        pnl_pct: 1.53,
        entry_time: new Date(todayMorning + 260 * 60000).toISOString(), // 01:35 PM
        exit_time: new Date(todayMorning + 325 * 60000).toISOString(), // 02:40 PM
        duration: "1h 05m 00s",
        duration_ms: 65 * 60000,
        exit_reason: "⏰ Intraday Pre-Close Square-Off (14:40 IST)",
        trade_mode: "INTRADAY",
        product_type: "MIS",
        strategy_id: "algo-ofi-microstructure-02",
        strategy_name: "Microstructure Scalping",
        gain_loss_diagnosis: "Short-term order book skew allowed quick +1.53% gain; closed proactively before 15:15 mandatory MIS auto square-off to avoid late volatility spikes.",
        lesson: "Locking gains before 15:00 IST prevents slippage from broker-side auto square-off queues.",
        timestamp: new Date(todayMorning + 325 * 60000).toISOString(),
        execution_mode: "PAPER",
      },
    ];

    const positions: ExecutedPosition[] = [
      {
        order_id: "INTRA_ACT_AXISBANK_01",
        ticker: "AXISBANK",
        action: "BUY",
        shares: 10,
        entry_price: 1180.0,
        fill_price: 1180.6,
        stop_loss: 1162.0,
        target_price: 1215.0,
        capital_allocated: 11806.0,
        rupee_risk: 186.0,
        timestamp: new Date(todayMorning + 35 * 60000).toISOString(), // 09:50 AM
        entry_time: new Date(todayMorning + 35 * 60000).toISOString(),
        trade_mode: "INTRADAY",
        product_type: "MIS",
        holding_duration: "1h 45m in trade",
        current_price: 1198.5,
        unrealized_pnl: 179.0,
        unrealized_pnl_pct: 1.52,
        status: "OPEN",
        strategy_id: "algo-ofi-microstructure-02",
        strategy_name: "Order Flow Imbalance",
        market_scenario_rationale: "Intraday volume delta breakout above previous 15-min high with high institutional participation.",
      },
      {
        order_id: "INTRA_ACT_TATAMOTORS_02",
        ticker: "TATAMOTORS",
        action: "BUY",
        shares: 12,
        entry_price: 920.0,
        fill_price: 920.45,
        stop_loss: 908.0,
        target_price: 945.0,
        capital_allocated: 11045.4,
        rupee_risk: 149.4,
        timestamp: new Date(todayMorning + 80 * 60000).toISOString(), // 10:35 AM
        entry_time: new Date(todayMorning + 80 * 60000).toISOString(),
        trade_mode: "INTRADAY",
        product_type: "MIS",
        holding_duration: "1h 00m in trade",
        current_price: 928.0,
        unrealized_pnl: 90.6,
        unrealized_pnl_pct: 0.82,
        status: "OPEN",
        strategy_id: "algo-vwap-mean-reversion",
        strategy_name: "VWAP Mean Reversion",
        market_scenario_rationale: "Automobile sector index outperformance; holding firmly above 5-min VWAP support band.",
      },
    ];

    const transactions: TransactionRecord[] = trades.map((t, idx) => ({
      id: `TXN-INTRA-${1000 + idx}`,
      order_id: t.order_id || `INTRA_${t.id}`,
      timestamp: t.exit_time || t.timestamp,
      ticker: t.ticker,
      company_name: t.company_name,
      sector: "NSE Equities",
      action: t.action,
      type: "EXIT_CLOSE",
      shares: t.shares,
      price: t.exit_price,
      total_value: t.shares * t.exit_price,
      stop_loss: t.entry_price * 0.985,
      target_price: t.entry_price * 1.025,
      rupee_risk: 150,
      realized_pnl: t.pnl_realized,
      realized_pnl_pct: t.pnl_pct,
      execution_mode: "PAPER",
      status: "CLOSED",
      notes: `${t.strategy_name}: ${t.exit_reason}`,
      strategy_id: t.strategy_id,
      strategy_name: t.strategy_name,
      trade_mode: "INTRADAY",
      product_type: "MIS",
    }));

    return { positions, trades, transactions };
  } else {
    // Pure Long / Positional (CNC) trades held over 2 to 7 days
    const dayMs = 86400000;
    const trades: TradeHistoryRecord[] = [
      {
        id: 201,
        order_id: "LONG_CL_201",
        ticker: "SBIN",
        company_name: "State Bank of India",
        bias: "BULLISH",
        action: "BUY",
        shares: 15,
        entry_price: 810.0,
        exit_price: 862.0,
        pnl_realized: 780.0,
        pnl_pct: 6.42,
        entry_time: new Date(nowMs - 5 * dayMs).toISOString(),
        exit_time: new Date(nowMs - 1 * dayMs).toISOString(),
        duration: "4d 6h 20m",
        duration_ms: 4 * dayMs + 6 * 3600000,
        exit_reason: "🎯 Multi-Day Swing Target Hit (+6.42%)",
        trade_mode: "LONG",
        product_type: "CNC",
        strategy_id: "algo-cognitive-flagship",
        strategy_name: "Cognitive-Q Flagship",
        gain_loss_diagnosis: "Strong credit growth data and multi-week ascending triangle breakout. Institutional accumulation drove steady upward drift over 4 consecutive trading sessions.",
        lesson: "Multi-day swing winners generate asymmetric returns when allowed to mature to key weekly resistance lines without micro-management.",
        timestamp: new Date(nowMs - 1 * dayMs).toISOString(),
        execution_mode: "PAPER",
      },
      {
        id: 202,
        order_id: "LONG_CL_202",
        ticker: "SUNPHARMA",
        company_name: "Sun Pharmaceutical Industries Ltd",
        bias: "BULLISH",
        action: "BUY",
        shares: 10,
        entry_price: 1710.0,
        exit_price: 1778.0,
        pnl_realized: 680.0,
        pnl_pct: 3.98,
        entry_time: new Date(nowMs - 6 * dayMs).toISOString(),
        exit_time: new Date(nowMs - 2 * dayMs).toISOString(),
        duration: "3d 22h 45m",
        duration_ms: 4 * dayMs,
        exit_reason: "🎯 Positional Target Hit (+3.98%)",
        trade_mode: "LONG",
        product_type: "CNC",
        strategy_id: "algo-kalman-pairs-01",
        strategy_name: "Kalman Filter Dynamic Hedging",
        gain_loss_diagnosis: "Pharma sector momentum provided steady uncorrelated alpha while broader benchmark was undergoing consolidation.",
        lesson: "Healthcare and non-cyclical defensive holdings provide resilience and positive portfolio carry during index chop.",
        timestamp: new Date(nowMs - 2 * dayMs).toISOString(),
        execution_mode: "PAPER",
      },
      {
        id: 203,
        order_id: "LONG_CL_203",
        ticker: "TITAN",
        company_name: "Titan Company Ltd",
        bias: "BULLISH",
        action: "BUY",
        shares: 6,
        entry_price: 3450.0,
        exit_price: 3375.0,
        pnl_realized: -450.0,
        pnl_pct: -2.17,
        entry_time: new Date(nowMs - 7 * dayMs).toISOString(),
        exit_time: new Date(nowMs - 4 * dayMs).toISOString(),
        duration: "2d 18h 10m",
        duration_ms: 2 * dayMs + 18 * 3600000,
        exit_reason: "🛡️ Positional Stop-Loss Defended (-2.17%)",
        trade_mode: "LONG",
        product_type: "CNC",
        strategy_id: "algo-titans-compounder",
        strategy_name: "Titans Quality Compounder",
        gain_loss_diagnosis: "Gold duty hike speculation created sector-wide luxury inventory liquidation; 2% positional risk boundary exited promptly without emotional hesitation.",
        lesson: "Always honor macro regulatory catalysts; hard stops prevent a minor drawdown from turning into a long-term capital trap.",
        timestamp: new Date(nowMs - 4 * dayMs).toISOString(),
        execution_mode: "PAPER",
      },
    ];

    const positions: ExecutedPosition[] = [
      {
        order_id: "LONG_ACT_RELIANCE_01",
        ticker: "RELIANCE",
        action: "BUY",
        shares: 8,
        entry_price: 1240.0,
        fill_price: 1240.6,
        stop_loss: 1195.0,
        target_price: 1335.0,
        capital_allocated: 9924.8,
        rupee_risk: 364.8,
        timestamp: new Date(nowMs - 3 * dayMs).toISOString(),
        entry_time: new Date(nowMs - 3 * dayMs).toISOString(),
        trade_mode: "LONG",
        product_type: "CNC",
        holding_duration: "3d 4h in trade",
        current_price: 1272.5,
        unrealized_pnl: 255.2,
        unrealized_pnl_pct: 2.57,
        status: "OPEN",
        strategy_id: "algo-cognitive-flagship",
        strategy_name: "Cognitive-Q Flagship",
        market_scenario_rationale: "High-conviction positional swing holding above 20-day EMA support with strong institutional volume buildup.",
      },
      {
        order_id: "LONG_ACT_LT_02",
        ticker: "LT",
        action: "BUY",
        shares: 4,
        entry_price: 3620.0,
        fill_price: 3621.8,
        stop_loss: 3480.0,
        target_price: 3910.0,
        capital_allocated: 14487.2,
        rupee_risk: 567.2,
        timestamp: new Date(nowMs - 2 * dayMs).toISOString(),
        entry_time: new Date(nowMs - 2 * dayMs).toISOString(),
        trade_mode: "LONG",
        product_type: "CNC",
        holding_duration: "2d 1h in trade",
        current_price: 3698.0,
        unrealized_pnl: 304.8,
        unrealized_pnl_pct: 2.1,
        status: "OPEN",
        strategy_id: "algo-quantum-synergy",
        strategy_name: "Quantum Synergy Ensemble",
        market_scenario_rationale: "Infrastructure order book visibility expansion and steady multi-week trend channel continuation.",
      },
    ];

    const transactions: TransactionRecord[] = trades.map((t, idx) => ({
      id: `TXN-LONG-${2000 + idx}`,
      order_id: t.order_id || `LONG_${t.id}`,
      timestamp: t.exit_time || t.timestamp,
      ticker: t.ticker,
      company_name: t.company_name,
      sector: "NSE Equities",
      action: t.action,
      type: "EXIT_CLOSE",
      shares: t.shares,
      price: t.exit_price,
      total_value: t.shares * t.exit_price,
      stop_loss: t.entry_price * 0.97,
      target_price: t.entry_price * 1.06,
      rupee_risk: 450,
      realized_pnl: t.pnl_realized,
      realized_pnl_pct: t.pnl_pct,
      execution_mode: "PAPER",
      status: "CLOSED",
      notes: `${t.strategy_name}: ${t.exit_reason}`,
      strategy_id: t.strategy_id,
      strategy_name: t.strategy_name,
      trade_mode: "LONG",
      product_type: "CNC",
    }));

    return { positions, trades, transactions };
  }
}

// Load and reconcile state on container/process initialization
export function loadCompleteState(modeInput?: string): {
  executedPositions: ExecutedPosition[];
  tradeHistory: TradeHistoryRecord[];
  transactionsLedger: TransactionRecord[];
  currentLiveCampaign: any | null;
  adaptiveTradingModel: any | null;
  lastActionSummary: string | null;
} {
  const mode = normalizeSystemMode(modeInput);
  let positions: ExecutedPosition[] = [];
  let trades: TradeHistoryRecord[] = [];
  let txns: TransactionRecord[] = [];
  let campaign: any = null;
  let model: any = null;
  let summary: string | null = null;

  try {
    // Ensure database is initialized
    getDatabase(mode);

    // 1. Try loading from SQLite first
    positions = dbGetActivePositions(mode);
    trades = dbGetTradeHistory(mode);
    txns = dbGetTransactions(mode);
    campaign = dbGetKV("currentLiveCampaign", mode);
    model = dbGetKV("adaptiveTradingModel", mode);
    summary = dbGetKV("lastActionSummary", mode);

    // 2. Check JSON mirror if SQLite was completely empty
    const jsonPath = JSON_STATE_PATHS[mode];
    if (positions.length === 0 && trades.length === 0 && fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.executedPositions) && parsed.executedPositions.length > 0) {
          positions = parsed.executedPositions;
          for (const p of positions) dbSavePosition(p, mode);
        }
        if (Array.isArray(parsed.tradeHistory) && parsed.tradeHistory.length > 0) {
          trades = parsed.tradeHistory;
          for (const t of trades) dbSaveTradeHistory(t, mode);
        }
        if (Array.isArray(parsed.transactionsLedger) && parsed.transactionsLedger.length > 0) {
          txns = parsed.transactionsLedger;
          for (const x of txns) dbSaveTransaction(x, mode);
        }
      } catch (e: any) {
        console.warn(`[DB Migration ${mode}] Failed reading JSON mirror:`, e?.message);
      }
    }

    // 3. If still empty, seed this specific database with clean, realistic initial data
    if (positions.length === 0 && trades.length === 0) {
      console.log(`[DB Boot] Seeding brand new isolated ${mode.toUpperCase()} database...`);
      const seeds = getSeedTrades(mode);
      positions = seeds.positions;
      trades = seeds.trades;
      txns = seeds.transactions;

      for (const p of positions) dbSavePosition(p, mode);
      for (const t of trades) dbSaveTradeHistory(t, mode);
      for (const x of txns) dbSaveTransaction(x, mode);

      flushCompleteState(positions, trades, txns, campaign, model, `Seeded initial ${mode} system`, mode);
    }

    console.log(`[Database ${mode.toUpperCase()}] Ready with ${positions.length} active positions, ${trades.length} closed trades.`);
  } catch (err: any) {
    console.error(`[Database Error ${mode}] loadCompleteState failed:`, err?.message || err);
  }

  return {
    executedPositions: positions,
    tradeHistory: trades,
    transactionsLedger: txns,
    currentLiveCampaign: campaign,
    adaptiveTradingModel: model,
    lastActionSummary: summary,
  };
}

export interface HeartbeatRecord {
  id?: number;
  timestamp: string;
  source: string;
  ip?: string;
  user_agent?: string;
  duration_ms?: number;
  status_code?: number;
  active_positions_count?: number;
  memory_mb?: number;
  notes?: string;
}

export function dbLogHeartbeat(record: HeartbeatRecord): void {
  try {
    const db = getDatabase("intraday");
    const stmt = db.prepare(`
      INSERT INTO heartbeat_pings (
        timestamp, source, ip, user_agent, duration_ms, status_code, active_positions_count, memory_mb, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.timestamp || new Date().toISOString(),
      record.source || "UNKNOWN",
      record.ip || null,
      record.user_agent ? record.user_agent.slice(0, 255) : null,
      record.duration_ms || 0,
      record.status_code || 200,
      record.active_positions_count || 0,
      record.memory_mb || 0,
      record.notes || null
    );

    db.exec(`
      DELETE FROM heartbeat_pings WHERE id NOT IN (
        SELECT id FROM heartbeat_pings ORDER BY id DESC LIMIT 500
      )
    `);
  } catch (err: any) {
    console.warn("[DB Heartbeat] Log error:", err?.message);
  }
}

export function dbGetRecentHeartbeats(limit: number = 30): HeartbeatRecord[] {
  try {
    const db = getDatabase("intraday");
    const rows = db.prepare(`
      SELECT * FROM heartbeat_pings ORDER BY id DESC LIMIT ?
    `).all(limit) as unknown as HeartbeatRecord[];
    return rows;
  } catch (err: any) {
    console.warn("[DB Heartbeat] Fetch error:", err?.message);
    return [];
  }
}

export function dbGetHeartbeatStats(): {
  totalPings: number;
  lastPing: HeartbeatRecord | null;
  pingsLast24Hours: number;
  cronJobOrgPings: number;
  avgDurationMs: number;
} {
  try {
    const db = getDatabase("intraday");
    const countRow: any = db.prepare(`SELECT COUNT(*) as count FROM heartbeat_pings`).get();
    const lastRow = db.prepare(`SELECT * FROM heartbeat_pings ORDER BY id DESC LIMIT 1`).get() as unknown as HeartbeatRecord | undefined;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const last24hRow: any = db.prepare(`SELECT COUNT(*) as count FROM heartbeat_pings WHERE timestamp >= ?`).get(oneDayAgo);
    const cronJobRow: any = db.prepare(`SELECT COUNT(*) as count FROM heartbeat_pings WHERE source LIKE '%cron-job%'`).get();
    const avgRow: any = db.prepare(`SELECT AVG(duration_ms) as avg_dur FROM heartbeat_pings`).get();

    return {
      totalPings: countRow?.count || 0,
      lastPing: lastRow || null,
      pingsLast24Hours: last24hRow?.count || 0,
      cronJobOrgPings: cronJobRow?.count || 0,
      avgDurationMs: +(avgRow?.avg_dur || 0).toFixed(2),
    };
  } catch (err: any) {
    return {
      totalPings: 0,
      lastPing: null,
      pingsLast24Hours: 0,
      cronJobOrgPings: 0,
      avgDurationMs: 0,
    };
  }
}

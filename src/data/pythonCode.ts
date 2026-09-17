export interface CodeFile {
  filename: string;
  language: string;
  description: string;
  role: string;
  code: string;
}

export const PYTHON_SYSTEM_FILES: CodeFile[] = [
  {
    filename: "config.toml",
    language: "toml",
    description: "System credentials, capital limits, and trading mode",
    role: "System Configuration & Environment Variables",
    code: `[credentials]
GEMINI_API_KEY = "your_google_gemini_api_key_here"

[zerodha]
KITE_API_KEY = "your_kite_api_key_here"
KITE_API_SECRET = "your_kite_api_secret_here"
KITE_ACCESS_TOKEN = "daily_access_token_when_going_live"

[system]
PAPER_TRADING_MODE = true
INITIAL_PAPER_CAPITAL = 100000.0   # ₹1,00,000 INR starting paper balance
MAX_RISK_PER_TRADE_PCT = 0.01      # Maximum 1% equity risked per trade (₹1,000)
MAX_POSITION_CONCENTRATION = 0.20  # Max 20% total equity in a single position
DEFAULT_PRODUCT_TYPE = "CNC"       # CNC for swing/delivery, MIS for intraday`
  },
  {
    filename: "schema.py",
    language: "python",
    description: "Pydantic data schemas enforcing strict AI responses",
    role: "Type Enforcement & Structured JSON Contracts",
    code: `from pydantic import BaseModel, Field
from typing import Literal

class TradeHypothesis(BaseModel):
    ticker: str = Field(description="NSE Ticker Symbol without .NS, e.g., RELIANCE, INFY")
    bias: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    confidence: float = Field(ge=0.0, le=1.0, description="Conviction score between 0.0 and 1.0")
    target_price: float = Field(gt=0, description="Target take-profit price in INR")
    stop_loss: float = Field(gt=0, description="Invalidation stop-loss price in INR")
    bull_rationale: str = Field(description="Key technical and fundamental upside drivers")
    bear_counter_thesis: str = Field(description="Downside risks, valuation headwinds, and volatility traps")
    invalidation_criteria: str = Field(description="Explicit condition that invalidates the trade")`
  },
  {
    filename: "data_engine.py",
    language: "python",
    description: "Free Yahoo Finance data ingestion & ATR volatility engine",
    role: "Sensory Data Ingestion & Technical Volatility",
    code: `import yfinance as yf
import pandas as pd

def get_equity_context(ticker: str) -> dict:
    """Fetches free market history from Yahoo Finance for Indian NSE stocks."""
    yf_symbol = f"{ticker}.NS" if not ticker.endswith(".NS") else ticker
    stock = yf.Ticker(yf_symbol)
    
    # 45 days provides enough lookback for a 14-day ATR and 20-day momentum
    df = stock.history(period="45d", interval="1d")
    if df.empty or len(df) < 20:
        raise ValueError(f"Insufficient market data returned for {yf_symbol}")

    # Compute 14-period Average True Range (ATR)
    high = df['High']
    low = df['Low']
    close = df['Close']
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr_14 = float(tr.rolling(window=14).mean().iloc[-1])

    current_price = float(df['Close'].iloc[-1])
    pct_return_20d = float((df['Close'].iloc[-1] / df['Close'].iloc[-20] - 1) * 100)
    sma_20 = float(df['Close'].rolling(window=20).mean().iloc[-1])

    return {
        "ticker": ticker.replace(".NS", ""),
        "current_price": round(current_price, 2),
        "atr_14": round(atr_14, 2),
        "sma_20": round(sma_20, 2),
        "pct_return_20d": round(pct_return_20d, 2),
        "recent_trend": "BULLISH" if current_price > sma_20 else "BEARISH"
    }`
  },
  {
    filename: "memory.py",
    language: "python",
    description: "SQLite database for trade post-mortems and episodic memory",
    role: "Episodic Learning & Historical Reflections",
    code: `import sqlite3

class TradeMemoryDB:
    def __init__(self, db_path="bot_memory.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_db()

    def _init_db(self):
        with self.conn:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS trade_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticker TEXT,
                    bias TEXT,
                    entry_price REAL,
                    exit_price REAL,
                    pnl_realized REAL,
                    lesson TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

    def record_trade(self, ticker: str, bias: str, entry: float, exit_p: float, pnl: float, lesson: str):
        with self.conn:
            self.conn.execute(
                "INSERT INTO trade_history (ticker, bias, entry_price, exit_price, pnl_realized, lesson) VALUES (?, ?, ?, ?, ?, ?)",
                (ticker, bias, entry, exit_p, pnl, lesson)
            )

    def retrieve_past_lessons(self, ticker: str, limit: int = 2) -> list:
        cur = self.conn.cursor()
        cur.execute(
            "SELECT bias, pnl_realized, lesson FROM trade_history WHERE ticker = ? ORDER BY id DESC LIMIT ?",
            (ticker, limit)
        )
        return [{"bias": r[0], "pnl": r[1], "lesson": r[2]} for r in cur.fetchall()]`
  },
  {
    filename: "agent_committee.py",
    language: "python",
    description: "Gemini multi-agent debate (Bull vs. Bear vs. Risk)",
    role: "Cognitive Multi-Agent Debate Layer",
    code: `import os
import sys

# Support Python 3.11+ standard library tomllib with fallback to tomli
if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from schema import TradeHypothesis

def debate_and_synthesize(market_context: dict, past_lessons: list = None) -> TradeHypothesis:
    with open("config.toml", "rb") as f:
        config = tomllib.load(f)

    os.environ["GEMINI_API_KEY"] = config["credentials"]["GEMINI_API_KEY"]
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.1)

    system_prompt = """
    You are an automated Quantitative Risk Committee trading Indian equities (NSE).
    Debate the market context through three opposing personas:
    1. Bullish Analyst: Identifies upward momentum, catalyst support, and trend continuation.
    2. Bearish Analyst: Challenges assumptions, identifies liquidity traps, and flags volatility risks.
    3. Impartial Risk Evaluator: Evaluates the net risk-to-reward ratio.

    Rules:
    - Never place a stop-loss closer than 1.5x ATR from the current market price.
    - If the thesis is ambiguous or the risk is asymmetric to the downside, set bias to NEUTRAL and confidence below 0.50.
    - Strictly emit the required structured output schema.
    """

    user_prompt = f"Market Context:\\n{market_context}\\n"
    if past_lessons:
        user_prompt += f"\\nEpisodic Post-Mortem Memory for this stock:\\n{past_lessons}\\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt)
    ])

    structured_llm = llm.with_structured_output(TradeHypothesis, method="json_schema")
    chain = prompt | structured_llm
    return chain.invoke({})`
  },
  {
    filename: "risk_engine.py",
    language: "python",
    description: "Mathematical position sizing and ruin-prevention guards",
    role: "Deterministic Risk Governor & Capital Preservation",
    code: `from schema import TradeHypothesis

class RiskGovernor:
    def __init__(self, account_equity: float, max_risk_pct: float = 0.01, max_concentration_pct: float = 0.20):
        self.equity = account_equity
        self.risk_pct = max_risk_pct
        self.max_concentration_pct = max_concentration_pct

    def generate_order_ticket(self, hypothesis: TradeHypothesis, current_price: float, atr: float) -> dict:
        # Check conviction threshold
        if hypothesis.bias == "NEUTRAL" or hypothesis.confidence < 0.65:
            return {"status": "REJECTED", "reason": f"Low conviction ({hypothesis.confidence:.2f}) or NEUTRAL bias"}

        # Enforce minimum distance for stop loss against ATR
        risk_per_share = abs(current_price - hypothesis.stop_loss)
        if risk_per_share < (atr * 1.2):
            return {"status": "REJECTED", "reason": f"Stop loss too tight (Risk: ₹{risk_per_share:.2f} < 1.2x ATR: ₹{atr * 1.2:.2f})"}

        # Fractional risk sizing: Loss on stop-out strictly equals max_risk_pct of portfolio
        max_rupee_loss = self.equity * self.risk_pct
        target_shares = int(max_rupee_loss / risk_per_share)

        # Enforce portfolio concentration limit
        max_capital = self.equity * self.max_concentration_pct
        if (target_shares * current_price) > max_capital:
            target_shares = int(max_capital / current_price)

        if target_shares <= 0:
            return {"status": "REJECTED", "reason": "Position size calculated to 0 shares under risk boundaries"}

        return {
            "status": "APPROVED",
            "ticker": hypothesis.ticker,
            "action": "BUY" if hypothesis.bias == "BULLISH" else "SELL",
            "shares": target_shares,
            "entry_price": current_price,
            "stop_loss": hypothesis.stop_loss,
            "target_price": hypothesis.target_price,
            "rupee_risk": round(target_shares * risk_per_share, 2),
            "capital_allocated": round(target_shares * current_price, 2)
        }`
  },
  {
    filename: "broker_interface.py",
    language: "python",
    description: "Paper execution engine & Zerodha Kite live hook",
    role: "Order Execution & Slippage Accounting",
    code: `import sys
if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib

from kiteconnect import KiteConnect

class BrokerInterface:
    def __init__(self, config_path="config.toml"):
        with open(config_path, "rb") as f:
            self.config = tomllib.load(f)
            
        self.paper_mode = self.config["system"]["PAPER_TRADING_MODE"]
        self.paper_balance = float(self.config["system"]["INITIAL_PAPER_CAPITAL"])
        self.paper_positions = []

        if not self.paper_mode:
            self.kite = KiteConnect(api_key=self.config["zerodha"]["KITE_API_KEY"])
            self.kite.set_access_token(self.config["zerodha"]["KITE_ACCESS_TOKEN"])
        else:
            self.kite = None

    def get_account_balance(self) -> float:
        if self.paper_mode:
            return self.paper_balance
        margins = self.kite.margins()
        return float(margins["equity"]["available"]["live_balance"])

    def route_order(self, ticket: dict) -> dict:
        if ticket["status"] != "APPROVED":
            return {"status": "SKIPPED", "reason": ticket.get("reason")}

        # 1. Paper Execution Engine with 0.05% realistic slippage
        if self.paper_mode:
            slippage = ticket["entry_price"] * 0.0005
            fill_price = ticket["entry_price"] + slippage if ticket["action"] == "BUY" else ticket["entry_price"] - slippage
            record = {
                "order_id": f"PAPER_{len(self.paper_positions) + 1}",
                "ticker": ticket["ticker"],
                "action": ticket["action"],
                "shares": ticket["shares"],
                "fill_price": round(fill_price, 2),
                "stop_loss": ticket["stop_loss"],
                "target_price": ticket["target_price"]
            }
            self.paper_positions.append(record)
            print(f"    [PAPER EXECUTION] {record['action']} {record['shares']} shares of {record['ticker']} @ ₹{record['fill_price']:.2f}")
            return record

        # 2. Live Zerodha Kite Execution
        product = self.kite.PRODUCT_CNC if self.config["system"]["DEFAULT_PRODUCT_TYPE"] == "CNC" else self.kite.PRODUCT_MIS
        t_type = self.kite.TRANSACTION_TYPE_BUY if ticket["action"] == "BUY" else self.kite.TRANSACTION_TYPE_SELL
        
        order_id = self.kite.place_order(
            variety=self.kite.VARIETY_REGULAR,
            exchange=self.kite.EXCHANGE_NSE,
            tradingsymbol=ticket["ticker"],
            transaction_type=t_type,
            quantity=ticket["shares"],
            product=product,
            order_type=self.kite.ORDER_TYPE_LIMIT,
            price=ticket["entry_price"]
        )
        print(f"    [LIVE ORDER PLACED] Zerodha Order ID: {order_id}")
        return {"order_id": order_id, "status": "SUBMITTED"}`
  },
  {
    filename: "main.py",
    language: "python",
    description: "Central heartbeat orchestrator and pipeline runner",
    role: "Pipeline Heartbeat & Watchlist Orchestrator",
    code: `import sys
if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib

from data_engine import get_equity_context
from memory import TradeMemoryDB
from agent_committee import debate_and_synthesize
from risk_engine import RiskGovernor
from broker_interface import BrokerInterface

def main():
    print("=========================================================")
    print("   AI BOT ADVANCE: QUANTITATIVE REASONING ENGINE        ")
    print("=========================================================")

    with open("config.toml", "rb") as f:
        config = tomllib.load(f)

    broker = BrokerInterface()
    memory = TradeMemoryDB()
    balance = broker.get_account_balance()
    
    governor = RiskGovernor(
        account_equity=balance,
        max_risk_pct=config["system"]["MAX_RISK_PER_TRADE_PCT"],
        max_concentration_pct=config["system"]["MAX_POSITION_CONCENTRATION"]
    )

    print(f"[*] Mode: {'PAPER TRADING' if broker.paper_mode else 'LIVE EXECUTION'} | Active Equity: ₹{balance:,.2f}")
    
    # Liquid large-cap test universe
    watchlist = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"]

    for ticker in watchlist:
        print(f"\\n[+] Analyzing {ticker}...")
        try:
            # 1. Sensory Layer (Yahoo Finance)
            context = get_equity_context(ticker)
            past_lessons = memory.retrieve_past_lessons(ticker)
            
            # 2. Cognitive Layer (Gemini Reasoning Committee)
            hypothesis = debate_and_synthesize(context, past_lessons)
            print(f"    Verdict: {hypothesis.bias} | Confidence: {hypothesis.confidence * 100:.1f}%")
            print(f"    Thesis: {hypothesis.bull_rationale if hypothesis.bias == 'BULLISH' else hypothesis.bear_counter_thesis}")

            # 3. Deterministic Risk Layer
            ticket = governor.generate_order_ticket(hypothesis, context["current_price"], context["atr_14"])
            print(f"    Risk Check: {ticket['status']} ({ticket.get('reason', 'Approved')})")

            # 4. Execution Layer
            if ticket["status"] == "APPROVED":
                broker.route_order(ticket)

        except Exception as e:
            print(f"    [!] Failed to evaluate {ticker}: {e}")

if __name__ == "__main__":
    main()`
  }
];

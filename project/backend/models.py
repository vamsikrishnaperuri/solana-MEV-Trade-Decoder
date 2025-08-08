from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from enum import Enum

class MEVPattern(str, Enum):
    ARBITRAGE = "arbitrage"
    BACKRUN = "backrun" 
    SANDWICH = "sandwich"
    LIQUIDATION = "liquidation"
    FRONTRUN = "frontrun"
    UNKNOWN = "unknown"

class MEVTransaction(BaseModel):
    signature: str
    timestamp: datetime
    wallet: str
    trade_path: str
    platforms: List[str]
    input_token: str
    output_token: str
    input_amount: float
    output_amount: float
    profit_usdc: float
    is_mev: bool
    pattern: Optional[MEVPattern] = None
    confidence: float = 0.0
    explanation: str = ""
    gas_used: int = 0
    slot: int = 0

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TransactionAnalysis(BaseModel):
    signature: str
    wallet: str
    path: str
    platforms: List[str]
    input_token: str
    output_token: str
    input_amount: float
    output_amount: float
    instructions: List[dict]
    logs: List[str]

class DEXInfo(BaseModel):
    name: str
    program_id: str
    identifier_patterns: List[str]

class TokenInfo(BaseModel):
    symbol: str
    mint: str
    decimals: int
    price_usdc: float = 0.0
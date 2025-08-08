from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
import time
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from contextual_logging import setup_logging

from models import MEVTransaction, TransactionAnalysis, MEVPattern
from solana_client import SolanaClient
from mev_detector import MEVDetector
from transaction_decoder import TransactionDecoder

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="Solana MEV Trade Decoder", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
solana_client = SolanaClient()
mev_detector = MEVDetector()
transaction_decoder = TransactionDecoder()
recent_transactions: List[MEVTransaction] = []
is_monitoring = False

@app.on_event("startup")
async def startup_event():
    """Initialize connections and start background monitoring"""
    await solana_client.initialize()
    logger.info("Solana MEV Decoder started successfully")

@app.get("/")
async def root():
    return {"message": "Solana MEV Trade Decoder API", "status": "running"}

@app.get("/api/transactions", response_model=List[MEVTransaction])
async def get_recent_transactions(
    limit: int = 50,
    is_mev: Optional[bool] = None,
    pattern: Optional[str] = None,
    min_profit: Optional[float] = None
):
    """Get recent transactions with optional filters"""
    filtered_transactions = recent_transactions.copy()
    
    if is_mev is not None:
        filtered_transactions = [tx for tx in filtered_transactions if tx.is_mev == is_mev]
    
    if pattern:
        filtered_transactions = [tx for tx in filtered_transactions if tx.pattern == pattern]
    
    if min_profit is not None:
        filtered_transactions = [tx for tx in filtered_transactions if tx.profit_usdc >= min_profit]
    
    return filtered_transactions[:limit]

@app.get("/api/transactions/{signature}", response_model=MEVTransaction)
async def get_transaction_details(signature: str):
    """Get detailed information about a specific transaction"""
    tx = next((t for t in recent_transactions if t.signature == signature), None)
    if not tx:
        # Try to fetch and analyze the transaction
        try:
            tx = await analyze_transaction(signature)
            if tx:
                recent_transactions.insert(0, tx)
            else:
                raise HTTPException(status_code=404, detail="Transaction not found")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error analyzing transaction: {str(e)}")
    
    return tx

@app.get("/api/stats")
async def get_mev_stats():
    """Get MEV statistics from recent transactions"""
    total_transactions = len(recent_transactions)
    mev_transactions = [tx for tx in recent_transactions if tx.is_mev]
    total_mev = len(mev_transactions)
    
    if total_transactions == 0:
        return {
            "total_transactions": 0,
            "mev_transactions": 0,
            "mev_percentage": 0,
            "total_profit": 0,
            "avg_profit": 0,
            "patterns": {}
        }
    
    total_profit = sum(tx.profit_usdc for tx in mev_transactions)
    avg_profit = total_profit / max(total_mev, 1)
    
    # Pattern breakdown
    patterns = {}
    for tx in mev_transactions:
        if tx.pattern:
            patterns[tx.pattern] = patterns.get(tx.pattern, 0) + 1
    
    return {
        "total_transactions": total_transactions,
        "mev_transactions": total_mev,
        "mev_percentage": (total_mev / total_transactions) * 100,
        "total_profit": round(total_profit, 4),
        "avg_profit": round(avg_profit, 4),
        "patterns": patterns,
        "last_updated": datetime.now().isoformat()
    }

@app.post("/api/monitor/start")
async def start_monitoring(background_tasks: BackgroundTasks):
    """Start real-time MEV monitoring"""
    global is_monitoring
    if not is_monitoring:
        is_monitoring = True
        background_tasks.add_task(monitor_transactions)
        return {"status": "Monitoring started"}
    return {"status": "Already monitoring"}

@app.post("/api/monitor/stop")
async def stop_monitoring():
    """Stop real-time MEV monitoring"""
    global is_monitoring
    is_monitoring = False
    return {"status": "Monitoring stopped"}

@app.get("/api/monitor/status")
async def get_monitoring_status():
    """Get current monitoring status"""
    return {
        "is_monitoring": is_monitoring,
        "recent_transaction_count": len(recent_transactions)
    }

async def monitor_transactions():
    """Background task to monitor and analyze new transactions"""
    logger.info("Starting MEV transaction monitoring")
    
    while is_monitoring:
        try:
            # Get recent signatures from known DEX programs
            signatures = await solana_client.get_recent_signatures()
            
            # Analyze each signature
            for signature in signatures[:10]:  # Limit to prevent overwhelming
                if not any(tx.signature == signature for tx in recent_transactions):
                    try:
                        mev_tx = await analyze_transaction(signature)
                        if mev_tx:
                            recent_transactions.insert(0, mev_tx)
                            # Keep only recent 1000 transactions
                            recent_transactions[:] = recent_transactions[:1000]
                            logger.info(f"Analyzed transaction {signature}: MEV={mev_tx.is_mev}, Profit=${mev_tx.profit_usdc:.4f}")
                    except Exception as e:
                        logger.error(f"Error analyzing transaction {signature}: {e}")
            
            await asyncio.sleep(5)  # Check every 5 seconds
            
        except Exception as e:
            logger.error(f"Error in monitoring loop: {e}")
            await asyncio.sleep(10)
    
    logger.info("MEV monitoring stopped")

async def analyze_transaction(signature: str) -> Optional[MEVTransaction]:
    """Analyze a single transaction for MEV patterns"""
    try:
        # Get transaction details
        tx_data = await solana_client.get_transaction(signature)
        if not tx_data:
            return None
        
        # Decode transaction
        decoded = transaction_decoder.decode_transaction(tx_data)
        if not decoded:
            return None
        
        # Detect MEV patterns
        analysis = mev_detector.analyze_transaction(decoded)
        
        # Create MEV transaction object
        mev_tx = MEVTransaction(
            signature=signature,
            timestamp=datetime.fromtimestamp(tx_data.get('blockTime', time.time())),
            wallet=decoded.get('wallet', ''),
            trade_path=decoded.get('path', ''),
            platforms=decoded.get('platforms', []),
            input_token=decoded.get('input_token', ''),
            output_token=decoded.get('output_token', ''),
            input_amount=decoded.get('input_amount', 0.0),
            output_amount=decoded.get('output_amount', 0.0),
            profit_usdc=analysis.get('profit_usdc', 0.0),
            is_mev=analysis.get('is_mev', False),
            pattern=analysis.get('pattern'),
            confidence=analysis.get('confidence', 0.0),
            explanation=analysis.get('explanation', ''),
            gas_used=tx_data.get('meta', {}).get('fee', 0),
            slot=tx_data.get('slot', 0)
        )
        
        return mev_tx
        
    except Exception as e:
        logger.error(f"Error analyzing transaction {signature}: {e}")
        return None

# WebSocket endpoint for real-time updates
@app.websocket("/ws/transactions")
async def websocket_endpoint(websocket):
    await websocket.accept()
    last_count = 0
    
    try:
        while True:
            current_count = len(recent_transactions)
            if current_count != last_count:
                # Send latest transactions
                latest = recent_transactions[:10]
                await websocket.send_json({
                    "type": "transactions_update",
                    "data": [tx.dict() for tx in latest]
                })
                last_count = current_count
            
            await asyncio.sleep(2)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
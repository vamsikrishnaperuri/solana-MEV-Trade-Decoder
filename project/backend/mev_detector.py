import math
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging

from models import MEVPattern

logger = logging.getLogger(__name__)

class MEVDetector:
    def __init__(self):
        # Minimum profit threshold for MEV detection (in USDC)
        self.min_profit_threshold = 0.01
        
        # Known profitable patterns
        self.mev_patterns = {
            MEVPattern.ARBITRAGE: {
                "min_platforms": 2,
                "min_profit": 0.05,
                "keywords": ["swap", "exchange", "route"]
            },
            MEVPattern.BACKRUN: {
                "timing_window": 30,  # seconds
                "min_profit": 0.01,
                "keywords": ["backrun", "follow"]
            },
            MEVPattern.SANDWICH: {
                "min_profit": 0.1,
                "keywords": ["sandwich", "front", "back"]
            }
        }
    
    def analyze_transaction(self, decoded_tx: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a decoded transaction for MEV patterns"""
        try:
            # Calculate profit in USDC
            profit_usdc = self._calculate_profit_usdc(decoded_tx)
            
            # Detect MEV patterns
            is_mev, pattern, confidence, explanation = self._detect_mev_pattern(decoded_tx, profit_usdc)
            
            return {
                "profit_usdc": profit_usdc,
                "is_mev": is_mev,
                "pattern": pattern,
                "confidence": confidence,
                "explanation": explanation
            }
            
        except Exception as e:
            logger.error(f"Error analyzing transaction for MEV: {e}")
            return {
                "profit_usdc": 0.0,
                "is_mev": False,
                "pattern": None,
                "confidence": 0.0,
                "explanation": f"Analysis error: {str(e)}"
            }
    
    def _calculate_profit_usdc(self, decoded_tx: Dict[str, Any]) -> float:
        """Calculate profit/loss in USDC equivalent"""
        try:
            token_transfers = decoded_tx.get("token_transfers", [])
            
            if not token_transfers:
                return 0.0
            
            # For now, use a simplified calculation
            # In a real implementation, you would fetch current token prices
            
            total_value_change = 0.0
            
            for transfer in token_transfers:
                symbol = transfer["symbol"]
                amount_change = transfer["amount_change"]
                
                # Simple price mapping (in real implementation, fetch from API)
                token_prices = {
                    "SOL": 100.0,    # $100 per SOL
                    "USDC": 1.0,     # $1 per USDC
                    "USDT": 1.0,     # $1 per USDT
                    "mSOL": 110.0,   # Premium over SOL
                    "stSOL": 105.0,  # Premium over SOL
                    "BONK": 0.000015, # Small price
                    "jitoSOL": 105.0
                }
                
                price = token_prices.get(symbol, 1.0)
                value_change = amount_change * price
                total_value_change += value_change
            
            # Return profit (should be positive for profitable trades)
            return round(total_value_change, 6)
            
        except Exception as e:
            logger.error(f"Error calculating profit: {e}")
            return 0.0
    
    def _detect_mev_pattern(self, decoded_tx: Dict[str, Any], profit_usdc: float) -> tuple:
        """Detect specific MEV patterns in the transaction"""
        
        platforms = decoded_tx.get("platforms", [])
        logs = decoded_tx.get("logs", [])
        path = decoded_tx.get("path", "")
        
        # Check for arbitrage
        if self._is_arbitrage(platforms, profit_usdc, path):
            return True, MEVPattern.ARBITRAGE, 0.8, f"Multi-platform arbitrage detected across {', '.join(platforms)} with ${profit_usdc:.4f} profit"
        
        # Check for profitable single-platform trades (potential backruns)
        if self._is_likely_backrun(profit_usdc, platforms, logs):
            return True, MEVPattern.BACKRUN, 0.6, f"Likely backrun trade with ${profit_usdc:.4f} profit"
        
        # Check for sandwich attacks
        if self._is_sandwich_attack(profit_usdc, logs, path):
            return True, MEVPattern.SANDWICH, 0.7, f"Potential sandwich attack with ${profit_usdc:.4f} profit"
        
        # Check for high-profit trades (likely MEV)
        if profit_usdc > 1.0:  # $1+ profit is likely MEV
            return True, MEVPattern.UNKNOWN, 0.5, f"High-profit trade (${profit_usdc:.4f}) - likely MEV"
        
        # Small profitable trades might be MEV
        if profit_usdc > self.min_profit_threshold:
            return True, MEVPattern.UNKNOWN, 0.3, f"Small profitable trade (${profit_usdc:.4f}) - possible MEV"
        
        return False, None, 0.0, "No MEV pattern detected"
    
    def _is_arbitrage(self, platforms: List[str], profit_usdc: float, path: str) -> bool:
        """Check if transaction shows arbitrage patterns"""
        # Multiple platforms and profitable
        if len(platforms) >= 2 and profit_usdc > 0.05:
            return True
        
        # Single platform but complex path (internal arb)
        if len(platforms) == 1 and "→" in path and path.count("→") >= 2 and profit_usdc > 0.02:
            return True
        
        return False
    
    def _is_likely_backrun(self, profit_usdc: float, platforms: List[str], logs: List[str]) -> bool:
        """Check if transaction is likely a backrun"""
        # Profitable single-platform trade
        if profit_usdc > 0.01 and len(platforms) == 1:
            # Check for backrun indicators in logs
            backrun_indicators = ["swap", "exactIn", "exactOut"]
            for indicator in backrun_indicators:
                if any(indicator in log for log in logs):
                    return True
        
        return False
    
    def _is_sandwich_attack(self, profit_usdc: float, logs: List[str], path: str) -> bool:
        """Check if transaction is part of a sandwich attack"""
        # High profit with simple path might be sandwich
        if profit_usdc > 0.1 and "→" in path and path.count("→") == 1:
            return True
        
        # Check logs for sandwich indicators
        sandwich_keywords = ["front", "sandwich", "back"]
        for keyword in sandwich_keywords:
            if any(keyword in log.lower() for log in logs):
                return True
        
        return False
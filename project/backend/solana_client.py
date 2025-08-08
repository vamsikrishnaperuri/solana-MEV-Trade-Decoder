import asyncio
import httpx
import base58
import json
import time
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SolanaClient:
    def __init__(self):
        self.rpc_url = "https://api.mainnet-beta.solana.com"
        self.helius_url = "https://api.helius.xyz/v0"
        self.client = None
        
        # Known DEX program IDs
        self.dex_programs = {
            "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB": "Jupiter V4",
            "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": "Jupiter V6", 
            "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM",
            "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM": "Raydium CPMM",
            "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky": "Meteora",
            "PhoeNiX7VavoDXL4ZMD4fDbBGEz7dhc8EJQ1J4TjTaE": "Phoenix",
            "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb": "Openbook",
            "TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN": "Tensor"
        }
        
    async def initialize(self):
        """Initialize the HTTP client"""
        self.client = httpx.AsyncClient(timeout=30.0)
        logger.info("Solana client initialized")
    
    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
    
    async def get_recent_signatures(self, limit: int = 50) -> List[str]:
        """Get recent transaction signatures from known DEX programs"""
        signatures = []
        
        try:
            # Get signatures from Jupiter (most active)
            jupiter_sigs = await self._get_signatures_for_address(
                "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", 
                limit=limit//2
            )
            signatures.extend(jupiter_sigs)
            
            # Get signatures from Raydium
            raydium_sigs = await self._get_signatures_for_address(
                "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
                limit=limit//2
            )
            signatures.extend(raydium_sigs)
            
            # Remove duplicates and sort by time
            unique_signatures = list(dict.fromkeys(signatures))
            return unique_signatures[:limit]
            
        except Exception as e:
            logger.error(f"Error getting recent signatures: {e}")
            return []
    
    async def _get_signatures_for_address(self, address: str, limit: int = 25) -> List[str]:
        """Get transaction signatures for a specific program address"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getSignaturesForAddress",
            "params": [
                address,
                {
                    "limit": limit,
                    "commitment": "confirmed"
                }
            ]
        }
        
        try:
            response = await self.client.post(self.rpc_url, json=payload)
            result = response.json()
            
            if "result" in result and result["result"]:
                return [tx["signature"] for tx in result["result"]]
            return []
            
        except Exception as e:
            logger.error(f"Error getting signatures for {address}: {e}")
            return []
    
    async def get_transaction(self, signature: str) -> Optional[Dict[Any, Any]]:
        """Get detailed transaction information"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTransaction",
            "params": [
                signature,
                {
                    "encoding": "jsonParsed",
                    "maxSupportedTransactionVersion": 0,
                    "commitment": "confirmed"
                }
            ]
        }
        
        try:
            response = await self.client.post(self.rpc_url, json=payload)
            result = response.json()
            
            if "result" in result and result["result"]:
                return result["result"]
            return None
            
        except Exception as e:
            logger.error(f"Error getting transaction {signature}: {e}")
            return None
    
    async def get_token_price(self, mint: str) -> float:
        """Get token price in USDC using Jupiter API"""
        try:
            url = f"https://price.jup.ag/v4/price?ids={mint}"
            response = await self.client.get(url)
            data = response.json()
            
            if "data" in data and mint in data["data"]:
                return float(data["data"][mint]["price"])
            return 0.0
            
        except Exception as e:
            logger.error(f"Error getting price for {mint}: {e}")
            return 0.0
    
    async def get_multiple_token_prices(self, mints: List[str]) -> Dict[str, float]:
        """Get prices for multiple tokens"""
        if not mints:
            return {}
            
        try:
            mint_params = ",".join(mints)
            url = f"https://price.jup.ag/v4/price?ids={mint_params}"
            response = await self.client.get(url)
            data = response.json()
            
            prices = {}
            if "data" in data:
                for mint in mints:
                    if mint in data["data"]:
                        prices[mint] = float(data["data"][mint]["price"])
                    else:
                        prices[mint] = 0.0
            
            return prices
            
        except Exception as e:
            logger.error(f"Error getting multiple token prices: {e}")
            return {mint: 0.0 for mint in mints}
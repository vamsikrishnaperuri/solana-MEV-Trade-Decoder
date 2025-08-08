import json
import base58
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class TransactionDecoder:
    def __init__(self):
        # Known token mints
        self.token_mints = {
            "So11111111111111111111111111111111111111112": "SOL",
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
            "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
            "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "mSOL",
            "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": "stSOL",
            "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "BONK",
            "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm": "INF",
            "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": "jitoSOL"
        }
        
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
    
    def decode_transaction(self, tx_data: Dict[Any, Any]) -> Optional[Dict[str, Any]]:
        """Decode a Solana transaction and extract trading information"""
        try:
            if not tx_data or "transaction" not in tx_data:
                return None
                
            transaction = tx_data["transaction"]
            meta = tx_data.get("meta", {})
            
            # Get the signer (wallet)
            wallet = ""
            if "message" in transaction and "accountKeys" in transaction["message"]:
                account_keys = transaction["message"]["accountKeys"]
                if account_keys:
                    wallet = account_keys[0]
                    if isinstance(wallet, dict):
                        wallet = wallet.get("pubkey", "")
            
            # Extract instructions
            instructions = []
            if "message" in transaction and "instructions" in transaction["message"]:
                instructions = transaction["message"]["instructions"]
            
            # Extract inner instructions
            inner_instructions = []
            if "innerInstructions" in meta:
                inner_instructions = meta["innerInstructions"]
            
            # Extract logs
            logs = meta.get("logMessages", [])
            
            # Identify DEX platforms used
            platforms = self._identify_platforms(instructions, inner_instructions, logs)
            
            # Extract token transfers
            token_transfers = self._extract_token_transfers(meta)
            
            # Build trade path
            trade_path = self._build_trade_path(token_transfers)
            
            # Get input/output tokens and amounts
            input_token, output_token = self._get_input_output_tokens(token_transfers)
            input_amount, output_amount = self._get_input_output_amounts(token_transfers)
            
            return {
                "wallet": wallet,
                "path": trade_path,
                "platforms": platforms,
                "input_token": input_token,
                "output_token": output_token,
                "input_amount": input_amount,
                "output_amount": output_amount,
                "instructions": instructions,
                "inner_instructions": inner_instructions,
                "logs": logs,
                "token_transfers": token_transfers
            }
            
        except Exception as e:
            logger.error(f"Error decoding transaction: {e}")
            return None
    
    def _identify_platforms(self, instructions: List, inner_instructions: List, logs: List[str]) -> List[str]:
        """Identify which DEX platforms were used in the transaction"""
        platforms = set()
        
        # Check main instructions
        for instruction in instructions:
            program_id = instruction.get("programId", "")
            if program_id in self.dex_programs:
                platforms.add(self.dex_programs[program_id])
        
        # Check inner instructions
        for inner_group in inner_instructions:
            for instruction in inner_group.get("instructions", []):
                program_id = instruction.get("programId", "")
                if program_id in self.dex_programs:
                    platforms.add(self.dex_programs[program_id])
        
        # Check logs for additional platform identification
        for log in logs:
            if "jupiter" in log.lower():
                platforms.add("Jupiter")
            elif "raydium" in log.lower():
                platforms.add("Raydium")
            elif "meteora" in log.lower():
                platforms.add("Meteora")
        
        return list(platforms)
    
    def _extract_token_transfers(self, meta: Dict) -> List[Dict]:
        """Extract token transfer information from transaction meta"""
        transfers = []
        
        # Get pre and post token balances
        pre_balances = meta.get("preTokenBalances", [])
        post_balances = meta.get("postTokenBalances", [])
        
        # Create lookup for pre balances
        pre_lookup = {}
        for balance in pre_balances:
            account = balance.get("accountIndex")
            mint = balance.get("mint")
            amount = float(balance.get("uiTokenAmount", {}).get("uiAmount", 0))
            pre_lookup[f"{account}_{mint}"] = amount
        
        # Calculate transfers from post balances
        for balance in post_balances:
            account = balance.get("accountIndex")
            mint = balance.get("mint")
            post_amount = float(balance.get("uiTokenAmount", {}).get("uiAmount", 0))
            
            key = f"{account}_{mint}"
            pre_amount = pre_lookup.get(key, 0)
            
            if pre_amount != post_amount:
                transfer = {
                    "account": account,
                    "mint": mint,
                    "symbol": self.token_mints.get(mint, mint[:8]),
                    "amount_change": post_amount - pre_amount,
                    "pre_amount": pre_amount,
                    "post_amount": post_amount
                }
                transfers.append(transfer)
        
        return transfers
    
    def _build_trade_path(self, token_transfers: List[Dict]) -> str:
        """Build a human-readable trade path from token transfers"""
        if not token_transfers:
            return ""
        
        # Group transfers by positive and negative amounts
        inputs = []  # negative amounts (spent)
        outputs = []  # positive amounts (received)
        
        for transfer in token_transfers:
            if transfer["amount_change"] < 0:
                inputs.append(transfer)
            elif transfer["amount_change"] > 0:
                outputs.append(transfer)
        
        # Build path string
        path_parts = []
        
        if inputs:
            input_symbols = [t["symbol"] for t in inputs]
            path_parts.extend(input_symbols)
        
        if outputs:
            output_symbols = [t["symbol"] for t in outputs]
            path_parts.extend(output_symbols)
        
        return " → ".join(path_parts) if path_parts else ""
    
    def _get_input_output_tokens(self, token_transfers: List[Dict]) -> tuple:
        """Get the primary input and output tokens"""
        inputs = [t for t in token_transfers if t["amount_change"] < 0]
        outputs = [t for t in token_transfers if t["amount_change"] > 0]
        
        input_token = inputs[0]["symbol"] if inputs else ""
        output_token = outputs[0]["symbol"] if outputs else ""
        
        return input_token, output_token
    
    def _get_input_output_amounts(self, token_transfers: List[Dict]) -> tuple:
        """Get the primary input and output amounts"""
        inputs = [t for t in token_transfers if t["amount_change"] < 0]
        outputs = [t for t in token_transfers if t["amount_change"] > 0]
        
        input_amount = abs(inputs[0]["amount_change"]) if inputs else 0.0
        output_amount = outputs[0]["amount_change"] if outputs else 0.0
        
        return input_amount, output_amount
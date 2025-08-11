# Solana MEV Trade Decoder

A comprehensive tool for detecting, reconstructing, and explaining MEV-related trades on Solana in real-time using public RPCs and APIs.

## Features

**Real-time MEV Detection**: Analyzes transactions from recent blocks to identify MEV patterns
**Multiple MEV Types**: Detects arbitrage, sandwiching, backrunning, and other MEV strategies  
**Profit Analysis**: Calculates estimated PnL in USDC terms
**Multi-DEX Support**: Works with Jupiter, Raydium, Meteora, Orca, Serum, Phoenix and more

## How to Run

**Backend Setup:**
```bash
cd backend 
pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend Setup (in another terminal):**
```bash
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

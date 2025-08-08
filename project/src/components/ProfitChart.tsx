import React, { useEffect, useRef } from 'react';
import { MEVTransaction } from '../types';

interface ProfitChartProps {
  transactions: MEVTransaction[];
}

export const ProfitChart: React.FC<ProfitChartProps> = ({ transactions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !transactions.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const { width, height } = canvas;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Prepare data
    const sortedTx = [...transactions]
      .filter(tx => tx.is_mev && tx.profit_usdc > 0)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-50); // Last 50 profitable transactions

    if (!sortedTx.length) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No profitable MEV transactions', width / 2, height / 2);
      return;
    }

    const maxProfit = Math.max(...sortedTx.map(tx => tx.profit_usdc));
    const minProfit = 0;

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = maxProfit - (maxProfit * i) / 5;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(`$${value.toFixed(2)}`, padding - 10, y + 4);
    }

    // Vertical grid lines
    const timePoints = 5;
    for (let i = 0; i <= timePoints; i++) {
      const x = padding + (chartWidth * i) / timePoints;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw profit line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    sortedTx.forEach((tx, index) => {
      const x = padding + (chartWidth * index) / (sortedTx.length - 1);
      const y = padding + chartHeight - ((tx.profit_usdc - minProfit) / (maxProfit - minProfit)) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw profit points
    ctx.fillStyle = '#3b82f6';
    sortedTx.forEach((tx, index) => {
      const x = padding + (chartWidth * index) / (sortedTx.length - 1);
      const y = padding + chartHeight - ((tx.profit_usdc - minProfit) / (maxProfit - minProfit)) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw cumulative profit area
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    sortedTx.forEach((tx, index) => {
      const x = padding + (chartWidth * index) / (sortedTx.length - 1);
      const y = padding + chartHeight - ((tx.profit_usdc - minProfit) / (maxProfit - minProfit)) * chartHeight;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

  }, [transactions]);

  return (
    <div className="relative h-64">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
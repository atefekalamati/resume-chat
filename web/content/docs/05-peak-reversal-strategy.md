---
title: "Peak-Reversal Short Strategy: Backtesting on Gold & EUR/USD"
slug: peak-reversal-strategy
type: academic                # Data Science Laboratory, Faculty of Mathematical Sciences, Ferdowsi University of Mashhad
status: completed
period: "2025-12 – 2026-01"
role: "Data Analyst (strategy design, backtesting & validation)"
team_size: 4
tech_stack: [Python, pandas, NumPy, Matplotlib, Jupyter]
tags: [data-analysis, time-series, quantitative-finance, backtesting, feature-engineering]
links:
  github: "https://github.com/Data-Science-Laboratory-Projects/Data_Analysis_Project"
featured: true
---

# Peak-Reversal Short Strategy: Backtesting on Gold & EUR/USD

## Summary
A team project at the Data Science Laboratory of Ferdowsi University of Mashhad's Faculty of Mathematical Sciences. The team analyzed intraday price data to find market tops where short trades have an edge. I designed and backtested a rule-based peak-reversal strategy on 21 years of 15-minute gold (XAU/USD) data, about 488,000 candles. I then checked how it held up across recent time windows and on a second market (EUR/USD, 2010–2016).

## Problem / Context
The lab's question was whether local price peaks on the 15-minute chart can be identified well enough to open short positions with a positive expected return. Teammates worked on a machine-learning version that uses a Gradient Boosting model to predict the entry buffer. My part was a transparent, rule-based baseline built on the same idea, plus the tests showing how far that baseline can be trusted.

## My Role & Contributions
- **Strategy design & feature engineering** (`sugML.ipynb`):
  - built the full pipeline from raw OHLCV data to trade results
  - computed ATR(14) volatility
  - detected swing highs (a bar that is the highest within 3 candles on each side)
  - designed an **Exhaustion** feature: upper wick ÷ ATR, which measures buyers failing to hold the high
  - defined **α\***: the largest drop after a peak within the next 48 candles, normalized by ATR and capped at 5, used as the ground-truth measure of reversal strength
- **Backtesting engine:** short entries placed at an ATR-based distance below the peak, with ATR-based stop-loss and take-profit and a 48-candle holding limit. Results are tracked in R-multiples and plotted as an equity curve.
- **Robustness testing** (`test.ipynb`): re-ran the strategy on the last 1 year, 6 months, 3 months, 1 month, 2 weeks and 1 week to see whether performance holds in recent market conditions.
- **Cross-market generalization** (`EURUSD.ipynb`): applied the same pipeline to EUR/USD 15-minute data (2010–2016, 174,734 candles after removing zero-volume bars) and reported win rate year by year.
- Documented every step with explanatory notes in Persian so teammates could reuse the logic. A teammate later adapted the same pipeline for Bitcoin.

## Solution & Architecture
1. **Load & clean:** parse timestamps, sort, cast prices to float, drop dead candles.
2. **Features:** ATR(14), swing-high flag (P1), Exhaustion ratio, α\*.
3. **Signal filter:** peak (P1) + Exhaustion ≥ 0.6 + α\* ≥ 1.0.
4. **Trade simulation:** entry = peak − 0.7·ATR; stop = entry + 1·ATR; target = entry − 1·ATR (1:1 risk/reward); maximum horizon of 48 candles.
5. **Evaluation:** win rate, win/loss counts, R-based equity curve, plus breakdowns by period and by year.

All thresholds are expressed in ATR units rather than prices, so the same rules carry over between instruments with very different price scales (gold at about $2,000 vs EUR/USD at about 1.1).

## Key Features
- Volatility-normalized rules that can be reused across markets
- An interpretable baseline next to the team's ML approach
- Testing across time windows and across instruments
- Clear notebooks with cell-by-cell explanations

## Challenges & How I Solved Them
1. **Challenge:** Comparing instruments with completely different price levels and volatility.  
   **Solution:** Expressed every distance (entry, stop, target, α\*) in ATR units, so the parameters work on both gold and EUR/USD without retuning.
2. **Challenge:** A single high win rate over the full dataset can hide weak recent performance.  
   **Solution:** Wrote a time-window test harness that slices the data by recency and re-runs the backtest on each slice.
3. **Challenge:** Look-ahead bias. Swing-high detection needs 3 future candles to confirm a peak, and α\* is computed from the next 48 candles, so a backtest can accidentally use information that wouldn't exist at trade time.  
   **Solution:** Measured the bias by re-running the backtest with each peak treated as known only after its 3 confirming candles had closed (see "Validation & Limitations"). Removing it fully is listed under next steps.

## Results & Impact
- **Gold (XAU/USD, 2004–2025):** 12,878 simulated trades with a 72.2% win rate in the initial backtest (1:1 risk/reward).
- **Recent windows:** win rate 68.3% (last 1 year), 71.7% (6 months), 66.7% (3 months; only 18 trades). No signals occurred in the last 1 month.
- **EUR/USD (2010–2016):** yearly win rate between 71.9% and 77.4%, with 490–710 trades per year.
- The pipeline was reused by a teammate for Bitcoin data.

## Validation & Limitations
When the peak is treated as known only after the 3 confirming candles have closed (a realistic live-trading assumption), the gold win rate falls to **about 48.5%** over 11,469 trades. With 1:1 risk/reward that means no edge before trading costs. The α\* filter barely changes the result (72.0% without it). Almost all of the inflation comes from entering before the peak is confirmed.

Takeaway: the initial numbers are an upper bound, not live performance. Next steps would be confirmation-delayed entries, walk-forward testing, spread and commission costs, and replacing α\* with a feature that only uses past data.

## What I Learned
- Turning a trading idea into features and a reproducible backtest with pandas/NumPy
- Normalizing by volatility (ATR) so rules generalize across markets
- Why out-of-sample, time-sliced and cross-asset testing matters
- How easily look-ahead bias inflates backtest results, and how to measure it

## FAQ (for the chatbot)
**Q: What was Atefeh's role in this project?**  
A: She designed the rule-based peak-reversal strategy and its features (ATR, swing highs, Exhaustion, α\*), built the backtesting engine, and ran the robustness tests across time windows and on EUR/USD.

**Q: Why use ATR instead of fixed price distances?**  
A: ATR scales with volatility, so the same rules work on gold and on EUR/USD, and in both calm and volatile periods.

**Q: Is the 72% win rate real?**  
A: It comes from the initial backtest. With a realistic delay for confirming peaks, the win rate drops to about 48%, so the strategy has no proven live edge. Finding and measuring that gap is one of the main lessons of the project.

**Q: What would you improve?**  
A: Walk-forward validation, trading costs, entries that wait for the peak to be confirmed, and features that only use past data.

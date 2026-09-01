'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calculator,
  Search,
  User,
  TrendingUp,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { EstimatorResponse, PlayerSearchItem, ModelMetadata } from '@/lib/types';
import { formatEUR, formatNumber } from '@/lib/format';
import { CardSkeleton } from '@/components/ui/Skeleton';

function TransferEstimatorContent() {
  const searchParams = useSearchParams();
  const initialPlayerId = searchParams.get('player_id');

  // Mode: 'player' or 'scenario'
  const [mode, setMode] = useState<'player' | 'scenario'>('player');

  // Player Mode Search State
  const [playerQuery, setPlayerQuery] = useState('');
  const [playerResults, setPlayerResults] = useState<PlayerSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // Scenario Mode Inputs
  const [name, setName] = useState('Custom Player');
  const [age, setAge] = useState<number>(24);
  const [position, setPosition] = useState<string>('Attack');
  const [marketValue, setMarketValue] = useState<number>(25_000_000);
  const [minutes, setMinutes] = useState<number>(2200);
  const [goals, setGoals] = useState<number>(12);
  const [assists, setAssists] = useState<number>(8);
  const [useMarketValue, setUseMarketValue] = useState<boolean>(true);

  // Result & Benchmark State
  const [result, setResult] = useState<EstimatorResponse | null>(null);
  const [modelMeta, setModelMeta] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  // Load Model Metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const meta = await api.getModelMetadata();
        setModelMeta(meta);
      } catch (err) {
        console.error('Failed to load model benchmarks:', err);
      }
    }
    loadMeta();
  }, []);

  // Handle Initial Player ID if passed via URL
  useEffect(() => {
    if (initialPlayerId) {
      loadPlayerEstimator(initialPlayerId);
    } else {
      runScenarioPrediction();
    }
  }, [initialPlayerId]);

  // Search debounce for Player Mode
  useEffect(() => {
    if (playerQuery.trim().length < 2) {
      setPlayerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchPlayers(playerQuery, 5);
        setPlayerResults(res.players);
      } catch (err) {
        console.error('Player search error:', err);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [playerQuery]);

  const loadPlayerEstimator = async (playerId: number | string) => {
    setLoading(true);
    try {
      const data = await api.estimatePlayer(playerId);
      setSelectedPlayer(data);
      setMode('player');

      setName(data.snapshot.player_name || 'Custom Player');
      setAge(data.snapshot.age_at_transfer || 24);
      setPosition(data.snapshot.position || 'Attack');
      setMarketValue(data.snapshot.market_value_before || 15_000_000);
      setMinutes(data.snapshot.prior_minutes || 0);
      setGoals(data.snapshot.prior_goals || 0);
      setAssists(data.snapshot.prior_assists || 0);
      setResult(data);
    } catch (err) {
      console.error('Failed to estimate player:', err);
    } finally {
      setLoading(false);
    }
  };

  const runScenarioPrediction = async () => {
    setLoading(true);
    try {
      const res = await api.predictScenario({
        name,
        age,
        position,
        market_value_before: marketValue,
        prior_minutes: minutes,
        goals,
        assists,
        configuration: useMarketValue ? 'market_aware' : 'performance_only',
      });
      setResult(res);
    } catch (err) {
      console.error('Failed to run scenario predict:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Transfer Estimator</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Estimate what historical data suggests a player&rsquo;s transfer value could be.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-white/5 rounded-xl w-fit">
        <button
          onClick={() => setMode('player')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === 'player'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          👤 Player Mode (Load Real Stats)
        </button>
        <button
          onClick={() => setMode('scenario')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === 'scenario'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚙️ Scenario Mode (What-If Simulation)
        </button>
      </div>

      {/* Main Grid: Inputs vs Prediction Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Mode Inputs */}
        <div className="lg:col-span-5 space-y-6">
          {mode === 'player' ? (
            <div className="glass-card p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Search & Load Player</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search player (e.g. Mbappé, Bellingham, Saka)..."
                  value={playerQuery}
                  onChange={(e) => setPlayerQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                />
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                {searching && (
                  <div className="absolute right-3.5 top-3 w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              {/* Suggestions */}
              {playerResults.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] text-slate-400 font-semibold">Matching Players:</p>
                  {playerResults.map((p) => (
                    <button
                      key={p.player_id}
                      onClick={() => {
                        loadPlayerEstimator(p.player_id);
                        setPlayerResults([]);
                        setPlayerQuery(p.name);
                      }}
                      className="w-full p-2.5 rounded-lg bg-slate-950/60 hover:bg-sky-500/10 border border-white/5 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <User size={16} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.current_club_name} • {p.position}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">
                        {p.market_value_in_eur ? formatEUR(p.market_value_in_eur) : 'N/A'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Loaded Player Summary */}
              {selectedPlayer && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-sky-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{selectedPlayer.snapshot.player_name}</h4>
                    <span className="badge badge-blue">{selectedPlayer.snapshot.position}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                    <div>Age: <strong className="text-white">{selectedPlayer.snapshot.age_at_transfer?.toFixed(1)} yrs</strong></div>
                    <div>Market Val: <strong className="text-white">{selectedPlayer.snapshot.market_value_before ? formatEUR(selectedPlayer.snapshot.market_value_before) : 'N/A'}</strong></div>
                    <div>Prior Mins: <strong className="text-white">{formatNumber(selectedPlayer.snapshot.prior_minutes || 0)}'</strong></div>
                    <div>Prior Goals: <strong className="text-white">{selectedPlayer.snapshot.prior_goals || 0}</strong></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Scenario Mode Form */
            <div className="glass-card p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulation Parameters</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Player / Target Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Age ({age} yrs)</label>
                    <input
                      type="range"
                      min={16}
                      max={38}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full accent-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Position</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="Attack">Attack</option>
                      <option value="Midfield">Midfield</option>
                      <option value="Defender">Defender</option>
                      <option value="Goalkeeper">Goalkeeper</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400 font-semibold">Prior Market Value</span>
                    <span className="text-emerald-400 font-bold">{formatEUR(marketValue)}</span>
                  </div>
                  <input
                    type="range"
                    min={500_000}
                    max={150_000_000}
                    step={500_000}
                    value={marketValue}
                    onChange={(e) => setMarketValue(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Minutes ({minutes})</label>
                    <input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Goals ({goals})</label>
                    <input
                      type="number"
                      value={goals}
                      onChange={(e) => setGoals(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Assists ({assists})</label>
                    <input
                      type="number"
                      value={assists}
                      onChange={(e) => setAssists(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>

                {/* Model Toggle: Market-Aware vs Performance-Only */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Include Market Value Anchor</span>
                    <span className="text-[11px] text-slate-400">
                      {useMarketValue ? 'Model B (Market-Aware)' : 'Model A (Performance-Only)'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={useMarketValue}
                    onChange={(e) => setUseMarketValue(e.target.checked)}
                    className="w-5 h-5 accent-sky-500 rounded"
                  />
                </div>

                <button
                  onClick={runScenarioPrediction}
                  disabled={loading}
                  className="btn-primary w-full py-2.5 text-xs font-bold mt-2"
                >
                  {loading ? 'Evaluating...' : 'Run Valuation'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Prediction Output & Model Explanation */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <>
              {/* Prediction Hero Box */}
              <div className="glass-card p-8 border border-sky-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">BALLON Transfer Estimate</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                    {result.valuation.model_type}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Estimated Transfer Value for <strong className="text-white">{result.snapshot.player_name || 'this player'}</strong></p>
                  <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-400 to-indigo-300">
                    {formatEUR(result.valuation.estimated_transfer_value)}
                  </h2>
                </div>

                <p className="text-[11px] text-slate-400 border-t border-white/5 pt-3">
                  Data quality: <span className="text-white font-semibold">{result.valuation.data_quality.level}</span>. {result.valuation.data_quality.note}
                </p>
              </div>

              {/* Model Explanation: Why does BALLON estimate this value? */}
              <div className="glass-card p-6 border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="text-sky-400" size={18} />
                  <h3 className="text-base font-bold text-white tracking-tight">Why does BALLON estimate this value?</h3>
                </div>
                <p className="text-xs text-slate-400">
                  {result.valuation.model_explanation.note}
                </p>

                <div className="space-y-2.5">
                  {(result.valuation.model_explanation.contributions ?? []).map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{f.feature.replace(/^(num|cat)__/, '')}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Model contribution: {f.contribution_log_fee.toFixed(4)} log-fee units</p>
                      </div>

                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          f.direction === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : f.direction === 'negative'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400 border border-white/10'
                        }`}
                      >
                        {f.direction === 'positive' ? 'Positive' : 'Negative'} impact
                      </span>
                    </div>
                  ))}
                  {result.valuation.model_explanation.contributions.length === 0 && (
                    <p className="text-xs text-slate-400">{result.valuation.model_explanation.method}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card text-center py-20 text-slate-400">
              <p className="font-semibold text-white">Select a player or run a scenario simulation</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Performance & Evaluation Benchmarks */}
      {modelMeta && modelMeta.test_results && (
        <div className="glass-card p-6 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-emerald-400" size={18} />
              <h3 className="text-base font-bold text-white tracking-tight">Model Evaluation Benchmarks</h3>
            </div>
            <span className="text-xs text-slate-400">
              Untouched Chronological Test Set ({modelMeta.sample_counts.test.toLocaleString()} transfers since {modelMeta.periods.test_start})
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table>
              <thead>
                <tr>
                  <th>Model Progression</th>
                  <th>Target Formulation</th>
                  <th>Test MAE</th>
                  <th>Test RMSE</th>
                  <th>Test R²</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(modelMeta.test_results).map(([name, m]) => (
                  <tr key={name} className={name.includes('market_aware') ? 'bg-sky-500/5' : ''}>
                    <td className="font-bold text-white">{name.replace(/_/g, ' ')}</td>
                    <td className="text-xs text-slate-300">
                      {name.includes('baseline') ? 'Raw EUR' : 'log1p(transfer_fee)'}
                    </td>
                    <td className="font-bold text-emerald-400">{formatEUR(m.mae_eur)}</td>
                    <td className="text-slate-300">{formatEUR(m.rmse_eur)}</td>
                    <td className="font-semibold text-sky-400">{m.r2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransferEstimatorPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <TransferEstimatorContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Delete, CornerDownLeft, Volume2, VolumeX, CheckCircle, AlertTriangle, RefreshCw, ShieldAlert, Wallet, TrendingUp, Info } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type ActiveField = 'pan' | 'expiry' | 'cvv' | 'amount';
type TxMode = 'SALE' | 'PRE_AUTH' | 'FORCE_SALE';

export function OldschoolKeypad() {
  const [activeField, setActiveField] = useState<ActiveField>('pan');
  const [txMode, setTxMode] = useState<TxMode>('SALE');
  const [bypass3DS, setBypass3DS] = useState<boolean>(false);
  const [pan, setPan] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [amount, setAmount] = useState('75.00');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>('READY FOR PAN ENTRY');
  const [processing, setProcessing] = useState(false);
  const [txSuccess, setTxSuccess] = useState<boolean | null>(null);
  const [merchantBalance, setMerchantBalance] = useState<number>(0);
  const [showRiskTooltip, setShowRiskTooltip] = useState<boolean>(true);
  const [showPresets, setShowPresets] = useState(false);

  // Test PAN Presets based on Cardlink/Visa/MC specs
  const testPresets = [
    { name: 'Visa Approved', pan: '4016360000000010' },
    { name: 'Visa Decline', pan: '4016360000000028' },
    { name: 'MC Approved', pan: '5188340000000011' },
    { name: 'MC Decline', pan: '5188340000000029' },
  ];

  const applyPreset = (presetPan: string) => {
    setPan(presetPan);
    setExpiry('1228');
    setCvv('123');
    setStatusMessage('PRESET LOADED -> READY TO PROCESS');
    setShowPresets(false);
  };

  useEffect(() => {
    const q = query(collection(db, 'transactions'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let total = 0;
        snapshot.docs.forEach((docItem) => {
          const data = docItem.data();
          if (data.status === 'Completed') {
            const amt = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount || '0');
            if (!isNaN(amt)) total += amt;
          }
        });
        setMerchantBalance(total);
      },
      (err) => {
        console.error('Balance fetch error:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Audio Context synth for key clicks
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (freq = 800, type: OscillatorType = 'sine', duration = 0.04) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + duration);
      }
    } catch {
      // Audio not supported or blocked
    }
  };

  const getCardBrand = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'MASTERCARD';
    if (/^3[47]/.test(cleaned)) return 'AMEX';
    if (/^6(?:011|5)/.test(cleaned)) return 'DISCOVER';
    return number.length > 0 ? 'CARD' : 'UNKNOWN';
  };

  const formatPAN = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const evaluateCardRisk = (cardNumber: string, txAmount: string) => {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 6) return null;

    let score = 18;
    if (cleaned === '4500000000000001') {
      score = 92;
    } else if (cleaned === '4500000000000000' || cleaned === '5100000000000000') {
      score = 8;
    } else if (cleaned.length >= 15) {
      // Luhn check
      let sum = 0;
      let shouldDouble = false;
      for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i), 10);
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      const luhnValid = sum % 10 === 0;
      score = luhnValid ? 14 : 78;
    } else {
      score = 32;
    }

    const numericAmount = parseFloat(txAmount || '0');
    let prediction = 'APPROVAL LIKELY (NOMINAL)';
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (score >= 70) {
      level = 'HIGH';
      prediction = 'DECLINE LIKELY (HIGH RISK)';
    } else if (score >= 30 || numericAmount > 1000) {
      level = 'MEDIUM';
      prediction = numericAmount > 1000 ? '3DS STEP-UP REQUIRED' : 'MODERATE RISK (REVIEW)';
    }

    return { score, level, prediction };
  };

  const riskInfo = evaluateCardRisk(pan, amount);

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleKeyPress = (digit: string) => {
    playBeep(950, 'sine', 0.03);
    setTxSuccess(null);

    if (activeField === 'pan') {
      const newPan = (pan + digit).slice(0, 16);
      setPan(newPan);
      if (newPan.length === 16) {
        setStatusMessage('PAN ENTERED -> NEXT: EXPIRY (MMYY)');
        setTimeout(() => setActiveField('expiry'), 300);
      } else {
        setStatusMessage(`ENTERING PAN (${newPan.length}/16)`);
      }
    } else if (activeField === 'expiry') {
      const newExpiry = (expiry + digit).slice(0, 4);
      setExpiry(newExpiry);
      if (newExpiry.length === 4) {
        setStatusMessage('EXPIRY ENTERED -> NEXT: CVV');
        setTimeout(() => setActiveField('cvv'), 300);
      } else {
        setStatusMessage('ENTERING EXPIRY (MMYY)');
      }
    } else if (activeField === 'cvv') {
      const newCvv = (cvv + digit).slice(0, 4);
      setCvv(newCvv);
      if (newCvv.length === 3 || newCvv.length === 4) {
        setStatusMessage('CVV ENTERED -> READY TO PROCESS');
      } else {
        setStatusMessage('ENTERING CVV');
      }
    } else if (activeField === 'amount') {
      // Amount in cents / digits
      const cleaned = amount.replace(/\D/g, '');
      const newAmountVal = (cleaned + digit).slice(0, 6);
      const parsed = (parseInt(newAmountVal || '0', 10) / 100).toFixed(2);
      setAmount(parsed);
    }
  };

  const handleBackspace = () => {
    playBeep(600, 'triangle', 0.05);
    setTxSuccess(null);

    if (activeField === 'pan') {
      setPan(pan.slice(0, -1));
    } else if (activeField === 'expiry') {
      setExpiry(expiry.slice(0, -1));
    } else if (activeField === 'cvv') {
      setCvv(cvv.slice(0, -1));
    } else if (activeField === 'amount') {
      const cleaned = amount.replace(/\D/g, '').slice(0, -1);
      const parsed = (parseInt(cleaned || '0', 10) / 100).toFixed(2);
      setAmount(parsed);
    }
  };

  const handleClear = () => {
    playBeep(400, 'square', 0.08);
    setPan('');
    setExpiry('');
    setCvv('');
    setActiveField('pan');
    setStatusMessage('CLEARED -> READY FOR PAN ENTRY');
    setTxSuccess(null);
  };

  const handleSubmitPAN = async (overrideMode?: TxMode) => {
    const activeMode = overrideMode || txMode;
    if (pan.length < 15) {
      playBeep(250, 'sawtooth', 0.2);
      setStatusMessage('ERROR: INVALID PAN LENGTH (MIN 15-16)');
      setTxSuccess(false);
      return;
    }

    playBeep(1200, 'sine', 0.1);
    setProcessing(true);
    setStatusMessage(`PROCESSING ${activeMode.replace('_', '-')} ${bypass3DS ? '(3DS BYPASS)' : ''}...`);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const randomArray = new Uint32Array(2);
      crypto.getRandomValues(randomArray);
      const orderId = 'pos_' + randomArray[0].toString(36);
      const authCode = (randomArray[1] % 900000) + 100000;

      const txStatus = activeMode === 'PRE_AUTH' ? 'Pending' : 'Completed';
      const txType =
        activeMode === 'PRE_AUTH'
          ? 'pre_auth'
          : activeMode === 'FORCE_SALE'
          ? 'force_sale'
          : 'payment';
      const webhookEvent =
        activeMode === 'PRE_AUTH'
          ? 'manual_pan_pre_auth'
          : activeMode === 'FORCE_SALE'
          ? 'manual_pan_force_sale'
          : 'manual_pan_capture';

      // Persist transaction
      await addDoc(collection(db, 'transactions'), {
        id: orderId,
        date: new Date().toISOString(),
        amount: parseFloat(amount),
        status: txStatus,
        type: txType,
        threeDSBypass: bypass3DS,
        merchantId: user?.uid || 'pos_manual_terminal',
        entryMethod: 'MANUAL_PAN_KEYPAD',
        cardBrand: getCardBrand(pan),
        maskedPan: `**** **** **** ${pan.slice(-4)}`
      });

      // Log webhook callback
      await addDoc(collection(db, 'webhook_logs'), {
        timestamp: new Date().toISOString(),
        status: 'success',
        event: webhookEvent,
        payload: {
          orderId,
          amount,
          mode: activeMode,
          threeDSBypass: bypass3DS,
          entryMode: 'KEYPAD_MOTO',
          maskedPan: `**** **** **** ${pan.slice(-4)}`,
          cardBrand: getCardBrand(pan)
        },
        merchantId: user?.uid || 'pos_manual_terminal'
      });

      playBeep(1500, 'sine', 0.25);
      setStatusMessage(`${activeMode.replace('_', '-')} OK! AUTH: ${authCode}`);
      setTxSuccess(true);
    } catch (err: any) {
      playBeep(200, 'sawtooth', 0.3);
      setStatusMessage(`DECLINED: ${err.message || 'GATEWAY_REJECT'}`);
      setTxSuccess(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 border-4 border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 font-sans">
      {/* Top Header / Branding */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-mono font-bold tracking-widest text-slate-400">POS-2000</span>
        </div>
        
        {/* Merchant Balance & Test Cards */}
        <div className="flex flex-col gap-1 items-end">
          <div className="bg-slate-800 px-3 py-1 rounded-md border border-slate-700 flex items-center gap-2">
            <Wallet size={12} className="text-cyan-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">BAL:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
              ${merchantBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <select 
            onChange={(e) => e.target.value && applyPreset(e.target.value)}
            className="bg-slate-800 text-[10px] text-emerald-400 font-mono font-bold border border-slate-700 rounded px-1"
          >
            <option value="">LOAD PRESET...</option>
            {testPresets.map(p => <option key={p.pan} value={p.pan}>{p.name}</option>)}
          </select>
        </div>

        <button 
          onClick={() => setSoundEnabled(!soundEnabled)} 
          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
        >
          {soundEnabled ? <Volume2 size={14} className="text-emerald-400" /> : <VolumeX size={14} />}
          <span>{soundEnabled ? 'BEEP ON' : 'MUTE'}</span>
        </button>
      </div>

      {/* Retro Phosphor LCD Screen */}
      <div className="bg-emerald-950 border-2 border-emerald-800 rounded-xl p-4 mb-6 shadow-inner font-mono text-emerald-300 relative overflow-hidden">
        <div className="absolute top-2 right-2 text-[10px] text-emerald-500 font-bold tracking-widest uppercase">
          {getCardBrand(pan)}
        </div>

        <div className="text-[11px] text-emerald-400/80 uppercase tracking-wider mb-1 flex items-center gap-1">
          <span>STATUS:</span>
          <span className="text-emerald-200 font-bold">{statusMessage}</span>
        </div>

        {/* Display Fields */}
        <div className="space-y-2 mt-3">
          {/* PAN Field */}
          <div 
            onClick={() => setActiveField('pan')} 
            className={`p-2 rounded border cursor-pointer transition-all relative ${
              activeField === 'pan' 
                ? 'bg-emerald-900/60 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[9px] uppercase tracking-widest text-emerald-400/70">1. PRIMARY ACCOUNT NUMBER (PAN)</div>
              {riskInfo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRiskTooltip(!showRiskTooltip);
                  }}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    riskInfo.level === 'LOW'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : riskInfo.level === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  <Info size={10} />
                  <span>RISK: {riskInfo.score}/100</span>
                </button>
              )}
            </div>
            <div className="text-base font-bold tracking-widest h-6 flex items-center">
              {formatPAN(pan) || <span className="opacity-30">____ ____ ____ ____</span>}
              {activeField === 'pan' && <span className="animate-ping inline-block w-1.5 h-4 bg-emerald-300 ml-1"></span>}
            </div>
          </div>

          {/* Risk Score, Balance & Outcome Prediction Tooltip */}
          {riskInfo && showRiskTooltip && (
            <div className="p-2.5 rounded-lg bg-slate-900/95 border border-emerald-500/40 shadow-lg text-[11px] space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="flex items-center gap-1 text-slate-400 font-semibold">
                  <ShieldAlert size={12} className={
                    riskInfo.level === 'LOW' ? 'text-emerald-400' :
                    riskInfo.level === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                  } />
                  RISK SCORE:
                </span>
                <span className={`font-bold ${
                  riskInfo.level === 'LOW' ? 'text-emerald-400' :
                  riskInfo.level === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {riskInfo.score}/100 ({riskInfo.level})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-400">
                  <Wallet size={12} className="text-cyan-400" />
                  MERCHANT BALANCE:
                </span>
                <span className="font-bold text-cyan-300 tabular-nums">
                  ${merchantBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-400">
                  <TrendingUp size={12} className="text-emerald-400" />
                  OUTCOME PREDICTION:
                </span>
                <span className={`font-bold ${
                  riskInfo.level === 'LOW' ? 'text-emerald-300' :
                  riskInfo.level === 'MEDIUM' ? 'text-amber-300' : 'text-red-300'
                }`}>
                  {riskInfo.prediction}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {/* Expiry Field */}
            <div 
              onClick={() => setActiveField('expiry')} 
              className={`p-1.5 rounded border cursor-pointer transition-all ${
                activeField === 'expiry' 
                  ? 'bg-emerald-900/60 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                  : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-600'
              }`}
            >
              <div className="text-[8px] uppercase tracking-widest text-emerald-400/70">2. EXPIRY</div>
              <div className="text-sm font-bold tracking-wider h-5 flex items-center">
                {formatExpiry(expiry) || <span className="opacity-30">MM/YY</span>}
                {activeField === 'expiry' && <span className="animate-ping inline-block w-1.5 h-3.5 bg-emerald-300 ml-0.5"></span>}
              </div>
            </div>

            {/* CVV Field */}
            <div 
              onClick={() => setActiveField('cvv')} 
              className={`p-1.5 rounded border cursor-pointer transition-all ${
                activeField === 'cvv' 
                  ? 'bg-emerald-900/60 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                  : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-600'
              }`}
            >
              <div className="text-[8px] uppercase tracking-widest text-emerald-400/70">3. CVV</div>
              <div className="text-sm font-bold tracking-wider h-5 flex items-center">
                {cvv ? '•'.repeat(cvv.length) : <span className="opacity-30">CVC</span>}
                {activeField === 'cvv' && <span className="animate-ping inline-block w-1.5 h-3.5 bg-emerald-300 ml-0.5"></span>}
              </div>
            </div>

            {/* Amount Field */}
            <div 
              onClick={() => setActiveField('amount')} 
              className={`p-1.5 rounded border cursor-pointer transition-all ${
                activeField === 'amount' 
                  ? 'bg-emerald-900/60 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                  : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-600'
              }`}
            >
              <div className="text-[8px] uppercase tracking-widest text-emerald-400/70">4. AMOUNT ($)</div>
              <div className="text-sm font-bold tracking-wider h-5 flex items-center">
                ${amount}
                {activeField === 'amount' && <span className="animate-ping inline-block w-1.5 h-3.5 bg-emerald-300 ml-0.5"></span>}
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicator Bar */}
        {txSuccess !== null && (
          <div className={`mt-3 p-2 rounded text-xs font-bold flex items-center gap-2 ${
            txSuccess ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
          }`}>
            {txSuccess ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
            <span>{txSuccess ? 'TRANSACTION APPROVED & PERSISTED' : 'AUTHORIZATION FAILED'}</span>
          </div>
        )}
      </div>

      {/* Tactile Physical Keypad */}
      <div className="space-y-3">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 active:translate-y-0.5 active:shadow-inner text-slate-100 font-bold text-xl rounded-xl shadow-lg border border-slate-600 flex items-center justify-center transition-all"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-3">
          {['4', '5', '6'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 active:translate-y-0.5 active:shadow-inner text-slate-100 font-bold text-xl rounded-xl shadow-lg border border-slate-600 flex items-center justify-center transition-all"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-3 gap-3">
          {['7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 active:translate-y-0.5 active:shadow-inner text-slate-100 font-bold text-xl rounded-xl shadow-lg border border-slate-600 flex items-center justify-center transition-all"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Row 4: Controls & Zero */}
        <div className="grid grid-cols-3 gap-3">
          {/* Backspace Button */}
          <button
            onClick={handleBackspace}
            className="h-14 bg-amber-800/80 hover:bg-amber-700 active:translate-y-0.5 text-amber-100 font-bold text-sm rounded-xl shadow-lg border border-amber-600/50 flex flex-col items-center justify-center transition-all"
          >
            <Delete size={18} />
            <span className="text-[10px] mt-0.5">BKSP</span>
          </button>

          {/* Zero Button */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 active:translate-y-0.5 text-slate-100 font-bold text-xl rounded-xl shadow-lg border border-slate-600 flex items-center justify-center transition-all"
          >
            0
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="h-14 bg-rose-900/80 hover:bg-rose-800 active:translate-y-0.5 text-rose-100 font-bold text-xs rounded-xl shadow-lg border border-rose-700/50 flex flex-col items-center justify-center transition-all"
          >
            <RefreshCw size={16} />
            <span className="text-[10px] mt-0.5">CLEAR</span>
          </button>
        </div>

        {/* Function Toggles: 3DS Bypass, Sale, Pre-Auth, Force Sale */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              playBeep(1050, 'sine', 0.04);
              setBypass3DS(!bypass3DS);
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all flex flex-col items-center justify-center ${
              bypass3DS
                ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.25)]'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <span>3DS BYPASS</span>
            <span className="text-[9px] mt-0.5">{bypass3DS ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playBeep(900, 'sine', 0.04);
              setTxMode('SALE');
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all flex flex-col items-center justify-center ${
              txMode === 'SALE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <span>SALE</span>
            <span className="text-[9px] mt-0.5">CAPTURE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playBeep(900, 'sine', 0.04);
              setTxMode('PRE_AUTH');
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all flex flex-col items-center justify-center ${
              txMode === 'PRE_AUTH'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <span>PRE-AUTH</span>
            <span className="text-[9px] mt-0.5">HOLD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playBeep(900, 'sine', 0.04);
              setTxMode('FORCE_SALE');
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all flex flex-col items-center justify-center ${
              txMode === 'FORCE_SALE'
                ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <span>FORCE</span>
            <span className="text-[9px] mt-0.5">SALE</span>
          </button>
        </div>

        {/* Main Processing Enter Key */}
        <button
          onClick={() => handleSubmitPAN()}
          disabled={processing}
          className="w-full h-16 mt-2 bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 active:translate-y-0.5 text-white font-bold text-base rounded-2xl shadow-xl border-2 border-emerald-400 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="animate-spin w-5 h-5" />
              AUTHORIZING...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CornerDownLeft size={20} />
              ENTER / PROCESS {txMode.replace('_', '-')}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

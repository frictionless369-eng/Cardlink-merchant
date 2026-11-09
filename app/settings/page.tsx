'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import { 
  Shield, 
  Webhook, 
  CreditCard, 
  Database, 
  Globe, 
  CheckCircle2, 
  Save, 
  Building2, 
  ArrowRightLeft, 
  AlertTriangle,
  Play,
  Info
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function SettingsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cardlink-merchant-gilt.vercel.app';

  const [webhookConfig, setWebhookConfig] = useState({
    httpMethod: 'POST',
    contentType: 'application/json',
    verifyDigest: true,
    retryOnFailure: true,
    maxRetries: 3,
    timeoutSeconds: 10,
    enablePaymentAdvice: true,
    enableCaptureAdvice: true,
    enableCancelAdvice: true,
  });

  // Payout Recipient State (Card or Bank)
  const [recipientType, setRecipientType] = useState<'card' | 'bank'>('bank');
  const [recipientData, setRecipientData] = useState({
    bankName: 'Eurobank Greece S.A.',
    accountHolder: 'Luxury Resort & Spa Merchant Ledger',
    accountNumber: 'GR16026000000001234567890',
    routingOrSwift: 'ERBKGRAA',
    cardHolderName: 'Eleni Papadopoulou',
    cardNumber: '4532 7512 8901 3412',
    cardExpiry: '12/28',
    currency: 'EUR',
  });

  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  // Cardlink Check Capabilities State
  const [checkingApi, setCheckingApi] = useState(false);
  const [apiCheckResult, setApiCheckResult] = useState<any | null>(null);

  // Keytool & Certificates Promotion State
  const [certificates, setCertificates] = useState<any[]>([]);
  const [certNetwork, setCertNetwork] = useState<'VISA_DIRECT' | 'MASTERCARD_SEND'>('VISA_DIRECT');
  const [certAlias, setCertAlias] = useState('visa-direct-prod-2026');
  const [certSubjectCn, setCertSubjectCn] = useState('cardlink-resort-prod-client');
  const [certOrg, setCertOrg] = useState('Luxury Resort & Spa Merchant');
  const [certCountry, setCertCountry] = useState('GR');
  const [keytoolOutput, setKeytoolOutput] = useState<any | null>(null);
  const [promotingCert, setPromotingCert] = useState(false);
  const [certSuccessBanner, setCertSuccessBanner] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/keytool');
      const json = await res.json();
      if (json.certificates) {
        setCertificates(json.certificates);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'merchants', 'default_merchant'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.webhookConfig) {
          setWebhookConfig((prev) => ({ ...prev, ...data.webhookConfig }));
        }
        if (data.payoutRecipient) {
          if (data.payoutRecipient.type) setRecipientType(data.payoutRecipient.type);
          setRecipientData((prev) => ({ ...prev, ...data.payoutRecipient }));
        }
        if (data.keytoolCertificates) {
          setCertificates(data.keytoolCertificates);
        }
      }
    });

    return () => unsub();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedBanner(false);
    try {
      await setDoc(
        doc(db, 'merchants', 'default_merchant'),
        {
          id: 'default_merchant',
          cardlinkMerchantId: '9000012429',
          webhookConfig,
          payoutRecipient: {
            type: recipientType,
            ...recipientData,
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const runCardlinkCapabilitiesCheck = async () => {
    setCheckingApi(true);
    setApiCheckResult(null);
    try {
      const res = await fetch('/api/cardlink/check-capabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType,
          recipientData,
          amount: '250.00',
          currency: recipientData.currency,
        }),
      });
      const data = await res.json();
      setApiCheckResult(data);
    } catch (err: any) {
      setApiCheckResult({
        error: 'Failed to contact Cardlink capability check API',
        details: err.message,
      });
    } finally {
      setCheckingApi(false);
    }
  };

  const handleGenerateKeytoolCsr = async () => {
    try {
      const res = await fetch('/api/keytool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_csr',
          network: certNetwork,
          alias: certAlias,
          subjectCn: certSubjectCn,
          organization: certOrg,
          country: certCountry,
        }),
      });
      const data = await res.json();
      setKeytoolOutput(data);
    } catch (err: any) {
      console.error('Error generating keytool commands:', err);
    }
  };

  const handlePromoteCertificate = async () => {
    setPromotingCert(true);
    setCertSuccessBanner(null);
    try {
      const res = await fetch('/api/keytool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'promote',
          network: certNetwork,
          alias: certAlias,
          subjectCn: certSubjectCn,
          organization: certOrg,
          country: certCountry,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCertSuccessBanner(data.message);
        await fetchCertificates();
      }
    } catch (err: any) {
      console.error('Error promoting certificate:', err);
    } finally {
      setPromotingCert(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <TopBar title="Settings & Payouts" />
        <main className="p-8 max-w-4xl">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">
                Merchant Settings, Recipient Payouts &amp; Cardlink Verification
              </h1>
              <p className="text-xs text-slate-500">
                Configure webhook handling, recipient bank/card details, and test Cardlink gateway funds transfer capabilities
              </p>
            </div>
            {savedBanner && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Saved to Database
              </span>
            )}
          </div>

          <div className="space-y-6">
            {/* Recipient Card / Bank Account for Payouts */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Building2 className="w-5 h-5 text-slate-700" />
                  Payout Recipient: Bank Account or Card
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Settlement Destination
                </span>
              </div>

              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg max-w-xs mb-5">
                <button
                  type="button"
                  onClick={() => setRecipientType('bank')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                    recipientType === 'bank'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bank Account (IBAN)
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('card')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                    recipientType === 'card'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Recipient Card (PAN)
                </button>
              </div>

              {recipientType === 'bank' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={recipientData.bankName}
                      onChange={(e) => setRecipientData({ ...recipientData, bankName: e.target.value })}
                      placeholder="e.g. Eurobank Greece, Alpha Bank"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Holder Full Name / Entity</label>
                    <input
                      type="text"
                      value={recipientData.accountHolder}
                      onChange={(e) => setRecipientData({ ...recipientData, accountHolder: e.target.value })}
                      placeholder="Legal Entity or Beneficiary Name"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IBAN / Account Number</label>
                    <input
                      type="text"
                      value={recipientData.accountNumber}
                      onChange={(e) => setRecipientData({ ...recipientData, accountNumber: e.target.value })}
                      placeholder="GR16 0260 0000 0001 2345 6789 0"
                      className="w-full p-2.5 font-mono border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SWIFT / BIC / Routing Code</label>
                    <input
                      type="text"
                      value={recipientData.routingOrSwift}
                      onChange={(e) => setRecipientData({ ...recipientData, routingOrSwift: e.target.value })}
                      placeholder="e.g. ERBKGRAA"
                      className="w-full p-2.5 font-mono border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cardholder Full Name</label>
                    <input
                      type="text"
                      value={recipientData.cardHolderName}
                      onChange={(e) => setRecipientData({ ...recipientData, cardHolderName: e.target.value })}
                      placeholder="As printed on card"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Recipient Card Number (PAN)</label>
                    <input
                      type="text"
                      value={recipientData.cardNumber}
                      onChange={(e) => setRecipientData({ ...recipientData, cardNumber: e.target.value })}
                      placeholder="16-digit debit/credit card"
                      className="w-full p-2.5 font-mono border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expiration (MM/YY)</label>
                    <input
                      type="text"
                      value={recipientData.cardExpiry}
                      onChange={(e) => setRecipientData({ ...recipientData, cardExpiry: e.target.value })}
                      placeholder="12/28"
                      className="w-full p-2.5 font-mono border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Settlement Currency</label>
                    <select
                      value={recipientData.currency}
                      onChange={(e) => setRecipientData({ ...recipientData, currency: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="EUR">EUR (€) - Cardlink Default</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Recipient Details'}</span>
                </button>

                <button
                  type="button"
                  onClick={runCardlinkCapabilitiesCheck}
                  disabled={checkingApi}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{checkingApi ? 'Checking Cardlink API...' : 'Check Cardlink Funds Transfer'}</span>
                </button>
              </div>
            </div>

            {/* Live Cardlink API Check Results */}
            {apiCheckResult && (
              <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-6 shadow-md font-mono text-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="font-bold text-cyan-300 text-sm tracking-wide">
                      CARDLINK API CAPABILITY &amp; FUNDS TRANSFER DIAGNOSTIC
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{apiCheckResult.latencyMs}ms latency</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Merchant Gateway (MID)</div>
                    <div className="text-white font-bold">{apiCheckResult.merchantId} (Active)</div>
                    <div className="text-slate-400 text-[11px] truncate">{apiCheckResult.primaryEndpoint}</div>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Endpoint Connectivity</div>
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <span>MPI Hosted: {apiCheckResult.endpointAccessibility?.mpiShopHandler}</span>
                    </div>
                    <div className="text-emerald-400 font-semibold">
                      <span>XML API: {apiCheckResult.endpointAccessibility?.xmlPayVpos}</span>
                    </div>
                  </div>
                </div>

                {/* API Capabilities Matrix */}
                <div className="space-y-2">
                  <div className="text-slate-300 font-bold text-xs uppercase tracking-wider">
                    Official Cardlink API Methods &amp; Protocol Support
                  </div>
                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                    {apiCheckResult.supportedCapabilities?.map((cap: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex items-start justify-between gap-3 text-[11px]">
                        <div>
                          <div className="font-semibold text-slate-200">{cap.operation}</div>
                          {cap.endpoint && (
                            <div className="text-[10px] text-slate-400 font-mono">Endpoint: /vpos/{cap.endpoint}</div>
                          )}
                          {cap.reason && (
                            <div className="text-[10px] text-amber-400/90 mt-0.5">{cap.reason}</div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cap.supported
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {cap.supported ? 'SUPPORTED' : 'NOT SUPPORTED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Outbound Funds Transfer Diagnostic */}
                <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Cardlink Check API Result: Funds Transfer (Card-to-Card / Bank Push)</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Cardlink is an <strong>acquiring payment gateway</strong> (now Worldline Greece). Its APIs are engineered for capturing customer payments, recurring subscriptions, and authorizations. Cardlink <strong>does not provide an outbound Card-to-Card (OCT) or Bank-to-Bank push API</strong>.
                  </p>
                  <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-400">Target Recipient: </span>
                      <span className="text-cyan-300 font-bold">{apiCheckResult.simulatedRecipientCheck?.recipientIdentifier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Gateway Protocol Response: </span>
                      <span className="text-red-400 font-bold">
                        {apiCheckResult.simulatedRecipientCheck?.gatewayErrorResponse?.code}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      {apiCheckResult.simulatedRecipientCheck?.gatewayErrorResponse?.message}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cardlink Webhook Configuration Options */}
            <form onSubmit={handleSaveConfig} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Webhook className="w-5 h-5 text-slate-700" />
                  Cardlink Webhook Specifications &amp; Delivery Options
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HTTP Callback Method</label>
                  <select
                    value={webhookConfig.httpMethod}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, httpMethod: e.target.value })}
                    className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    <option value="POST">POST (Cardlink Standard)</option>
                    <option value="GET">GET (Query String)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payload Content-Type</label>
                  <select
                    value={webhookConfig.contentType}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, contentType: e.target.value })}
                    className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    <option value="application/json">application/json</option>
                    <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Retry Attempts</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={webhookConfig.maxRetries}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, maxRetries: parseInt(e.target.value || '0', 10) })}
                    className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Callback Timeout (Seconds)</label>
                  <input
                    type="number"
                    min={3}
                    max={30}
                    value={webhookConfig.timeoutSeconds}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, timeoutSeconds: parseInt(e.target.value || '10', 10) })}
                    className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-5 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-700">Enforce HMAC-SHA256 Digest Verification</span>
                  <input
                    type="checkbox"
                    checked={webhookConfig.verifyDigest}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, verifyDigest: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-700">Enable Background Payment Advice Webhook</span>
                  <input
                    type="checkbox"
                    checked={webhookConfig.enablePaymentAdvice}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, enablePaymentAdvice: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-700">Enable Background Capture Advice Webhook</span>
                  <input
                    type="checkbox"
                    checked={webhookConfig.enableCaptureAdvice}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, enableCaptureAdvice: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-700">Enable Background Cancel Advice Webhook</span>
                  <input
                    type="checkbox"
                    checked={webhookConfig.enableCancelAdvice}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, enableCancelAdvice: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Webhook Configuration'}</span>
              </button>
            </form>

            {/* Keytool Certificate Promotion Manager for Visa Direct & Mastercard Send */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    Keytool &amp; mTLS Certificate Promotion (Visa &amp; Mastercard Production)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate keystores, CSRs, and promote mutual-TLS client certificates to production
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                  Two-Way mTLS Keytool
                </span>
              </div>

              {certSuccessBanner && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{certSuccessBanner}</span>
                </div>
              )}

              {/* Form to Generate CSR or Promote Certificate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Payout Rail</label>
                  <select
                    value={certNetwork}
                    onChange={(e: any) => setCertNetwork(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-semibold"
                  >
                    <option value="VISA_DIRECT">Visa Direct (Two-Way SSL / OCT)</option>
                    <option value="MASTERCARD_SEND">Mastercard Send (mTLS / OpenAPI)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Keystore Alias</label>
                  <input
                    type="text"
                    value={certAlias}
                    onChange={(e) => setCertAlias(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                    placeholder="visa-direct-prod-client"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Common Name (CN)</label>
                  <input
                    type="text"
                    value={certSubjectCn}
                    onChange={(e) => setCertSubjectCn(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                    placeholder="cardlink-resort-prod-client"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization (O) &amp; Country</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={certOrg}
                      onChange={(e) => setCertOrg(e.target.value)}
                      className="w-3/4 p-2.5 border border-slate-300 rounded-lg text-slate-900"
                      placeholder="Luxury Resort & Spa Merchant"
                    />
                    <input
                      type="text"
                      value={certCountry}
                      onChange={(e) => setCertCountry(e.target.value)}
                      className="w-1/4 p-2.5 border border-slate-300 rounded-lg font-mono text-center text-slate-900"
                      placeholder="GR"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGenerateKeytoolCsr}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Generate Keytool CSR Command
                </button>

                <button
                  type="button"
                  onClick={handlePromoteCertificate}
                  disabled={promotingCert}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {promotingCert ? 'Promoting Certificate...' : 'Promote to Production Network'}
                </button>
              </div>

              {/* Keytool Output Box */}
              {keytoolOutput && (
                <div className="p-4 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                  <div className="text-cyan-400 font-bold uppercase text-[11px]">Keytool Terminal Commands:</div>
                  <pre className="p-2.5 bg-slate-900 rounded overflow-x-auto text-[11px] text-emerald-400 whitespace-pre-wrap">
                    # 1. Generate 2048-bit RSA Keypair:
                    {keytoolOutput.commands?.step1_generate_keypair}

                    # 2. Export Certificate Signing Request (CSR):
                    {keytoolOutput.commands?.step2_export_csr}

                    # 3. Import Signed Production Certificate:
                    {keytoolOutput.commands?.step3_import_signed_cert}
                  </pre>
                  <p className="text-slate-400 text-[10px]">{keytoolOutput.instructions}</p>
                </div>
              )}

              {/* Active Installed Production Certificates */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Active Promoted Certificates ({certificates.length})
                </div>
                <div className="space-y-2.5">
                  {certificates.map((cert: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {cert.alias}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          PROD mTLS
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] font-mono truncate">Subject: {cert.subject}</div>
                      <div className="text-slate-500 text-[10px] font-mono truncate">Issuer: {cert.issuer}</div>
                      <div className="text-slate-500 text-[10px] font-mono flex items-center justify-between">
                        <span>Serial: {cert.serialNumber}</span>
                        <span>SHA-256: {cert.fingerprintSha256?.slice(0, 23)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gateway Configuration Reference */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
                <CreditCard className="w-5 h-5 text-slate-700" />
                Cardlink Gateway Parameters
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Merchant ID (MID)</span>
                  <span className="font-mono font-bold text-slate-900">9000012429</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Primary Endpoint (MPI)</span>
                  <span className="font-mono text-xs text-slate-800">https://eurocommerce-test.cardlink.gr/vpos/shophandlermpi</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Secondary XML API</span>
                  <span className="font-mono text-xs text-slate-800">https://eurocommerce-test.cardlink.gr/vpos/xmlpayvpos</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Digest Method</span>
                  <span className="font-mono text-xs text-slate-800">SHA-256 (Base64 Encoded)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Shared Secret Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    <Shield className="w-3.5 h-3.5" /> Cardlink1 (Active)
                  </span>
                </div>
              </div>
            </div>

            {/* Webhook URLs Reference */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
                <Webhook className="w-5 h-5 text-slate-700" />
                Registered Cardlink Webhook Endpoints
              </h2>
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="font-semibold text-slate-700">Payment Webhook</div>
                  <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/payment</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="font-semibold text-slate-700">Capture Webhook</div>
                  <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/capture</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="font-semibold text-slate-700">Cancel Webhook</div>
                  <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/cancel</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

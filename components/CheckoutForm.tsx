'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Truck, ReceiptText, Calculator, ExternalLink } from 'lucide-react';
import { OldschoolKeypad } from './dashboard/OldschoolKeypad';

export default function CheckoutForm() {
  const [paymentMode, setPaymentMode] = useState<'redirect' | 'keypad'>('redirect');
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'frictionless369@gmail.com',
    address: '123 Athens Street, Greece',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMode === 'keypad') return; // Keypad handles its own submit

    const response = await fetch('/api/cardlink', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-merchant-id': '9000012429'
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">One-Page Checkout</h1>
          <p className="text-xs text-slate-500">Cardlink Payment Gateway & POS Virtual Terminal Integration</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setPaymentMode('redirect')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              paymentMode === 'redirect'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ExternalLink size={14} />
            <span>Cardlink Hosted</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode('keypad')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              paymentMode === 'keypad'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator size={14} />
            <span>Tactile POS Keypad (PAN)</span>
          </button>
        </div>
      </div>

      {paymentMode === 'keypad' ? (
        <div className="py-2">
          <OldschoolKeypad />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Shipping & Customer Details */}
            <div className="space-y-6">
              <section>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-4 text-slate-900">
                  <Truck size={18} /> Customer Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                    <input 
                      name="name" 
                      value={formData.name}
                      placeholder="Full Name" 
                      className="w-full p-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 bg-white" 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
                    <input 
                      name="email" 
                      value={formData.email}
                      placeholder="Email" 
                      type="email" 
                      className="w-full p-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 bg-white" 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Shipping Address</label>
                    <input 
                      name="address" 
                      value={formData.address}
                      placeholder="Shipping Address" 
                      className="w-full p-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 bg-white" 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-2 text-slate-900">
                  <CreditCard size={18} /> Cardlink Gateway
                </h2>
                <p className="text-xs text-slate-500">
                  You will be securely redirected to Eurobank / Cardlink hosted payment portal.
                </p>
              </section>
            </div>

            {/* Order Summary */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-4 text-slate-900">
                  <ReceiptText size={18} /> Order Summary
                </h2>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-slate-600"><span>Merchant License</span><span>$50.00</span></div>
                  <div className="flex justify-between text-slate-600"><span>Gateway Setup Fee</span><span>$25.00</span></div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-3 text-base">
                    <span>Total Due</span>
                    <span>$75.00</span>
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-slate-900 text-white p-3.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
              >
                Proceed to Cardlink Payment
              </button>
            </div>
          </div>
        </form>
      )}
    </motion.div>
  );
}

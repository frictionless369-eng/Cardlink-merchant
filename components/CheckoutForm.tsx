'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Truck, ReceiptText } from 'lucide-react';

export default function CheckoutForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/cardlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white border border-slate-200 rounded-lg shadow-sm"
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping & Payment Fields */}
        <div className="space-y-6">
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-slate-900">
              <Truck size={20} /> Shipping Details
            </h2>
            <div className="space-y-4">
              <input name="name" placeholder="Full Name" className="w-full p-2 border rounded" onChange={handleInputChange} />
              <input name="email" placeholder="Email" type="email" className="w-full p-2 border rounded" onChange={handleInputChange} />
              <input name="address" placeholder="Shipping Address" className="w-full p-2 border rounded" onChange={handleInputChange} />
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-slate-900">
              <CreditCard size={20} /> Payment
            </h2>
            <p className="text-sm text-slate-500">You will be redirected to Cardlink to securely complete your payment.</p>
          </section>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-slate-900">
            <ReceiptText size={20} /> Order Summary
          </h2>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between"><span>Product 1</span><span>$50.00</span></div>
            <div className="flex justify-between"><span>Product 2</span><span>$25.00</span></div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total</span><span>$75.00</span></div>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-lg hover:bg-slate-800 transition-colors">
            Pay with Cardlink
          </button>
        </div>
      </div>
    </motion.form>
  );
}

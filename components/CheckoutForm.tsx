'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Truck, ReceiptText, Calculator, ExternalLink, BedDouble, Check } from 'lucide-react';
import Image from 'next/image';
import { OldschoolKeypad } from './dashboard/OldschoolKeypad';

interface RoomOption {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

const ROOMS: RoomOption[] = [
  {
    id: 'deluxe',
    name: 'Deluxe Sea View Suite',
    price: 120,
    image: '/images/deluxe_suite_room.jpg',
    description: 'King bed with panoramic ocean view balcony and oak wood paneling.',
  },
  {
    id: 'villa',
    name: 'Private Oceanfront Villa',
    price: 250,
    image: '/images/ocean_villa_room.jpg',
    description: 'Exclusive Mediterranean terrace with private infinity pool and sunset view.',
  },
  {
    id: 'lounge',
    name: 'Executive Lounge Suite',
    price: 180,
    image: '/images/executive_lounge_room.jpg',
    description: 'Sleek luxury lounge with leather armchairs and city skyline glass view.',
  },
];

export default function CheckoutForm() {
  const [paymentMode, setPaymentMode] = useState<'redirect' | 'keypad'>('redirect');
  const [selectedRoom, setSelectedRoom] = useState<RoomOption>(ROOMS[0]);
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'frictionless369@gmail.com',
    address: '123 Athens Riviera, Greece',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMode === 'keypad') return;

    const response = await fetch('/api/cardlink', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-merchant-id': '9000012429'
      },
      body: JSON.stringify({
        ...formData,
        amount: selectedRoom.price,
        orderDesc: `Booking: ${selectedRoom.name}`,
      }),
    });
    const result = await response.json();
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Background Banner */}
      <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
        <Image 
          src="/images/hero_background.jpg" 
          alt="Luxury Resort Hero Background" 
          fill 
          className="object-cover"
          priority
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-transparent flex flex-col justify-end p-6 text-white">
          <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-1">
            Cardlink One-Page Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Luxury Resort &amp; Hotel Reservation</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Select your room tier and proceed with Cardlink Hosted Gateway or Tactile Virtual POS Keypad.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Reservation &amp; Payment</h2>
            <p className="text-xs text-slate-500">Secure real-time transaction processing</p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPaymentMode('redirect')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                paymentMode === 'keypad'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator size={14} />
              <span>Tactile POS Keypad</span>
            </button>
          </div>
        </div>

        {paymentMode === 'keypad' ? (
          <div className="py-2">
            <OldschoolKeypad />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Room Showcase Selection */}
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-slate-900">
                <BedDouble size={18} className="text-slate-700" /> Select Room &amp; Suite
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ROOMS.map((room) => {
                  const isSelected = selectedRoom.id === room.id;
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`group cursor-pointer rounded-xl border transition-all overflow-hidden relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="relative w-full h-36">
                        <Image
                          src={room.image}
                          alt={room.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white p-1 rounded-full shadow-sm">
                            <Check size={14} />
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-bold text-sm text-slate-900">{room.name}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {room.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-medium">Rate per night</span>
                          <span className="font-mono font-bold text-sm text-slate-900">${room.price}.00</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
              {/* Shipping & Customer Details */}
              <div className="space-y-6">
                <section>
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-slate-900">
                    <Truck size={18} /> Guest Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <input 
                        name="name" 
                        value={formData.name}
                        placeholder="Full Name" 
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white" 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                      <input 
                        name="email" 
                        value={formData.email}
                        placeholder="Email" 
                        type="email" 
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white" 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
                      <input 
                        name="address" 
                        value={formData.address}
                        placeholder="Shipping Address" 
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white" 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-1 text-slate-900">
                    <CreditCard size={18} /> Cardlink Gateway
                  </h3>
                  <p className="text-xs text-slate-500">
                    You will be redirected to Eurobank / Cardlink hosted payment portal.
                  </p>
                </section>
              </div>

              {/* Order Summary */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-slate-900">
                    <ReceiptText size={18} /> Booking Summary
                  </h3>
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between text-slate-600">
                      <span>{selectedRoom.name}</span>
                      <span className="font-mono">${selectedRoom.price}.00</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Cardlink Processing &amp; Taxes</span>
                      <span className="font-mono">$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-3 text-base">
                      <span>Total Charge</span>
                      <span className="font-mono">${selectedRoom.price}.00</span>
                    </div>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-slate-900 text-white p-3.5 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Pay ${selectedRoom.price}.00 with Cardlink
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Truck, ReceiptText, Calculator, ExternalLink, BedDouble, Check, Database } from 'lucide-react';
import Image from 'next/image';
import { OldschoolKeypad } from './dashboard/OldschoolKeypad';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface RoomOption {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

const DEFAULT_ROOMS: RoomOption[] = [
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
  const [checkoutType, setCheckoutType] = useState<'guest' | 'account'>(() => {
    if (typeof window === 'undefined') return 'guest';
    try {
      const saved = localStorage.getItem('cardlink_checkout_draft');
      if (saved) return JSON.parse(saved).checkoutType || 'guest';
    } catch (e) {}
    return 'guest';
  });

  const [rooms, setRooms] = useState<RoomOption[]>(DEFAULT_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState<RoomOption>(() => {
    if (typeof window === 'undefined') return DEFAULT_ROOMS[0];
    try {
      const saved = localStorage.getItem('cardlink_checkout_draft');
      if (saved) {
        const id = JSON.parse(saved).selectedRoomId;
        const found = DEFAULT_ROOMS.find((r) => r.id === id);
        if (found) return found;
      }
    } catch (e) {}
    return DEFAULT_ROOMS[0];
  });
  const [syncedToDb, setSyncedToDb] = useState(false);
  
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      name: 'John Doe',
      email: 'guest.checkout@resort.gr',
      phone: '+30 210 123 4567',
      address: '123 Athens Riviera',
      city: 'Athens',
      postalCode: '16674',
      country: 'Greece',
      guestNotes: 'High floor preference requested.',
    };
    if (typeof window === 'undefined') return defaultData;
    try {
      const saved = localStorage.getItem('cardlink_checkout_draft');
      if (saved) {
        const parsed = JSON.parse(saved).formData;
        if (parsed) return { ...defaultData, ...parsed };
      }
    } catch (e) {}
    return defaultData;
  });

  const [draftRestored, setDraftRestored] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('cardlink_checkout_draft');
  });

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('cardlink_checkout_draft');
      if (saved) return JSON.parse(saved).savedAt || null;
    } catch (e) {}
    return null;
  });

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const saveDraft = async () => {
    setIsSavingDraft(true);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const draftPayload = {
      formData,
      checkoutType,
      selectedRoomId: selectedRoom.id,
      savedAt: now,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('cardlink_checkout_draft', JSON.stringify(draftPayload));
      setLastSavedTime(now);

      const auth = getAuth();
      if (auth.currentUser) {
        await setDoc(doc(db, 'checkout_drafts', auth.currentUser.uid), draftPayload, { merge: true });
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Auto-save draft on form input or room selection change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 800);
    return () => clearTimeout(timer);
  }, [formData, checkoutType, selectedRoom]);

  const clearDraft = () => {
    localStorage.removeItem('cardlink_checkout_draft');
    setDraftRestored(false);
    setLastSavedTime(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Greece',
      guestNotes: '',
    });
  };

  // Seed default rooms to Firestore persistently and listen to real-time updates
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'rooms'),
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            for (const r of DEFAULT_ROOMS) {
              await setDoc(doc(db, 'rooms', r.id), {
                ...r,
                updatedAt: new Date().toISOString(),
              });
            }
            setSyncedToDb(true);
          } catch (err) {
            console.error('Failed to seed rooms to Firestore:', err);
          }
        } else {
          const loadedRooms: RoomOption[] = snapshot.docs.map((docItem) => {
            const data = docItem.data();
            return {
              id: docItem.id,
              name: data.name || 'Resort Suite',
              price: typeof data.price === 'number' ? data.price : parseFloat(data.price || '120'),
              image: data.image || '/images/deluxe_suite_room.jpg',
              description: data.description || 'Luxury accommodation',
            };
          });
          setRooms(loadedRooms);
          setSyncedToDb(true);
          setSelectedRoom((prev) => (!prev || !loadedRooms.some((r) => r.id === prev.id) ? loadedRooms[0] : prev));
        }
      },
      (error) => {
        console.error('Rooms subscription error:', error);
      }
    );
    return () => unsub();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMode === 'keypad') return;

    try {
      const response = await fetch('/api/cardlink', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-merchant-id': '9000012429'
        },
        body: JSON.stringify({
          ...formData,
          checkoutType,
          amount: selectedRoom.price,
          orderDesc: `Booking (${checkoutType.toUpperCase()}): ${selectedRoom.name}`,
        }),
      });
      const result = await response.json();

      if (result.endpointUrl && result.formFields) {
        // Standard Cardlink POST redirection form submission
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.endpointUrl;
        form.target = '_self';

        Object.entries(result.formFields).forEach(([key, val]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(val);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error('Cardlink checkout redirection error:', err);
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">
              Cardlink One-Page Checkout
            </span>
            {syncedToDb && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                <Database size={10} /> Persistent DB Assets
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Luxury Resort &amp; Hotel Reservation</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Fast guest checkout or member reservation. Complete purchase with Cardlink Hosted Gateway or POS Keypad.
          </p>
        </div>
      </div>

      {/* Restored Draft Banner */}
      {draftRestored && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              Restored your saved checkout draft {lastSavedTime ? `(auto-saved at ${lastSavedTime})` : ''}.
            </span>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
          >
            Clear Draft
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Reservation &amp; Payment</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Secure real-time transaction processing</span>
              {lastSavedTime && (
                <span className="text-emerald-600 font-medium">
                  • Draft saved at {lastSavedTime}
                </span>
              )}
            </div>
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
            {/* Guest Checkout vs Registered Account Selection */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Checkout Option (OpenCart One-Page Style)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  No Registration Needed
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  onClick={() => setCheckoutType('guest')}
                  className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-all ${
                    checkoutType === 'guest'
                      ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="checkoutType"
                    checked={checkoutType === 'guest'}
                    onChange={() => setCheckoutType('guest')}
                    className="mt-0.5 text-emerald-600"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Guest Checkout</div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Fast booking without creating an account or password.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setCheckoutType('account')}
                  className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-all ${
                    checkoutType === 'account'
                      ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="checkoutType"
                    checked={checkoutType === 'account'}
                    onChange={() => setCheckoutType('account')}
                    className="mt-0.5 text-slate-900"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Registered Account / Sign In</div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Save stay history and earn luxury rewards points.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Room Showcase Selection */}
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-slate-900">
                <BedDouble size={18} className="text-slate-700" /> Select Room &amp; Suite
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rooms.map((room) => {
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
              {/* Guest / Billing Customer Details */}
              <div className="space-y-6">
                <section>
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-slate-900">
                    <Truck size={18} /> {checkoutType === 'guest' ? 'Guest Billing Details' : 'Account Details'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <input 
                        name="name" 
                        value={formData.name}
                        placeholder="e.g. John Doe" 
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                        <input 
                          name="email" 
                          value={formData.email}
                          placeholder="guest@example.com" 
                          type="email" 
                          className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" 
                          onChange={handleInputChange} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                        <input 
                          name="phone" 
                          value={formData.phone}
                          placeholder="+30 210 123 4567" 
                          className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Street Address</label>
                      <input 
                        name="address" 
                        value={formData.address}
                        placeholder="123 Riviera Boulevard" 
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                        <input 
                          name="city" 
                          value={formData.city}
                          placeholder="Athens" 
                          className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" 
                          onChange={handleInputChange} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                        <input 
                          name="postalCode" 
                          value={formData.postalCode}
                          placeholder="16674" 
                          className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" 
                          onChange={handleInputChange} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                        <select 
                          name="country" 
                          value={formData.country}
                          className="w-full p-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" 
                          onChange={handleInputChange} 
                        >
                          <option value="Greece">Greece</option>
                          <option value="Germany">Germany</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                          <option value="France">France</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-1 text-slate-900">
                    <CreditCard size={18} /> Cardlink Hosted Redirection
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your checkout details will be securely sent to Cardlink / Eurobank VPOS (shophandlermpi).
                  </p>
                </section>
              </div>

              {/* Order Summary & Pay Button */}
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
                      <span>Checkout Type</span>
                      <span className="font-semibold text-slate-900 uppercase text-xs">{checkoutType}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Cardlink Processing Fee</span>
                      <span className="font-mono">$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-3 text-base">
                      <span>Total Charge</span>
                      <span className="font-mono">${selectedRoom.price}.00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    type="submit" 
                    className="w-full bg-slate-900 text-white p-3.5 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Pay ${selectedRoom.price}.00 with Cardlink ({checkoutType.toUpperCase()})
                  </button>

                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Draft status: {isSavingDraft ? 'Saving...' : 'Auto-saved'}</span>
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="text-slate-700 hover:text-slate-900 underline font-medium"
                    >
                      Save Draft Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

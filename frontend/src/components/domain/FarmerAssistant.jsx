import React, { useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { assistantApi } from '../../services/api';

export default function FarmerAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    { from: 'assistant', text: 'Namaste! Main M2M Sahayak hoon. Aapki fasal, daam, storage ya buyer matching ke baare me pooch sakte hain.' },
  ]);
  const chat = useMutation({
    mutationFn: assistantApi.chat,
    onSuccess: (result) => setMessages((items) => [...items, { from: 'assistant', text: result.answer || 'Thodi der baad phir try karein.' }]),
    onError: () => setMessages((items) => [...items, { from: 'assistant', text: 'Sahayak abhi available nahi hai. Decision Center me apne batch ka assessment check karein.' }]),
  });
  const send = (event) => {
    event.preventDefault();
    const value = question.trim();
    if (!value || chat.isPending) return;
    setMessages((items) => [...items, { from: 'user', text: value }]);
    setQuestion('');
    chat.mutate(value);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-forest px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-leaf">
        <Sparkles size={17} /> M2M Sahayak
      </button>
      {open && <div className="fixed bottom-20 right-5 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-forest px-4 py-3 text-white">
          <div className="flex items-center gap-2"><div className="rounded-lg bg-white/15 p-2"><MessageCircle size={18} /></div><div><p className="font-semibold">M2M Sahayak</p><p className="text-xs text-white/70">Fasal guidance & prediction</p></div></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={18} /></button>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto bg-cream p-3">
          {messages.map((message, index) => <div key={`${message.from}-${index}`} className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${message.from === 'user' ? 'ml-auto bg-leaf text-white' : 'bg-white text-charcoal shadow-sm'}`}>{message.text}</div>)}
          {chat.isPending && <div className="w-fit rounded-xl bg-white px-3 py-2 text-sm text-charcoal/60">Sahayak soch raha hai...</div>}
        </div>
        <p className="px-3 pt-2 text-[11px] text-charcoal/50">Prediction ek estimate hai; final daam aur faisla local market dekhkar karein.</p>
        <form onSubmit={send} className="flex gap-2 border-t p-3">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Jaise: tomato kab bechu?" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-leaf" />
          <button type="submit" disabled={chat.isPending} className="rounded-lg bg-forest px-3 text-white disabled:opacity-50" aria-label="Send question"><Send size={16} /></button>
        </form>
      </div>}
    </>
  );
}

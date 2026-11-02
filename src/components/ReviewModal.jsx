import React, { useState } from 'react';
import { X, Star, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ReviewModal({ isOpen, onClose, booking, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [drivingSkill, setDrivingSkill] = useState(5);
  const [behavior, setBehavior] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({
        rating,
        punctualityRating: punctuality,
        drivingSkillRating: drivingSkill,
        behaviorRating: behavior,
        comment
      });
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-center">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-bold text-white text-base">Feedback Submitted!</h4>
            <p className="text-xs text-slate-400 mt-1">Thank you for rating {booking.driverName}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Rate Your Experience</h3>
            <p className="text-xs text-slate-400 mb-4">
              How was your trip with <span className="text-white font-semibold">{booking.driverName}</span>?
            </p>

            {/* Overall Star Rating */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl transition hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Sub-Ratings */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-left text-xs space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Punctuality (On-Time)</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <span
                      key={v}
                      onClick={() => setPunctuality(v)}
                      className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        punctuality === v ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {v}★
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Driving Skill & Braking</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <span
                      key={v}
                      onClick={() => setDrivingSkill(v)}
                      className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        drivingSkill === v ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {v}★
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Polite Behavior</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <span
                      key={v}
                      onClick={() => setBehavior(v)}
                      className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        behavior === v ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {v}★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Written comment */}
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details (e.g. smooth gear shifts, clean dress, polite attitude)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500 mb-4 resize-none"
            ></textarea>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              Submit Rating & Review
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

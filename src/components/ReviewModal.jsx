import React, { useState } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-center text-[#172033]">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-[#0F1E36]"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-bold text-[#0F1E36] text-base">Feedback Submitted!</h4>
            <p className="text-xs text-slate-500 mt-1">Thank you for rating {booking.driverName}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-2 border border-orange-200">
              <Star className="w-6 h-6 fill-current text-amber-500" />
            </div>
            <h3 className="font-extrabold text-lg text-[#0F1E36]">Rate Your Experience</h3>
            <p className="text-xs text-slate-500 mb-4">
              How was your trip with <span className="text-[#0F1E36] font-semibold">{booking.driverName}</span>?
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
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Sub-Ratings */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Punctuality (On-Time)</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <span
                      key={v}
                      onClick={() => setPunctuality(v)}
                      className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        punctuality === v ? 'bg-[#0F1E36] text-white' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {v}★
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Driving Skill & Braking</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <span
                      key={v}
                      onClick={() => setDrivingSkill(v)}
                      className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        drivingSkill === v ? 'bg-[#0F1E36] text-white' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {v}★
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Behavior & Professionalism</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <span
                      key={v}
                      onClick={() => setBehavior(v)}
                      className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        behavior === v ? 'bg-[#0F1E36] text-white' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {v}★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment Field */}
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a short note about the driver's service..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-orange-500 resize-none mb-3"
            ></textarea>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md transition"
            >
              Submit Review & Rating
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

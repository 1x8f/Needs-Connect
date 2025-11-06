import React, { useState, useEffect } from 'react';

/**
 * Adoption Impact Tracker Component
 * Shows how donations to animal shelter needs help animals become adoption-ready
 * 
 * COST BREAKDOWN:
 * - Vet Check: $50
 * - Vaccinations: $40
 * - Spay/Neuter: $60
 * TOTAL PER ANIMAL: $150
 */
function AdoptionImpactTracker({ need }) {
  const [impact, setImpact] = useState({
    totalFunded: 0,
    animalsReady: 0,
    progressToNext: 0,
    nextAnimalCost: 0
  });
  const [loading, setLoading] = useState(true);

  // Cost per animal to become adoption-ready
  const COST_PER_ANIMAL = 150;

  // Fetch funding data for this need
  useEffect(() => {
    fetchImpact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [need.id]);

  const fetchImpact = async () => {
    try {
      setLoading(true);
      
      // Calculate total funded for this need
      const totalFunded = need.quantity_fulfilled * need.cost;
      
      // Calculate how many animals are adoption-ready
      const animalsReady = Math.floor(totalFunded / COST_PER_ANIMAL);
      
      // Calculate progress to next animal
      const remainder = totalFunded % COST_PER_ANIMAL;
      const progressPercent = Math.round((remainder / COST_PER_ANIMAL) * 100);
      const nextAnimalCost = COST_PER_ANIMAL - remainder;

      setImpact({
        totalFunded,
        animalsReady,
        progressToNext: progressPercent,
        nextAnimalCost: nextAnimalCost > 0 ? nextAnimalCost : 0
      });

    } catch (err) {
      console.error('Error calculating impact:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md mt-6">
        <p className="text-purple-700 text-center font-medium">Loading adoption impact...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-300 shadow-lg mt-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-5xl">🐾</span>
        <div>
          <h3 className="text-3xl font-bold text-slate-900">Adoption Impact Tracker</h3>
          <p className="text-purple-700 text-base mt-1">See how your donations help animals find homes</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Animals Ready */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-800 text-lg font-bold">Animals Adoption-Ready</span>
            <span className="text-5xl">🏠</span>
          </div>
          <p className="text-5xl font-extrabold text-slate-900 mb-3">{impact.animalsReady}</p>
          <p className="text-purple-700 text-sm font-medium">
            {impact.animalsReady === 0 
              ? 'Be the first to help an animal!' 
              : impact.animalsReady === 1
              ? '1 animal ready for their forever home! 🎉'
              : `${impact.animalsReady} animals ready for their forever homes! 🎉`
            }
          </p>
        </div>

        {/* Total Funded */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-800 text-lg font-bold">Total Funded</span>
            <span className="text-5xl">💰</span>
          </div>
          <p className="text-5xl font-extrabold text-slate-900 mb-3">${impact.totalFunded.toFixed(2)}</p>
          <p className="text-blue-700 text-sm font-medium">Helping animals get ready for adoption</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-slate-300 mb-8 shadow-md">
        <h4 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
          <span>📋</span>
          <span>What Makes an Animal Adoption-Ready?</span>
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <span className="text-slate-700 font-medium">Veterinary Health Check</span>
            </div>
            <span className="text-slate-900 font-bold text-lg">$50</span>
          </div>

          <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💉</span>
              <span className="text-slate-700 font-medium">Vaccinations (Full Series)</span>
            </div>
            <span className="text-slate-900 font-bold text-lg">$40</span>
          </div>

          <div className="flex items-center justify-between bg-cyan-50 p-3 rounded-xl border border-cyan-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🩺</span>
              <span className="text-slate-700 font-medium">Spay/Neuter Surgery</span>
            </div>
            <span className="text-slate-900 font-bold text-lg">$60</span>
          </div>

          <div className="border-t-2 border-slate-300 pt-4 mt-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl border-2 border-purple-300">
              <span className="text-slate-900 font-bold text-lg">Total Per Animal</span>
              <span className="text-slate-900 font-extrabold text-3xl">${COST_PER_ANIMAL}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Animal */}
      {impact.nextAnimalCost > 0 && (
        <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-6 border-2 border-blue-300 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>🎯</span>
              <span>Progress to Next Animal</span>
            </h4>
            <span className="text-blue-700 font-bold text-2xl">{impact.progressToNext}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center shadow-sm"
              style={{ width: `${impact.progressToNext}%` }}
            >
              {impact.progressToNext > 15 && (
                <span className="text-white font-bold text-xs">{impact.progressToNext}%</span>
              )}
            </div>
          </div>

          <p className="text-slate-700 text-center font-medium">
            <span className="font-bold text-slate-900 text-lg">${impact.nextAnimalCost.toFixed(2)}</span> more needed to prepare the next animal for adoption!
          </p>

          {impact.progressToNext >= 50 && (
            <p className="text-green-700 text-center text-sm mt-3 font-bold bg-green-100 p-2 rounded-lg border border-green-300">
              🌟 More than halfway there! Keep going!
            </p>
          )}
        </div>
      )}

      {/* Call to Action */}
      {impact.animalsReady === 0 && (
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-5 mt-6 shadow-md">
          <p className="text-yellow-900 text-center font-bold text-lg">
            🐕 Be the first to help an animal! Your donation will directly contribute to preparing animals for their forever homes. 🐈
          </p>
        </div>
      )}

      {impact.animalsReady > 0 && (
        <div className="bg-green-100 border-2 border-green-400 rounded-2xl p-5 mt-6 shadow-md">
          <p className="text-green-900 text-center font-medium text-lg">
            <span className="font-extrabold">🎉 Amazing! </span>
            Thanks to donations like yours, <span className="font-bold">{impact.animalsReady}</span> 
            {impact.animalsReady === 1 ? ' animal is' : ' animals are'} ready to find loving homes!
          </p>
        </div>
      )}
    </div>
  );
}

export default AdoptionImpactTracker;


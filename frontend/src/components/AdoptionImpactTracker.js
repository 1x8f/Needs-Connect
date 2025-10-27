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
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-6 border-2 border-purple-500 shadow-lg">
        <p className="text-purple-200 text-center">Loading adoption impact...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-6 border-2 border-purple-500 shadow-xl mt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-5xl">🐾</span>
        <div>
          <h3 className="text-2xl font-bold text-white">Adoption Impact Tracker</h3>
          <p className="text-purple-200 text-sm">See how your donations help animals find homes</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Animals Ready */}
        <div className="bg-purple-950 rounded-lg p-6 border border-purple-400">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-lg font-semibold">Animals Adoption-Ready</span>
            <span className="text-6xl">🏠</span>
          </div>
          <p className="text-5xl font-bold text-white mb-2">{impact.animalsReady}</p>
          <p className="text-purple-300 text-sm">
            {impact.animalsReady === 0 
              ? 'Be the first to help an animal!' 
              : impact.animalsReady === 1
              ? '1 animal ready for their forever home! 🎉'
              : `${impact.animalsReady} animals ready for their forever homes! 🎉`
            }
          </p>
        </div>

        {/* Total Funded */}
        <div className="bg-purple-950 rounded-lg p-6 border border-purple-400">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-lg font-semibold">Total Funded</span>
            <span className="text-6xl">💰</span>
          </div>
          <p className="text-5xl font-bold text-white mb-2">${impact.totalFunded.toFixed(2)}</p>
          <p className="text-purple-300 text-sm">Helping animals get ready for adoption</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-purple-950 rounded-lg p-6 border border-purple-400 mb-6">
        <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>What Makes an Animal Adoption-Ready?</span>
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <span className="text-purple-200">Veterinary Health Check</span>
            </div>
            <span className="text-white font-bold">$50</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💉</span>
              <span className="text-purple-200">Vaccinations (Full Series)</span>
            </div>
            <span className="text-white font-bold">$40</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🩺</span>
              <span className="text-purple-200">Spay/Neuter Surgery</span>
            </div>
            <span className="text-white font-bold">$60</span>
          </div>

          <div className="border-t-2 border-purple-500 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-purple-100 font-bold text-lg">Total Per Animal</span>
              <span className="text-white font-bold text-2xl">${COST_PER_ANIMAL}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Animal */}
      {impact.nextAnimalCost > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border-2 border-blue-400">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🎯</span>
              <span>Progress to Next Animal</span>
            </h4>
            <span className="text-blue-200 font-bold text-lg">{impact.progressToNext}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-6 mb-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-6 rounded-full transition-all duration-500 flex items-center justify-center"
              style={{ width: `${impact.progressToNext}%` }}
            >
              {impact.progressToNext > 10 && (
                <span className="text-white font-bold text-sm">{impact.progressToNext}%</span>
              )}
            </div>
          </div>

          <p className="text-blue-200 text-center">
            <span className="font-bold text-white">${impact.nextAnimalCost.toFixed(2)}</span> more needed to prepare the next animal for adoption!
          </p>

          {impact.progressToNext >= 50 && (
            <p className="text-green-300 text-center text-sm mt-2 font-bold">
              🌟 More than halfway there! Keep going!
            </p>
          )}
        </div>
      )}

      {/* Call to Action */}
      {impact.animalsReady === 0 && (
        <div className="bg-yellow-900 border-2 border-yellow-500 rounded-lg p-4 mt-6">
          <p className="text-yellow-200 text-center font-bold">
            🐕 Be the first to help an animal! Your donation will directly contribute to preparing animals for their forever homes. 🐈
          </p>
        </div>
      )}

      {impact.animalsReady > 0 && (
        <div className="bg-green-900 border-2 border-green-500 rounded-lg p-4 mt-6">
          <p className="text-green-200 text-center">
            <span className="font-bold text-white">🎉 Amazing! </span>
            Thanks to donations like yours, <span className="font-bold text-white">{impact.animalsReady}</span> 
            {impact.animalsReady === 1 ? ' animal is' : ' animals are'} ready to find loving homes!
          </p>
        </div>
      )}
    </div>
  );
}

export default AdoptionImpactTracker;


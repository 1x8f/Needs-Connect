import React, { useState, useEffect } from 'react';

/**
 * Shelter-Wide Impact Dashboard
 * Shows aggregate impact across ALL animal shelter needs on the platform
 * 
 * COST BREAKDOWN:
 * - Total per animal: $150
 */
function ShelterImpactDashboard({ needs }) {
  const [globalImpact, setGlobalImpact] = useState({
    totalFunded: 0,
    totalAnimalsReady: 0,
    shelterNeedsCount: 0
  });

  const COST_PER_ANIMAL = 150;

  useEffect(() => {
    calculateGlobalImpact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needs]);

  const calculateGlobalImpact = () => {
    // Filter only animal shelter needs
    const animalShelterNeeds = needs.filter(need => need.org_type === 'animal_shelter');

    // Calculate total funded across all animal shelter needs
    const totalFunded = animalShelterNeeds.reduce((sum, need) => {
      return sum + (need.quantity_fulfilled * need.cost);
    }, 0);

    // Calculate total animals ready across all needs
    const totalAnimalsReady = Math.floor(totalFunded / COST_PER_ANIMAL);

    setGlobalImpact({
      totalFunded,
      totalAnimalsReady,
      shelterNeedsCount: animalShelterNeeds.length
    });
  };

  // Only show if there are animal shelter needs
  if (globalImpact.shelterNeedsCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-100 via-blue-100 to-purple-100 rounded-2xl p-8 border-2 border-purple-300 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🐾</span>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shelter-Wide Impact</h2>
            <p className="text-purple-800 text-base mt-1">Platform-wide adoption impact across all animal shelters</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Animals Ready */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-300 text-center shadow-md hover:shadow-lg transition-all">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-5xl font-extrabold text-slate-900 mb-3">{globalImpact.totalAnimalsReady}</p>
          <p className="text-purple-800 font-bold text-lg">
            {globalImpact.totalAnimalsReady === 0 
              ? 'Animals Adoption-Ready'
              : globalImpact.totalAnimalsReady === 1
              ? 'Animal Adoption-Ready'
              : 'Animals Adoption-Ready'
            }
          </p>
          {globalImpact.totalAnimalsReady > 0 && (
            <p className="text-green-700 text-sm mt-3 font-bold bg-green-100 p-2 rounded-lg border border-green-300">🎉 Ready for forever homes!</p>
          )}
        </div>

        {/* Total Funded */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-300 text-center shadow-md hover:shadow-lg transition-all">
          <div className="text-6xl mb-4">💰</div>
          <p className="text-5xl font-extrabold text-slate-900 mb-3">${globalImpact.totalFunded.toFixed(0)}</p>
          <p className="text-blue-800 font-bold text-lg">Total Shelter Funding</p>
          <p className="text-blue-700 text-sm mt-2">Across all animal shelter needs</p>
        </div>

        {/* Active Needs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-indigo-300 text-center shadow-md hover:shadow-lg transition-all">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-5xl font-extrabold text-slate-900 mb-3">{globalImpact.shelterNeedsCount}</p>
          <p className="text-indigo-800 font-bold text-lg">
            Active Shelter {globalImpact.shelterNeedsCount === 1 ? 'Need' : 'Needs'}
          </p>
          <p className="text-indigo-700 text-sm mt-2">Help make a difference!</p>
        </div>
      </div>

      {/* Call to Action */}
      {globalImpact.totalAnimalsReady === 0 && globalImpact.shelterNeedsCount > 0 && (
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-5 mt-8 shadow-md">
          <p className="text-yellow-900 text-center font-bold text-lg">
            🐕 Be the first to help! Browse our {globalImpact.shelterNeedsCount} animal shelter {globalImpact.shelterNeedsCount === 1 ? 'need' : 'needs'} below to make an impact! 🐈
          </p>
        </div>
      )}

      {globalImpact.totalAnimalsReady >= 5 && (
        <div className="bg-green-100 border-2 border-green-400 rounded-2xl p-5 mt-8 shadow-md">
          <p className="text-green-900 text-center font-bold text-lg">
            🌟 Amazing! Together, we've prepared {globalImpact.totalAnimalsReady} animals for adoption! Keep up the incredible work! 🌟
          </p>
        </div>
      )}
    </div>
  );
}

export default ShelterImpactDashboard;


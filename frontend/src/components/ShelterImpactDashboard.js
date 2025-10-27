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
    <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 rounded-lg p-6 border-2 border-purple-400 shadow-2xl mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-5xl">🐾</span>
          <div>
            <h2 className="text-3xl font-bold text-white">Shelter-Wide Impact</h2>
            <p className="text-purple-200">Platform-wide adoption impact across all animal shelters</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Animals Ready */}
        <div className="bg-purple-950 rounded-lg p-6 border-2 border-purple-400 text-center">
          <div className="text-6xl mb-3">🏠</div>
          <p className="text-5xl font-bold text-white mb-2">{globalImpact.totalAnimalsReady}</p>
          <p className="text-purple-200 font-semibold">
            {globalImpact.totalAnimalsReady === 0 
              ? 'Animals Adoption-Ready'
              : globalImpact.totalAnimalsReady === 1
              ? 'Animal Adoption-Ready'
              : 'Animals Adoption-Ready'
            }
          </p>
          {globalImpact.totalAnimalsReady > 0 && (
            <p className="text-green-300 text-sm mt-2 font-bold">🎉 Ready for forever homes!</p>
          )}
        </div>

        {/* Total Funded */}
        <div className="bg-blue-950 rounded-lg p-6 border-2 border-blue-400 text-center">
          <div className="text-6xl mb-3">💰</div>
          <p className="text-5xl font-bold text-white mb-2">${globalImpact.totalFunded.toFixed(0)}</p>
          <p className="text-blue-200 font-semibold">Total Shelter Funding</p>
          <p className="text-blue-300 text-sm mt-2">Across all animal shelter needs</p>
        </div>

        {/* Active Needs */}
        <div className="bg-indigo-950 rounded-lg p-6 border-2 border-indigo-400 text-center">
          <div className="text-6xl mb-3">📋</div>
          <p className="text-5xl font-bold text-white mb-2">{globalImpact.shelterNeedsCount}</p>
          <p className="text-indigo-200 font-semibold">
            Active Shelter {globalImpact.shelterNeedsCount === 1 ? 'Need' : 'Needs'}
          </p>
          <p className="text-indigo-300 text-sm mt-2">Help make a difference!</p>
        </div>
      </div>

      {/* Call to Action */}
      {globalImpact.totalAnimalsReady === 0 && globalImpact.shelterNeedsCount > 0 && (
        <div className="bg-yellow-900 border-2 border-yellow-500 rounded-lg p-4 mt-6">
          <p className="text-yellow-200 text-center font-bold">
            🐕 Be the first to help! Browse our {globalImpact.shelterNeedsCount} animal shelter {globalImpact.shelterNeedsCount === 1 ? 'need' : 'needs'} below to make an impact! 🐈
          </p>
        </div>
      )}

      {globalImpact.totalAnimalsReady >= 5 && (
        <div className="bg-green-900 border-2 border-green-500 rounded-lg p-4 mt-6">
          <p className="text-green-200 text-center font-bold">
            🌟 Amazing! Together, we've prepared {globalImpact.totalAnimalsReady} animals for adoption! Keep up the incredible work! 🌟
          </p>
        </div>
      )}
    </div>
  );
}

export default ShelterImpactDashboard;


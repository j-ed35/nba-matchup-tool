import teams from '../data/nba_teams.json';
import { getTeamColor } from './teamColors';

function makeTeamFromSeries(id, tricode, city, name, seed, wins, losses) {
  if (!id || id === 0) {
    const seedLabel = seed === 7 ? '7 Seed (Play-In)' : seed === 8 ? '8 Seed (Play-In)' : `#${seed} Seed`;
    return {
      id: -1,
      name: seedLabel,
      tricode: 'TBD',
      seed,
      wins: 0,
      losses: 0,
      isPlaceholder: true,
      logo_url: null,
      color: null,
    };
  }
  const info = teams.find((t) => t.id === id);
  return {
    id,
    name: info?.full_name || `${city} ${name}`,
    tricode: tricode || info?.abbreviation || '???',
    seed,
    wins: wins || 0,
    losses: losses || 0,
    isPlaceholder: false,
    logo_url: info?.logo_url || `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg`,
    color: getTeamColor(id),
  };
}

function buildConference(allSeries, conference) {
  const confSeries = allSeries.filter(
    (s) => s.conference?.toLowerCase() === conference.toLowerCase()
  );

  // Separate by matchupType
  const playIn7v8 = confSeries.find(
    (s) => s.matchupType === 'Play-In 7v8'
  );
  const playIn9v10 = confSeries.find(
    (s) => s.matchupType === 'Play-In 9v10'
  );
  const firstRoundSeries = confSeries.filter((s) => s.matchupType === 'First Round');

  // Build play-in matchups
  const playInMatchups = [];
  if (playIn7v8) {
    playInMatchups.push({
      label: '7 vs 8',
      highSeed: makeTeamFromSeries(playIn7v8.highSeedId, playIn7v8.highSeedTricode, playIn7v8.highSeedCity, playIn7v8.highSeedName, 7, playIn7v8.highSeedRegSeasonWins, playIn7v8.highSeedRegSeasonLosses),
      lowSeed: makeTeamFromSeries(playIn7v8.lowSeedId, playIn7v8.lowSeedTricode, playIn7v8.lowSeedCity, playIn7v8.lowSeedName, 8, playIn7v8.lowSeedRegSeasonWins, playIn7v8.lowSeedRegSeasonLosses),
    });
  }
  if (playIn9v10) {
    playInMatchups.push({
      label: '9 vs 10',
      highSeed: makeTeamFromSeries(playIn9v10.highSeedId, playIn9v10.highSeedTricode, playIn9v10.highSeedCity, playIn9v10.highSeedName, 9, playIn9v10.highSeedRegSeasonWins, playIn9v10.highSeedRegSeasonLosses),
      lowSeed: makeTeamFromSeries(playIn9v10.lowSeedId, playIn9v10.lowSeedTricode, playIn9v10.lowSeedCity, playIn9v10.lowSeedName, 10, playIn9v10.lowSeedRegSeasonWins, playIn9v10.lowSeedRegSeasonLosses),
    });
  }

  // Build first round matchups in bracket order: 1v8, 4v5, 3v6, 2v7
  // The API has lowSeedRank=0 for play-in dependent matchups, so match by highSeedRank
  const bracketOrder = [
    { high: 1, expectedLow: 8 },
    { high: 4, expectedLow: 5 },
    { high: 3, expectedLow: 6 },
    { high: 2, expectedLow: 7 },
  ];

  const firstRound = bracketOrder.map(({ high, expectedLow }) => {
    const series = firstRoundSeries.find((s) => s.highSeedRank === high);
    if (series) {
      const highTeam = makeTeamFromSeries(series.highSeedId, series.highSeedTricode, series.highSeedCity, series.highSeedName, high, series.highSeedRegSeasonWins, series.highSeedRegSeasonLosses);
      const lowTeam = makeTeamFromSeries(series.lowSeedId, series.lowSeedTricode, series.lowSeedCity, series.lowSeedName, expectedLow, series.lowSeedRegSeasonWins, series.lowSeedRegSeasonLosses);
      return { highSeed: highTeam, lowSeed: lowTeam };
    }
    return {
      highSeed: { id: -1, name: `#${high} Seed`, tricode: 'TBD', seed: high, isPlaceholder: true, logo_url: null, color: null },
      lowSeed: { id: -1, name: `#${expectedLow} Seed`, tricode: 'TBD', seed: expectedLow, isPlaceholder: true, logo_url: null, color: null },
    };
  });

  return { firstRound, playInMatchups };
}

export function transformBracketData(apiResponse) {
  const seriesList = apiResponse?.bracket?.playoffPictureSeries || [];
  if (!seriesList.length) return null;

  return {
    west: buildConference(seriesList, 'West'),
    east: buildConference(seriesList, 'East'),
  };
}

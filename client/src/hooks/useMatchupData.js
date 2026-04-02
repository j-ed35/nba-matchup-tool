import { useState, useEffect, useCallback, useRef } from 'react';
import { getMatchup, getMatchupPlayers, getStandings, getH2HStats, getH2HPlayers } from '../utils/api';

export function useMatchupData(team1Id, team2Id, mode = 'season') {
  const [matchup, setMatchup] = useState(null);
  const [players, setPlayers] = useState(null);
  const [h2hStats, setH2hStats] = useState(null);
  const [h2hPlayers, setH2hPlayers] = useState(null);
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache to avoid re-fetching when toggling modes
  const cache = useRef({});

  const fetchData = useCallback(async () => {
    if (!team1Id || !team2Id) {
      setMatchup(null);
      setPlayers(null);
      setH2hStats(null);
      setH2hPlayers(null);
      return;
    }

    const cacheKey = `${team1Id}:${team2Id}`;

    // Always ensure season data is loaded (needed for HeadToHead section)
    const seasonCached = cache.current[`season:${cacheKey}`];
    const h2hCached = cache.current[`h2h:${cacheKey}`];

    if (mode === 'season' && seasonCached) {
      setMatchup(seasonCached.matchup);
      setPlayers(seasonCached.players);
      return;
    }

    if (mode === 'h2h' && h2hCached) {
      setH2hStats(h2hCached.stats);
      setH2hPlayers(h2hCached.players);
      // Also ensure season matchup is available for HeadToHead section
      if (seasonCached) {
        setMatchup(seasonCached.matchup);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'season') {
        const [matchupResult, playerResult] = await Promise.allSettled([
          getMatchup(team1Id, team2Id),
          getMatchupPlayers(team1Id, team2Id),
        ]);

        const entry = {};
        if (matchupResult.status === 'fulfilled') {
          setMatchup(matchupResult.value);
          entry.matchup = matchupResult.value;
        } else {
          setError(matchupResult.reason?.message || 'Failed to load matchup');
        }

        if (playerResult.status === 'fulfilled') {
          setPlayers(playerResult.value);
          entry.players = playerResult.value;
        }

        cache.current[`season:${cacheKey}`] = entry;
      } else {
        // H2H mode: fetch H2H data, and season data if not cached
        const promises = [
          getH2HStats(team1Id, team2Id),
          getH2HPlayers(team1Id, team2Id),
        ];

        // Also fetch season matchup if not cached (needed for HeadToHead section)
        if (!seasonCached) {
          promises.push(getMatchup(team1Id, team2Id));
        }

        const results = await Promise.allSettled(promises);

        const h2hEntry = {};
        if (results[0].status === 'fulfilled') {
          setH2hStats(results[0].value);
          h2hEntry.stats = results[0].value;
        } else {
          setError(results[0].reason?.message || 'Failed to load H2H stats');
        }

        if (results[1].status === 'fulfilled') {
          setH2hPlayers(results[1].value);
          h2hEntry.players = results[1].value;
        }

        cache.current[`h2h:${cacheKey}`] = h2hEntry;

        // Handle season matchup fetch
        if (!seasonCached && results[2]) {
          if (results[2].status === 'fulfilled') {
            setMatchup(results[2].value);
            cache.current[`season:${cacheKey}`] = { matchup: results[2].value };
          }
        } else if (seasonCached) {
          setMatchup(seasonCached.matchup);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [team1Id, team2Id, mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getStandings()
      .then(setStandings)
      .catch((err) => console.error('Failed to fetch standings:', err));
  }, []);

  // Clear cache when teams change
  useEffect(() => {
    cache.current = {};
  }, [team1Id, team2Id]);

  return { matchup, players, h2hStats, h2hPlayers, standings, loading, error, refetch: fetchData };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMatchup, getMatchupPlayers, getStandings, getH2HStats, getH2HPlayers, getH2HPlayerRankings } from '../utils/api';

export function useMatchupData(team1Id, team2Id, mode = 'h2h') {
  const [matchup, setMatchup] = useState(null);
  const [players, setPlayers] = useState(null);
  const [h2hStats, setH2hStats] = useState(null);
  const [h2hPlayers, setH2hPlayers] = useState(null);
  const [h2hPlayerRankings, setH2hPlayerRankings] = useState(null);
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
      setH2hPlayerRankings(null);
      return;
    }

    const cacheKey = `${team1Id}:${team2Id}`;

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
      setH2hPlayerRankings(h2hCached.rankings);
      if (seasonCached) {
        setMatchup(seasonCached.matchup);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'season') {
        // Lazy-load season data only when user switches to Season mode
        const promises = [getMatchupPlayers(team1Id, team2Id)];

        // Also fetch matchup if not cached
        if (!seasonCached?.matchup) {
          promises.push(getMatchup(team1Id, team2Id));
        }

        const results = await Promise.allSettled(promises);

        const entry = { ...seasonCached };
        if (results[0].status === 'fulfilled') {
          setPlayers(results[0].value);
          entry.players = results[0].value;
        }

        if (!seasonCached?.matchup && results[1]) {
          if (results[1].status === 'fulfilled') {
            setMatchup(results[1].value);
            entry.matchup = results[1].value;
          } else {
            setError(results[1].reason?.message || 'Failed to load matchup');
          }
        } else if (seasonCached?.matchup) {
          setMatchup(seasonCached.matchup);
        }

        cache.current[`season:${cacheKey}`] = entry;
      } else {
        // H2H mode: fetch H2H data + matchup (for standings/record/h2h_games) + player rankings in parallel
        const promises = [
          getH2HStats(team1Id, team2Id),
          getH2HPlayers(team1Id, team2Id),
          getH2HPlayerRankings(team1Id, team2Id),
        ];

        // Also fetch season matchup if not cached (needed for HeadToHead section)
        if (!seasonCached?.matchup) {
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

        if (results[2].status === 'fulfilled') {
          setH2hPlayerRankings(results[2].value);
          h2hEntry.rankings = results[2].value;
        }

        cache.current[`h2h:${cacheKey}`] = h2hEntry;

        // Handle season matchup fetch
        if (!seasonCached?.matchup && results[3]) {
          if (results[3].status === 'fulfilled') {
            setMatchup(results[3].value);
            cache.current[`season:${cacheKey}`] = { ...seasonCached, matchup: results[3].value };
          }
        } else if (seasonCached?.matchup) {
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

  return { matchup, players, h2hStats, h2hPlayers, h2hPlayerRankings, standings, loading, error, refetch: fetchData };
}

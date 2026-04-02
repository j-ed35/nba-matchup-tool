import { useState, useEffect, useCallback } from 'react';
import { getMatchup, getMatchupPlayers, getStandings } from '../utils/api';

export function useMatchupData(team1Id, team2Id) {
  const [matchup, setMatchup] = useState(null);
  const [players, setPlayers] = useState(null);
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMatchup = useCallback(async () => {
    if (!team1Id || !team2Id) {
      setMatchup(null);
      setPlayers(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [matchupResult, playerResult] = await Promise.allSettled([
        getMatchup(team1Id, team2Id),
        getMatchupPlayers(team1Id, team2Id),
      ]);

      if (matchupResult.status === 'fulfilled') {
        setMatchup(matchupResult.value);
      } else {
        setError(matchupResult.reason?.message || 'Failed to load matchup');
      }

      if (playerResult.status === 'fulfilled') {
        setPlayers(playerResult.value);
      }
      // Player stats failure is non-fatal — silently omit the section
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [team1Id, team2Id]);

  useEffect(() => {
    fetchMatchup();
  }, [fetchMatchup]);

  useEffect(() => {
    getStandings()
      .then(setStandings)
      .catch((err) => console.error('Failed to fetch standings:', err));
  }, []);

  return { matchup, players, standings, loading, error, refetch: fetchMatchup };
}

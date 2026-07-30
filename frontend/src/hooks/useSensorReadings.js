import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

/**
 * Custom hook that subscribes to Firebase RTDB for live sensor readings.
 *
 * @param {string[]} firebaseNodeIds - Array of RTDB node IDs (e.g. ["sensor_001", "sensor_002"])
 * @returns {{ readings: Object, loading: boolean, error: string|null }}
 *   readings = { "sensor_001": { temperature, ph, nitrogen, phosphorous, potassium }, ... }
 */
export default function useSensorReadings(firebaseNodeIds = []) {
    const [readings, setReadings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const unsubscribesRef = useRef([]);

    useEffect(() => {
        // Clean up previous listeners
        unsubscribesRef.current.forEach(unsub => unsub());
        unsubscribesRef.current = [];

        const validIds = firebaseNodeIds.filter(Boolean);
        if (validIds.length === 0) {
            setReadings({});
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        let loadedCount = 0;

        validIds.forEach(nodeId => {
            const sensorRef = ref(rtdb, `sensors/${nodeId}`);
            const unsub = onValue(
                sensorRef,
                (snapshot) => {
                    const data = snapshot.val();
                    setReadings(prev => ({ ...prev, [nodeId]: data }));
                    loadedCount++;
                    if (loadedCount >= validIds.length) setLoading(false);
                },
                (err) => {
                    console.error(`Firebase RTDB error for ${nodeId}:`, err);
                    setError(err.message);
                    setLoading(false);
                }
            );
            unsubscribesRef.current.push(unsub);
        });

        return () => {
            unsubscribesRef.current.forEach(unsub => unsub());
            unsubscribesRef.current = [];
        };
    }, [JSON.stringify(firebaseNodeIds)]);

    return { readings, loading, error };
}

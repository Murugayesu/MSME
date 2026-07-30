import { useState, useEffect } from 'react';

export default function useSensorReadings(sensorIds = []) {
    const [readings, setReadings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const validIds = sensorIds.filter(Boolean);
        if (validIds.length === 0) {
            setReadings({});
            setLoading(false);
            return;
        }

        setLoading(true);
        // Mock data generator
        const mockData = {};
        validIds.forEach(nodeId => {
            mockData[nodeId] = {
                temperature: (20 + Math.random() * 15).toFixed(1),
                moisture: Math.floor(40 + Math.random() * 40),
                ph: (5.5 + Math.random() * 2).toFixed(1),
                nitrogen: Math.floor(10 + Math.random() * 50),
                phosphorous: Math.floor(10 + Math.random() * 50),
                potassium: Math.floor(10 + Math.random() * 50),
            };
        });
        
        setReadings(mockData);
        setLoading(false);

        // Optional: simulate live updates every 5 seconds
        const interval = setInterval(() => {
            setReadings(prev => {
                const next = { ...prev };
                validIds.forEach(nodeId => {
                    if(next[nodeId]) {
                        next[nodeId].temperature = (parseFloat(next[nodeId].temperature) + (Math.random() - 0.5)).toFixed(1);
                        next[nodeId].moisture = Math.max(0, Math.min(100, next[nodeId].moisture + Math.floor((Math.random() - 0.5) * 5)));
                    }
                });
                return next;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [JSON.stringify(sensorIds)]);

    return { readings, loading, error };
}

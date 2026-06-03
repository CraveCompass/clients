"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '../lib/api';
import styles from './CreateRoom.module.css';

export default function CreateRoom() {
    const router = useRouter();
    const [radius, setRadius] = useState<number>(3000);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartSession = async () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // TODO: In a real app, generate a random ID for the guest or use their JWT
                    const hostId = "guest_" + Math.random().toString(36).substring(2, 9);

                    const session = await createSession({
                        host_id: hostId,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        radius_meters: radius,
                    });

                    router.push(`/room/${session.id}`);

                } catch (err: any) {
                    setError(err.message || "Failed to connect to the server.");
                    setLoading(false);
                }
            },
            (geoError) => {
                setError("Please allow location access to find nearby restaurants.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className={styles.card}>
            <div>
                <label className={styles.label} htmlFor="radius">Search Radius</label>
                <select
                    id="radius"
                    className={styles.select}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    disabled={loading}
                >
                    <option value={1000}>Walking Distance (1 km)</option>
                    <option value={3000}>Short Drive (3 km)</option>
                    <option value={5000}>City Wide (5 km)</option>
                    <option value={10000}>Adventurous (10 km)</option>
                </select>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
                className={styles.button}
                onClick={handleStartSession}
                disabled={loading}
            >
                {loading ? "Finding Restaurants..." : "Create a Room"}
            </button>
        </div>
    );
}
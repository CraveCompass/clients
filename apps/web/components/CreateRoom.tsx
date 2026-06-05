"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '../lib/api';
import styles from './CreateRoom.module.css';

export default function CreateRoom() {
    const router = useRouter();
    const [radius, setRadius] = useState<number>(3000);
    const [hostName, setHostName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [priceTiers, setPriceTiers] = useState<number[]>([]);
    const [minRating, setMinRating] = useState<number>(0);
    const [cuisines, setCuisines] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [tagSearch, setTagSearch] = useState('');

    const togglePrice = (tier: number) => {
        setPriceTiers(prev => prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]);
    };

    const toggleCuisine = (c: string) => {
        setCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    };

    useEffect(() => {
        import('../lib/api').then(({ getTags }) => {
            getTags().then(tags => setAvailableTags(tags));
        });
    }, []);

    const filteredTags = (availableTags || []).filter(t =>
        t.toLowerCase().includes(tagSearch.toLowerCase()) && !cuisines.includes(t)
    );

    useEffect(() => {
        setIsMounted(true);
        const storedName = sessionStorage.getItem('crave_username');
        if (storedName) setHostName(storedName);
    }, []);

    const handleStartSession = async () => {
        if (!hostName.trim()) {
            setError("Please enter your name first.");
            return;
        }

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
                    let hostId = sessionStorage.getItem('crave_user_id');
                    if (!hostId) {
                        hostId = "user_" + Math.random().toString(36).substring(2, 9);
                        sessionStorage.setItem('crave_user_id', hostId);
                    }

                    sessionStorage.setItem('crave_username', hostName.trim());

                    const session = await createSession({
                        host_id: hostId,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        radius_meters: radius,
                        priceTiers,
                        minRating,
                        cuisines
                    });

                    router.push(`/room/${session.id}`);

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (err: any) {
                    setError(err.message || "Failed to connect to the server.");
                    setLoading(false);
                }
            },
            () => {
                setError("Please allow location access to find nearby restaurants.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    if (!isMounted) {
        return (
            <div className={styles.card} style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
                Loading deck...
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <div>
                <label className={styles.label} htmlFor="hostName">Your Name</label>
                <input
                    id="hostName"
                    type="text"
                    className={styles.select}
                    placeholder="E.g. Illia"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    disabled={loading}
                    maxLength={20}
                    style={{ backgroundColor: '#ffffff' }}
                />
            </div>

            <div>
                <label className={styles.label} htmlFor="radius">Search Radius</label>
                <select
                    id="radius"
                    className={styles.select}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    disabled={loading}
                >
                    <option value={500}>Corner Walk (500 m)</option>
                    <option value={1000}>Walking Distance (1 km)</option>
                    <option value={3000}>Short Drive (3 km)</option>
                    <option value={5000}>City Wide (5 km)</option>
                    <option value={10000}>Adventurous (10 km)</option>
                </select>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>

                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 0 }}
                >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        Fine-Tune Deck
                    </h3>
                    <svg
                        width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                {showFilters && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>Price (Leave empty for any)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[1, 2, 3, 4].map(tier => (
                                    <button
                                        key={tier}
                                        type="button"
                                        onClick={() => togglePrice(tier)}
                                        style={{
                                            flex: 1, padding: '0.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                            backgroundColor: priceTiers.includes(tier) ? '#10b981' : 'white',
                                            color: priceTiers.includes(tier) ? 'white' : '#64748b',
                                            border: `1px solid ${priceTiers.includes(tier) ? '#10b981' : '#cbd5e1'}`
                                        }}
                                    >
                                        {Array(tier).fill('$').join('')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Minimum Google Rating</label>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>{minRating > 0 ? `${minRating.toFixed(1)}+ ⭐` : 'Any'}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="4.5" step="0.5"
                                value={minRating}
                                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>Specific Cuisines</label>

                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search cuisines (e.g. Pizza, Cafe)..."
                                    value={tagSearch}
                                    onChange={e => setTagSearch(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                />

                                {tagSearch && filteredTags.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto', zIndex: 10, marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                        {filteredTags.map(tag => (
                                            <div
                                                key={tag}
                                                onClick={() => { toggleCuisine(tag); setTagSearch(''); }}
                                                style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#334155' }}
                                            >
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                {cuisines.map(c => (
                                    <span key={c} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                        {c}
                                        <button type="button" onClick={() => toggleCuisine(c)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>&times;</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button
                className={styles.button}
                onClick={handleStartSession}
                disabled={!isMounted || loading || !hostName.trim()}
            >
                {loading ? "Finding Restaurants..." : "Create a Room"}
            </button>
        </div>
    );
}
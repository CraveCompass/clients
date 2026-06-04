"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import SwipeDeck from '../../../components/SwipeDeck';
import styles from './Room.module.css';

type Participant = {
    id: string;
    username: string;
};

export default function RoomPage() {
    const params = useParams();
    const roomId = params.id as string;

    const [userId, setUserId] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [isJoined, setIsJoined] = useState<boolean>(false);
    const [copied, setCopied] = useState(false);

    const { session, isConnected, isMatch, sendSwipe } = useSessionSocket(roomId, isJoined ? userId : '', username);

    const participants: Participant[] = session?.participants || [];

    useEffect(() => {
        const storedId = sessionStorage.getItem('crave_user_id');
        const storedName = sessionStorage.getItem('crave_username');

        if (storedId && storedName) {
            setUserId(storedId);
            setUsername(storedName);
            setIsJoined(true);
        }
    }, [roomId]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        const newUserId = "user_" + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('crave_user_id', newUserId);
        sessionStorage.setItem('crave_username', username.trim());

        setUserId(newUserId);
        setIsJoined(true);
    };

    const copyInviteLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isJoined) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.joinOverlay}>
                    <form className={styles.joinCard} onSubmit={handleJoin}>
                        <h1 className={styles.joinTitle}>Join Room {roomId.substring(0, 6).toUpperCase()}</h1>
                        <p style={{ color: '#64748b' }}>Enter your name to start swiping.</p>

                        <input
                            type="text"
                            className={styles.joinInput}
                            placeholder="Your Name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                            maxLength={20}
                        />

                        <button
                            type="submit"
                            className={styles.joinButton}
                            disabled={!username.trim()}
                        >
                            Join the Deck
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <h1 className={styles.title}>Room Code: {roomId.substring(0, 6).toUpperCase()}</h1>
                <div className={styles.status}>
                    <span className={`${styles.dot} ${isConnected ? styles.connected : ''}`} />
                    {isConnected ? 'Live' : 'Connecting...'}
                </div>

                <button className={styles.shareButton} onClick={copyInviteLink}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    {copied ? "Copied!" : "Copy Invite Link"}
                </button>
            </header>

            {participants.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0 1.5rem 0' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'white',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        border: '1px solid #f1f5f9'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)'
                            }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                                {participants.length} Online
                            </span>
                        </div>

                        <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }} />

                        <div style={{ display: 'flex' }}>
                            {participants.slice(0, 3).map((user, i) => (
                                <div key={user.id} title={user.username} style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: user.username === username
                                        ? 'linear-gradient(135deg, #10b981, #059669)'
                                        : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    border: '2px solid white',
                                    marginLeft: i > 0 ? '-6px' : '0',
                                    zIndex: 3 - i
                                }}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {participants.length > 3 && (
                                <div style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f8fafc',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold',
                                    border: '2px solid white',
                                    marginLeft: '-6px',
                                    zIndex: 0
                                }}>
                                    +{participants.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <main className={styles.gameArea}>
                {isMatch ? (
                    <div className={styles.placeholderCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>

                        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 800 }}>We have a winner! 🎉</h2>

                        {session?.pool.map(r => r.id === session.matched_id && (
                            <div key={r.id} style={{ textAlign: 'center', width: '100%' }}>

                                {r.photo_reference && (
                                    <div style={{
                                        width: '100%',
                                        height: '220px',
                                        borderRadius: '16px',
                                        backgroundImage: `url(https://places.googleapis.com/v1/${r.photo_reference}/media?maxHeightPx=800&maxWidthPx=800&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        marginBottom: '1.5rem',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                    }} />
                                )}

                                <h3 style={{ fontSize: '1.75rem', color: '#ff5a5f', fontWeight: 800, marginBottom: '0.5rem' }}>{r.name}</h3>
                                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{r.cuisine_tags?.join(', ') || r.formatted_address}</p>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '2rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700 }}>
                                        ⭐ {r.rating ? r.rating.toFixed(1) : 'New'}
                                        {r.user_ratings_total && <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>({r.user_ratings_total})</span>}
                                    </span>
                                    <span style={{ color: '#10b981', fontWeight: 800 }}>
                                        {Array(r.price_level || r.price_tier || 1).fill('$').join('')}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ backgroundColor: '#10b981', color: 'white', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                        </svg>
                                        Get Directions
                                    </a>
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        style={{ backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                                    >
                                        Leave Room
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    session ? (
                        <SwipeDeck pool={session.pool} onSwipe={sendSwipe} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6b7280' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}>
                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                <line x1="18" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                            </svg>
                            <span>Loading deck...</span>
                            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    )
                )}
            </main>
        </div>
    );
}
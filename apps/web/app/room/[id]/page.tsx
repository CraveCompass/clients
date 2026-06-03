"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import SwipeDeck from '../../../components/SwipeDeck';
import styles from './Room.module.css';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.id as string;

    const [userId, setUserId] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [isJoined, setIsJoined] = useState<boolean>(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const storedId = sessionStorage.getItem('crave_user_id');
        const storedName = sessionStorage.getItem('crave_username');

        if (storedId && storedName) {
            setUserId(storedId);
            setUsername(storedName);
            setIsJoined(true);
        }
    }, []);

    const { session, isConnected, isMatch, sendSwipe } = useSessionSocket(roomId, isJoined ? userId : '', username);

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

            <main className={styles.gameArea}>
                {isMatch ? (
                    <div className={styles.placeholderCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                            <path d="M4 22h16"></path>
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                        </svg>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>We have a winner!</h2>
                        {session?.pool.map(r => r.id === session.matched_id && (
                            <div key={r.id} style={{ textAlign: 'center', width: '100%' }}>
                                <h3 style={{ fontSize: '1.75rem', color: '#ff5a5f', fontWeight: 800, marginBottom: '0.5rem' }}>{r.name}</h3>
                                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{r.cuisine_tags?.join(', ')}</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`}
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
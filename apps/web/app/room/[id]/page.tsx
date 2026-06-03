"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import styles from './Room.module.css';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.id as string;

    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        let storedId = sessionStorage.getItem('crave_user_id');
        if (!storedId) {
            storedId = "user_" + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('crave_user_id', storedId);
        }
        setUserId(storedId);
    }, []);

    const { session, isConnected, isMatch, sendSwipe } = useSessionSocket(roomId, userId);

    if (!userId) return null;

    return (
        <div className={`mobile-container ${styles.container}`}>
            <header className={styles.header}>
                <h1 className={styles.title}>Room Code: {roomId.substring(0, 6).toUpperCase()}</h1>
                <div className={styles.status}>
                    <span className={`${styles.dot} ${isConnected ? styles.connected : ''}`} />
                    {isConnected ? 'Live' : 'Connecting...'}
                </div>
            </header>

            <main className={styles.deckContainer}>
                {isMatch ? (
                    <div className={styles.placeholderCard}>
                        <h2>🎉 We have a winner!</h2>
                    </div>
                ) : (
                    <div className={styles.placeholderCard}>
                        <h2>Swipe Deck Goes Here</h2>
                        <p>Waiting for the Swipe Component...</p>
                        <br />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => sendSwipe('rest_1', 'DISLIKE')}>Pass</button>
                            <button onClick={() => sendSwipe('rest_1', 'LIKE')}>Like</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
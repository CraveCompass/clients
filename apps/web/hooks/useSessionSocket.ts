"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { Session, VoteType } from '../lib/api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

export function useSessionSocket(sessionId: string, userId: string, username: string) {
    const [session, setSession] = useState<Session | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMatch, setIsMatch] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!sessionId || !userId) return;

        const socket = new WebSocket(`${WS_URL}?session_id=${sessionId}`);
        ws.current = socket;

        socket.onopen = () => {
            console.log('Connected to room:', sessionId);
            setIsConnected(true);

            if (username) {
                socket.send(JSON.stringify({
                    action: 'JOIN_ROOM',
                    user_id: userId,
                    username: username
                }));
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'SESSION_UPDATED') {
                    setSession(data.session);
                    if (data.is_match) {
                        setIsMatch(true);
                    }
                }
            } catch (err) {
                console.error("Failed to parse websocket message", err);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected from room');
            setIsConnected(false);
        };

        return () => {
            socket.close();
        };
    }, [sessionId, userId, username]);

    const sendSwipe = useCallback((restaurantId: string, vote: VoteType) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                action: 'SWIPE',
                user_id: userId,
                restaurant_id: restaurantId,
                vote: vote
            }));
        } else {
            console.error("WebSocket is not connected");
        }
    }, [userId]);

    return { session, isConnected, isMatch, sendSwipe };
}
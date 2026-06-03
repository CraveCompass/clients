"use client";

import { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Restaurant, VoteType } from '../lib/api';
import styles from './SwipeDeck.module.css';

interface SwipeDeckProps {
    pool: Restaurant[];
    onSwipe: (restaurantId: string, vote: VoteType) => void;
}

export default function SwipeDeck({ pool, onSwipe }: SwipeDeckProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!pool || pool.length === 0) {
        return <div className={styles.emptyState}>No restaurants found in this area.</div>;
    }

    if (currentIndex >= pool.length) {
        return (
            <div className={styles.emptyState}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Out of Cards</h2>
                <p>Waiting for the group to finish voting...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {[...pool].reverse().map((restaurant, index) => {
                const actualIndex = pool.length - 1 - index;
                const isTopCard = actualIndex === currentIndex;
                const isPastCard = actualIndex < currentIndex;

                if (isPastCard) return null;

                return (
                    <SwipeCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        isTop={isTopCard}
                        onSwipe={(vote) => {
                            onSwipe(restaurant.id, vote);
                            setCurrentIndex((prev) => prev + 1);
                        }}
                    />
                );
            })}
        </div>
    );
}

interface SwipeCardProps {
    restaurant: Restaurant;
    isTop: boolean;
    onSwipe: (vote: VoteType) => void;
}

function SwipeCard({ restaurant, isTop, onSwipe }: SwipeCardProps) {
    const controls = useAnimation();

    const x = useMotionValue(0);

    const rotate = useTransform(x, [-200, 200], [-15, 15]);

    const likeOpacity = useTransform(x, [20, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDragEnd = async (event: any, info: PanInfo) => {
        const swipeThreshold = 100;
        const velocityThreshold = 500;

        const isFastSwipe = Math.abs(info.velocity.x) > velocityThreshold;
        const isFarSwipe = Math.abs(info.offset.x) > swipeThreshold;

        if (isFastSwipe || isFarSwipe) {
            const direction = info.offset.x > 0 ? 'right' : 'left';

            await controls.start({
                x: direction === 'right' ? 500 : -500,
                y: info.offset.y + (info.velocity.y * 0.1),
                opacity: 0,
                transition: { duration: 0.3, ease: "easeOut" }
            });

            onSwipe(direction === 'right' ? 'LIKE' : 'DISLIKE');
        } else {
            controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } });
        }
    };

    return (
        <motion.div
            className={styles.card}
            style={{
                x,
                rotate,
                zIndex: isTop ? 10 : 1,
                scale: isTop ? 1 : 0.95,
                y: isTop ? 0 : 20,
            }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={isTop ? handleDragEnd : undefined}
            animate={controls}
            whileDrag={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className={styles.imagePlaceholder}>
                <motion.div className={`${styles.stamp} ${styles.stampLike}`} style={{ opacity: likeOpacity }}>
                    LIKE
                </motion.div>
                <motion.div className={`${styles.stamp} ${styles.stampNope}`} style={{ opacity: nopeOpacity }}>
                    PASS
                </motion.div>

                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
            </div>

            <div className={styles.info}>
                <h3 className={styles.name}>{restaurant.name}</h3>
                <p className={styles.tags}>
                    {restaurant.cuisine_tags && restaurant.cuisine_tags.length > 0
                        ? restaurant.cuisine_tags.join(' • ')
                        : 'Local Restaurant'}
                </p>
                <div className={styles.meta}>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', paddingBottom: '2px' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        {restaurant.rating.toFixed(1)}
                    </span>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>
                        {Array(restaurant.price_tier).fill('$').join('')}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
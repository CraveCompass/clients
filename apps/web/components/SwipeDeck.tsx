"use client";

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { Restaurant, VoteType } from '../lib/api';
import styles from './SwipeDeck.module.css';

interface SwipeDeckProps {
    pool: Restaurant[];
    filters?: { price_tiers: number[], min_rating: number, cuisines: string[] };
    onSwipe: (restaurantId: string, vote: VoteType) => void;
}

export default function SwipeDeck({ pool, filters, onSwipe }: SwipeDeckProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const topCard = pool && pool.length > 0 ? [...pool].reverse()[currentIndex] : null;

    useEffect(() => {
        if (!topCard || !filters) return;

        if (topCard.google_place_id) {
            let shouldSkip = false;

            if (filters.min_rating > 0 && (!topCard.rating || topCard.rating < filters.min_rating)) {
                shouldSkip = true;
            }
            if (filters.price_tiers && filters.price_tiers.length > 0) {
                const price = topCard.price_level || topCard.price_tier;
                if (price && !filters.price_tiers.includes(price)) {
                    shouldSkip = true;
                }
            }

            if (shouldSkip) {
                onSwipe(topCard.id, 'DISLIKE');
                setCurrentIndex(prev => prev + 1);
            }
        }
    }, [topCard, filters, onSwipe]);

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

    const hasStrictFilters = filters && (filters.min_rating > 0 || (filters.price_tiers && filters.price_tiers.length > 0));
    const isWaitingForEnrichment = hasStrictFilters && !topCard?.google_place_id;

    if (isWaitingForEnrichment) {
        return (
            <div className={styles.emptyState} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6b7280' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}>
                    <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                <span>Analyzing and filtering restaurants...</span>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
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

    const [showDetails, setShowDetails] = useState(false);

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
                overflow: 'hidden',
            }}
            drag={isTop && !showDetails ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={isTop && !showDetails ? handleDragEnd : undefined}
            animate={controls}
            whileDrag={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div
                className={styles.imagePlaceholder}
                style={restaurant.photo_reference ? {
                    backgroundImage: `url('https://places.googleapis.com/v1/${restaurant.photo_reference}/media?maxHeightPx=800&maxWidthPx=800&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            >
                <motion.div className={`${styles.stamp} ${styles.stampLike}`} style={{ opacity: likeOpacity }}>
                    LIKE
                </motion.div>
                <motion.div className={`${styles.stamp} ${styles.stampNope}`} style={{ opacity: nopeOpacity }}>
                    PASS
                </motion.div>

                {!restaurant.photo_reference && (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                        <path d="M7 2v20" />
                        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                    </svg>
                )}
            </div>

            <div className={styles.info}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 className={styles.name}>{restaurant.name}</h3>
                        <p className={styles.tags}>
                            {restaurant.cuisine_tags && restaurant.cuisine_tags.length > 0
                                ? restaurant.cuisine_tags.join(' • ')
                                : 'Local Restaurant'}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowDetails(true)}
                        style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.meta}>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', paddingBottom: '2px' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        {restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}
                        {restaurant.user_ratings_total && (
                            <span style={{ color: '#9ca3af', fontSize: '0.9rem', marginLeft: '4px' }}>
                                ({restaurant.user_ratings_total})
                            </span>
                        )}
                    </span>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>
                        {Array(restaurant.price_level || restaurant.price_tier || 1).fill('$').join('')}
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'white',
                            zIndex: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '1.5rem',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Details</h2>
                            <button
                                onClick={() => setShowDetails(false)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{restaurant.name}</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {restaurant.cuisine_tags?.map(tag => (
                                    <span key={tag} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>Location</h4>
                            <p style={{ color: '#334155', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                                {restaurant.formatted_address || "Address not available yet."}
                            </p>

                            {restaurant.opening_hours && restaurant.opening_hours.length > 0 ? (
                                <>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>Opening Hours</h4>
                                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#334155', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {restaurant.opening_hours.map((day, idx) => {
                                            const [dayName, times] = day.split(': ');
                                            return (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: idx !== restaurant.opening_hours!.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: idx !== restaurant.opening_hours!.length - 1 ? '0.25rem' : '0' }}>
                                                    <span style={{ fontWeight: 700, color: '#64748b' }}>{dayName}</span>
                                                    <span>{times}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginBottom: '1.5rem' }}>
                                    Hours not available
                                </div>
                            )}

                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>Menu Highlights</h4>
                            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                                Menu fetching coming soon...
                            </div>
                        </div>

                        <a
                            href={`http://googleusercontent.com/maps.google.com/?q=${restaurant.latitude},${restaurant.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ backgroundColor: '#1e293b', color: 'white', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, textAlign: 'center', marginTop: '1rem' }}
                        >
                            Open in Google Maps
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
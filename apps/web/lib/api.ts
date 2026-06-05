const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export type SessionStatus = 'ACTIVE' | 'MATCHED' | 'FINISHED' | 'HOST_TIE_BREAKER';
export type VoteType = 'DISLIKE' | 'LIKE' | 'SUPERLIKE';

export interface Participant {
    id: string;
    username: string;
}

export interface SessionFilters {
    price_tiers: number[];
    min_rating: number;
    cuisines: string[];
}

export interface Restaurant {
    id: string;
    osm_id: number;
    name: string;
    latitude: number;
    longitude: number;
    cuisine_tags: string[];
    price_tier: number;
    rating: number;
    created_at: string;
    google_place_id?: string;
    user_ratings_total?: number;
    price_level?: number;
    photo_reference?: string;
    opening_hours?: string[];
    formatted_address?: string;
}

export interface CreateSessionInput {
    host_id: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    priceTiers: number[],
    minRating: number,
    cuisines: string[]
}

export interface Session {
    id: string;
    host_id: string;
    status: SessionStatus;
    radius_meters: number;
    participants: Participant[];
    pool: Restaurant[];
    matched_id?: string;
    votes?: Record<string, Record<string, VoteType>>;
    tied_ids?: string[];
    filters: SessionFilters;
    created_at: string;
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
    const response = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create session: ${errorText}`);
    }

    return response.json();
}

export async function getTags(): Promise<string[]> {
    try {
        const res = await fetch(`${API_URL}/tags`);
        if (!res.ok) return [];
        const data = await res.json();
        return data || []; 
    } catch (error) {
        console.error("Failed to fetch tags:", error);
        return [];
    }
}
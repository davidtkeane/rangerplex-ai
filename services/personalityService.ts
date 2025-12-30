/**
 * AI Personality Matching Service
 * Intelligently matches user questions to the best AI personality
 */

import { AI_PERSONALITIES, AIPersonality, TOPIC_MATCHING, PersonalityMode } from '../types/personalities';

class PersonalityService {
    /**
     * Extract keywords from user question
     */
    private extractKeywords(text: string): string[] {
        const lowercaseText = text.toLowerCase();
        const keywords: string[] = [];

        // Check for each topic in the text
        Object.keys(TOPIC_MATCHING).forEach(topic => {
            if (lowercaseText.includes(topic)) {
                keywords.push(topic);
            }
        });

        // Also extract common technical terms
        const technicalTerms = [
            'code', 'program', 'debug', 'error', 'function', 'class', 'algorithm',
            'data', 'api', 'database', 'server', 'network', 'security', 'hack',
            'analyze', 'research', 'study', 'learn', 'teach', 'explain',
            'create', 'design', 'build', 'make', 'develop',
            'strategy', 'plan', 'solve', 'fix', 'optimize',
            'art', 'music', 'write', 'story', 'poem',
            'motivate', 'inspire', 'help', 'guide', 'advise',
        ];

        technicalTerms.forEach(term => {
            if (lowercaseText.includes(term)) {
                keywords.push(term);
            }
        });

        return keywords;
    }

    /**
     * Calculate match score for a personality based on keywords
     */
    private calculateMatchScore(keywords: string[], personality: AIPersonality): number {
        let score = 0;

        // Check topic matches
        keywords.forEach(keyword => {
            // Direct topic match
            if (personality.topics.some(topic => topic.toLowerCase().includes(keyword))) {
                score += 10;
            }

            // Expertise match
            if (personality.expertise.some(exp => exp.toLowerCase().includes(keyword))) {
                score += 8;
            }

            // Check if keyword maps to this personality in TOPIC_MATCHING
            if (TOPIC_MATCHING[keyword]?.includes(personality.id)) {
                score += 15;
            }
        });

        // Bonus for category relevance
        const categoryKeywords: Record<string, string[]> = {
            science: ['science', 'research', 'experiment', 'study', 'physics', 'chemistry', 'biology'],
            creative: ['art', 'music', 'create', 'design', 'write', 'story', 'creative'],
            innovation: ['innovation', 'invent', 'future', 'technology', 'startup', 'business'],
            strategy: ['strategy', 'plan', 'tactics', 'compete', 'win', 'leadership'],
            philosophy: ['philosophy', 'wisdom', 'ethics', 'meaning', 'think', 'meditate'],
            motivation: ['motivate', 'inspire', 'achieve', 'goal', 'success', 'excellence'],
            gaming: ['game', 'gaming', 'play', 'level', 'optimize', 'strategy'],
            technical: ['code', 'program', 'debug', 'hack', 'system', 'technical'],
        };

        keywords.forEach(keyword => {
            Object.entries(categoryKeywords).forEach(([category, terms]) => {
                if (terms.includes(keyword) && personality.category === category) {
                    score += 5;
                }
            });
        });

        return score;
    }

    /**
     * Match user question to best personality
     */
    matchPersonality(userQuestion: string): { personality: AIPersonality; confidence: number } {
        const keywords = this.extractKeywords(userQuestion);

        console.log('[Personality] Extracted keywords:', keywords);

        // Calculate scores for all personalities
        const scores = AI_PERSONALITIES.map(personality => ({
            personality,
            score: this.calculateMatchScore(keywords, personality),
        }));

        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);

        const best = scores[0];
        const maxPossibleScore = keywords.length * 15; // Max score per keyword
        const confidence = maxPossibleScore > 0
            ? Math.min(100, Math.round((best.score / maxPossibleScore) * 100))
            : 50; // Default 50% if no keywords

        console.log('[Personality] Best match:', best.personality.name, 'Score:', best.score, 'Confidence:', confidence + '%');

        // If confidence is too low, default to Colonel Ranger
        if (confidence < 30) {
            const defaultPersonality = AI_PERSONALITIES.find(p => p.id === 'colonel-ranger')!;
            return {
                personality: defaultPersonality,
                confidence: 50,
            };
        }

        return {
            personality: best.personality,
            confidence,
        };
    }

    /**
     * Get random personality
     */
    getRandomPersonality(): AIPersonality {
        const randomIndex = Math.floor(Math.random() * AI_PERSONALITIES.length);
        return AI_PERSONALITIES[randomIndex];
    }

    /**
     * Get personality by ID
     */
    getPersonalityById(id: string): AIPersonality | undefined {
        return AI_PERSONALITIES.find(p => p.id === id);
    }

    /**
     * Get all personalities
     */
    getAllPersonalities(): AIPersonality[] {
        return AI_PERSONALITIES;
    }

    /**
     * Get personalities by category
     */
    getPersonalitiesByCategory(category: string): AIPersonality[] {
        return AI_PERSONALITIES.filter(p => p.category === category);
    }

    /**
     * Get personality for conversation mode
     * Selects based on first message, then keeps same personality
     */
    getConversationPersonality(
        firstMessage: string,
        currentPersonalityId?: string
    ): AIPersonality {
        // If already have a personality for this conversation, keep it
        if (currentPersonalityId) {
            const existing = this.getPersonalityById(currentPersonalityId);
            if (existing) return existing;
        }

        // Otherwise, match based on first message
        const { personality } = this.matchPersonality(firstMessage);
        return personality;
    }

    /**
     * Select personality based on mode
     */
    selectPersonality(
        mode: PersonalityMode,
        userQuestion: string,
        fixedPersonalityId?: string,
        conversationPersonalityId?: string
    ): { personality: AIPersonality; confidence: number } {
        switch (mode) {
            case 'fixed':
                const fixed = fixedPersonalityId
                    ? this.getPersonalityById(fixedPersonalityId)
                    : AI_PERSONALITIES.find(p => p.id === 'colonel-ranger');
                return {
                    personality: fixed || AI_PERSONALITIES[0],
                    confidence: 100,
                };

            case 'auto-match':
                return this.matchPersonality(userQuestion);

            case 'random':
                return {
                    personality: this.getRandomPersonality(),
                    confidence: 100,
                };

            case 'conversation':
                const conversationPersonality = this.getConversationPersonality(
                    userQuestion,
                    conversationPersonalityId
                );
                return {
                    personality: conversationPersonality,
                    confidence: 100,
                };

            default:
                return this.matchPersonality(userQuestion);
        }
    }

    /**
     * Build system prompt with personality modifier
     */
    buildSystemPrompt(basePrompt: string, personality: AIPersonality): string {
        return `${basePrompt}\n\n${personality.systemPromptModifier}`;
    }

    /**
     * Get personality badge text
     */
    getPersonalityBadge(personality: AIPersonality, confidence?: number): string {
        if (confidence !== undefined && confidence < 100) {
            return `${personality.emoji} ${personality.name} (${confidence}% match)`;
        }
        return `${personality.emoji} ${personality.name}`;
    }
}

// Export singleton instance
export const personalityService = new PersonalityService();

export default personalityService;

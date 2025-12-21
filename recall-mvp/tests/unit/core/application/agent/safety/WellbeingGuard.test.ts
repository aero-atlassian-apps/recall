/**
 * Unit Tests for WellbeingGuard
 *
 * Tests safety guardrails for vulnerable users:
 * - Crisis detection
 * - Scam protection
 * - Escalation protocols
 * - Medical misinformation detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    WellbeingGuard,
    WellbeingConcern,
    RiskSeverity,
    ResponseType,
    ActionType,
    ScamType,
} from '../../../../lib/core/application/agent/safety/WellbeingGuard';
import { EmotionCategory, EmotionIntensity } from '../../../../lib/core/application/agent/persona/EmpathyEngine';

describe('WellbeingGuard', () => {
    let guard: WellbeingGuard;

    beforeEach(() => {
        guard = new WellbeingGuard();
    });

    describe('Wellbeing Assessment', () => {
        describe('Loneliness Detection', () => {
            it('detects loneliness from isolation language', () => {
                const assessment = guard.assessWellbeing('No one calls me anymore. I feel so alone.');

                expect(assessment.concerns.some(c => c.type === WellbeingConcern.LONELINESS)).toBe(true);
                expect(assessment.overallRisk).toBeGreaterThanOrEqual(RiskSeverity.LOW);
            });

            it('detects loneliness from abandonment phrases', () => {
                const assessment = guard.assessWellbeing("Nobody visits anymore. It's like I'm invisible.");

                const lonelinessConcern = assessment.concerns.find(c => c.type === WellbeingConcern.LONELINESS);
                expect(lonelinessConcern).toBeDefined();
            });
        });

        describe('Depression Detection', () => {
            it('detects depression from hopelessness language', () => {
                const assessment = guard.assessWellbeing("What's the point? Nothing matters anymore.");

                expect(assessment.concerns.some(c => c.type === WellbeingConcern.DEPRESSION)).toBe(true);
                expect(assessment.overallRisk).toBeGreaterThanOrEqual(RiskSeverity.MODERATE);
            });

            it('detects depression from anhedonia language', () => {
                const assessment = guard.assessWellbeing("I don't enjoy anything anymore. I've lost interest in everything.");

                expect(assessment.concerns.some(c => c.type === WellbeingConcern.DEPRESSION)).toBe(true);
            });
        });

        describe('Critical Risk Detection', () => {
            it('detects suicidal ideation as critical', () => {
                const assessment = guard.assessWellbeing("I don't want to live anymore. I want to end it all.");

                expect(assessment.overallRisk).toBe(RiskSeverity.CRITICAL);
                expect(assessment.requiresImmediateAction).toBe(true);
                expect(assessment.responseType).toBe(ResponseType.EMERGENCY);
            });

            it('detects self-harm indicators', () => {
                const assessment = guard.assessWellbeing('Sometimes I want to hurt myself to feel something.');

                expect(assessment.concerns.some(c => c.type === WellbeingConcern.SELF_HARM)).toBe(true);
                expect(assessment.overallRisk).toBe(RiskSeverity.CRITICAL);
            });

            it('detects medical emergency language', () => {
                const assessment = guard.assessWellbeing("I can't breathe! My chest hurts so much!");

                expect(assessment.concerns.some(c => c.type === WellbeingConcern.MEDICAL_EMERGENCY)).toBe(true);
                expect(assessment.responseType).toBe(ResponseType.EMERGENCY);
            });

            it('detects abuse indicators', () => {
                const assessment = guard.assessWellbeing('They hit me again. I am scared of them.');

                expect(assessment.concerns.some(c => c.type === WellbeingConcern.ABUSE)).toBe(true);
                expect(assessment.overallRisk).toBe(RiskSeverity.CRITICAL);
            });
        });

        describe('Cognitive Decline Detection', () => {
            it('detects disorientation', () => {
                const assessment = guard.assessWellbeing("I don't know where I am. What day is it?");

                expect(assessment.concerns.some(c =>
                    c.type === WellbeingConcern.COGNITIVE_DECLINE ||
                    c.type === WellbeingConcern.DISORIENTATION
                )).toBe(true);
            });

            it('detects memory concerns', () => {
                const assessment = guard.assessWellbeing("I keep forgetting things. I can't remember what I did.");

                expect(assessment.concerns.some(c => c.type === WellbeingConcern.COGNITIVE_DECLINE)).toBe(true);
            });
        });

        describe('Response Type Selection', () => {
            it('returns SUPPORTIVE for no concerns', () => {
                const assessment = guard.assessWellbeing('The weather is nice today.');

                expect(assessment.responseType).toBe(ResponseType.SUPPORTIVE);
                expect(assessment.concerns.length).toBe(0);
            });

            it('returns COMFORT for low risk', () => {
                const assessment = guard.assessWellbeing('I felt a bit upset earlier.');

                expect(assessment.responseType).toBe(ResponseType.COMFORT);
            });

            it('returns ENCOURAGE_HELP for moderate risk', () => {
                const assessment = guard.assessWellbeing('I am feeling really depressed lately. Everything is dark.');

                expect(assessment.responseType).toBe(ResponseType.ENCOURAGE_HELP);
            });

            it('returns SUGGEST_CONTACT for high risk', () => {
                const assessment = guard.assessWellbeing("I don't know what to do. I feel so hopeless and alone all the time.");

                expect(assessment.responseType).toBe(ResponseType.SUGGEST_CONTACT);
            });

            it('returns ESCALATE for critical non-emergency', () => {
                const assessment = guard.assessWellbeing("They take my money and won't let me leave the house.");

                expect(assessment.responseType).toBe(ResponseType.ESCALATE);
            });
        });

        describe('Recommended Actions', () => {
            it('recommends logging for any concern', () => {
                const assessment = guard.assessWellbeing('I feel a bit down today.');

                if (assessment.concerns.length > 0) {
                    expect(assessment.recommendedActions.some(a => a.type === ActionType.LOG)).toBe(true);
                }
            });

            it('recommends emergency services for critical situations', () => {
                const assessment = guard.assessWellbeing("I want to kill myself.");

                expect(assessment.recommendedActions.some(a => a.type === ActionType.CALL_EMERGENCY)).toBe(true);
            });

            it('recommends notifying caregiver for critical risks', () => {
                const assessment = guard.assessWellbeing("I don't want to live anymore.");

                expect(assessment.recommendedActions.some(a => a.type === ActionType.NOTIFY_CAREGIVER)).toBe(true);
            });

            it('recommends follow-up for moderate concerns', () => {
                const assessment = guard.assessWellbeing('I have been feeling lonely for weeks now.');

                expect(assessment.recommendedActions.some(a => a.type === ActionType.SCHEDULE_FOLLOWUP)).toBe(true);
            });
        });

        describe('Emotional State Correlation', () => {
            it('increases loneliness score with matching emotional state', () => {
                const emotionalState = {
                    primaryEmotion: EmotionCategory.LONELINESS,
                    intensity: EmotionIntensity.HIGH,
                    confidence: 0.8,
                    valence: -0.6,
                    arousal: 0.3,
                    triggers: [],
                    needsSupport: true,
                    recommendEscalation: false,
                    analysisDetails: {
                        textSignals: [],
                        combinedScore: 0.8,
                        timestamp: Date.now(),
                    },
                };

                const assessment = guard.assessWellbeing('I feel alone', emotionalState);

                const concern = assessment.concerns.find(c => c.type === WellbeingConcern.LONELINESS);
                expect(concern).toBeDefined();
            });
        });
    });

    describe('Scam Detection', () => {
        describe('Grandparent Scam', () => {
            it('detects grandparent scam pattern', () => {
                const result = guard.detectScam(
                    'Someone called saying my grandchild is in jail and needs bail money.'
                );

                expect(result.isScamDetected).toBe(true);
                expect(result.scamType).toBe(ScamType.GRANDPARENT);
                expect(result.riskLevel).toBe(RiskSeverity.CRITICAL);
            });
        });

        describe('Government Impersonation Scam', () => {
            it('detects IRS scam', () => {
                const result = guard.detectScam(
                    'The IRS called and said I owe back taxes and will be arrested.'
                );

                expect(result.isScamDetected).toBe(true);
                expect(result.scamType).toBe(ScamType.GOVERNMENT_IMPERSONATION);
            });

            it('detects Social Security scam', () => {
                const result = guard.detectScam(
                    'They said my social security is suspended and I need to pay immediately.'
                );

                expect(result.isScamDetected).toBe(true);
                expect(result.scamType).toBe(ScamType.GOVERNMENT_IMPERSONATION);
            });
        });

        describe('Tech Support Scam', () => {
            it('detects tech support scam', () => {
                const result = guard.detectScam(
                    'Microsoft called about my computer having a virus. They want remote access.'
                );

                expect(result.isScamDetected).toBe(true);
                expect(result.scamType).toBe(ScamType.TECH_SUPPORT);
            });
        });

        describe('Money Request Scam', () => {
            it('detects wire transfer request', () => {
                const result = guard.detectScam(
                    'They asked me to wire money via Western Union urgently.'
                );

                expect(result.isScamDetected).toBe(true);
                expect(result.scamType).toBe(ScamType.MONEY_REQUEST);
            });

            it('detects gift card scam', () => {
                const result = guard.detectScam(
                    'They want me to buy gift cards and send the codes.'
                );

                expect(result.isScamDetected).toBe(true);
                expect(result.redFlags.length).toBeGreaterThan(0);
            });
        });

        describe('Romance Scam', () => {
            it('detects romance scam indicators', () => {
                const result = guard.detectScam(
                    "I've fallen in love with someone online but never met in person. They need money to visit."
                );

                expect(result.isScamDetected).toBe(true);
                expect(result.scamType).toBe(ScamType.ROMANCE);
            });
        });

        describe('Lottery Scam', () => {
            it('detects lottery scam', () => {
                const result = guard.detectScam(
                    "You've won the lottery! Pay a fee to claim your prize of millions."
                );

                expect(result.isScamDetected).toBe(true);
                expect(result.scamType).toBe(ScamType.LOTTERY);
            });
        });

        describe('Non-Scam Messages', () => {
            it('does not flag normal conversation', () => {
                const result = guard.detectScam('My grandchild is coming to visit next week.');

                expect(result.isScamDetected).toBe(false);
            });

            it('does not flag legitimate money discussion', () => {
                const result = guard.detectScam('I need to transfer money to my savings account.');

                expect(result.isScamDetected).toBe(false);
            });
        });

        describe('Warning Generation', () => {
            it('generates appropriate warning for grandparent scam', () => {
                const result = guard.detectScam(
                    'They said my grandchild needs bail money urgently.'
                );

                expect(result.suggestedResponse).toContain('grandparent scam');
                expect(result.suggestedResponse).toContain('verify');
            });

            it('includes red flags in detection', () => {
                const result = guard.detectScam(
                    'The IRS said I owe money and will be arrested if I don\'t pay immediately.'
                );

                expect(result.redFlags.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Medical Misinformation Detection', () => {
        it('detects miracle cure claims', () => {
            const result = guard.checkMedicalMisinformation(
                'This miracle cure will heal everything.'
            );

            expect(result.detected).toBe(true);
            expect(result.topics).toContain('miracle cure');
        });

        it('detects anti-establishment medical claims', () => {
            const result = guard.checkMedicalMisinformation(
                "Doctors don't want you to know about this cure."
            );

            expect(result.detected).toBe(true);
        });

        it('provides disclaimer for medical topics', () => {
            const result = guard.checkMedicalMisinformation('Some health advice');

            expect(result.disclaimer.length).toBeGreaterThan(0);
        });

        it('does not flag normal health discussion', () => {
            const result = guard.checkMedicalMisinformation('I have a doctor appointment tomorrow.');

            expect(result.detected).toBe(false);
        });
    });

    describe('Medical Disclaimer Addition', () => {
        it('adds disclaimer to medical responses', () => {
            const response = 'You should rest and drink fluids.';
            const adapted = guard.addMedicalDisclaimer(response, true);

            expect(adapted).toContain("I'm not a doctor");
        });

        it('does not add disclaimer to non-medical responses', () => {
            const response = 'That sounds nice.';
            const adapted = guard.addMedicalDisclaimer(response, false);

            expect(adapted).toBe(response);
        });
    });

    describe('Escalation Management', () => {
        it('adds escalation contacts', () => {
            guard.addEscalationContact({
                name: 'John Smith',
                relationship: 'Son',
                phone: '555-1234',
                priority: 1,
                escalationLevel: RiskSeverity.HIGH,
            });

            const contacts = guard.getContactsForRisk(RiskSeverity.HIGH);
            expect(contacts.length).toBe(1);
            expect(contacts[0].name).toBe('John Smith');
        });

        it('returns contacts for appropriate risk level', () => {
            guard.addEscalationContact({
                name: 'Emergency Contact',
                relationship: 'Caregiver',
                phone: '555-9999',
                priority: 1,
                escalationLevel: RiskSeverity.CRITICAL,
            });

            guard.addEscalationContact({
                name: 'Family Contact',
                relationship: 'Daughter',
                phone: '555-1111',
                priority: 2,
                escalationLevel: RiskSeverity.MODERATE,
            });

            const moderateContacts = guard.getContactsForRisk(RiskSeverity.MODERATE);
            const criticalContacts = guard.getContactsForRisk(RiskSeverity.CRITICAL);

            expect(moderateContacts.length).toBe(1);
            expect(criticalContacts.length).toBe(2);
        });

        it('gets primary contact', () => {
            guard.addEscalationContact({
                name: 'Primary',
                relationship: 'Caregiver',
                phone: '555-0000',
                priority: 1,
                escalationLevel: RiskSeverity.LOW,
            });

            const primary = guard.getPrimaryContact();
            expect(primary?.name).toBe('Primary');
        });
    });

    describe('Pattern Tracking', () => {
        it('tracks recurring concerns', () => {
            // Trigger loneliness multiple times
            guard.assessWellbeing('I feel so lonely');
            guard.assessWellbeing('No one is here');
            guard.assessWellbeing('All alone again');
            guard.assessWellbeing('Nobody around');

            const recurring = guard.getRecurringConcerns();
            expect(recurring).toContain(WellbeingConcern.LONELINESS);
        });

        it('provides concern history', () => {
            guard.assessWellbeing('I feel sad');
            guard.assessWellbeing('I feel lonely');

            const history = guard.getConcernHistory();
            expect(history.size).toBeGreaterThan(0);
        });

        it('clears history', () => {
            guard.assessWellbeing('I feel sad');
            guard.clearHistory();

            const history = guard.getConcernHistory();
            expect(history.size).toBe(0);
        });
    });

    describe('Configuration', () => {
        it('respects custom min confidence', () => {
            const strictGuard = new WellbeingGuard({ minConfidence: 0.9 });
            const assessment = strictGuard.assessWellbeing('I feel a tiny bit sad');

            // High threshold may result in fewer detections
            expect(assessment.concerns.length).toBeLessThanOrEqual(
                guard.assessWellbeing('I feel a tiny bit sad').concerns.length
            );
        });

        it('respects recurrence threshold', () => {
            const guardWithHighThreshold = new WellbeingGuard({ recurrenceThreshold: 10 });

            for (let i = 0; i < 5; i++) {
                guardWithHighThreshold.assessWellbeing('I feel lonely');
            }

            const recurring = guardWithHighThreshold.getRecurringConcerns();
            expect(recurring.length).toBe(0); // Not enough to trigger with threshold of 10
        });
    });
});

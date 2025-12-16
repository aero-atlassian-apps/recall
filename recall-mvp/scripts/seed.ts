import { db } from '../lib/infrastructure/adapters/db';
import { users, sessions, chapters } from '../lib/infrastructure/adapters/db/schema';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Create a Test Senior User
    // Postgres UUID must be a valid UUID. 'test-senior-id' is not a valid UUID.
    const seniorId = '00000000-0000-0000-0000-000000000001';
    await db.insert(users).values({
      id: seniorId,
      email: 'senior@example.com',
      name: 'Grandpa Joe',
      role: 'senior',
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        topicsLove: ['Fishing', 'Jazz'],
        topicsAvoid: ['Politics'],
        timezone: 'UTC'
      }
    }).onConflictDoNothing();

    console.log('✅ Created Senior User: senior@example.com');

    // 2. Create a Test Family User
    const familyId = '00000000-0000-0000-0000-000000000002';
    await db.insert(users).values({
      id: familyId,
      email: 'family@example.com',
      name: 'Sally Granddaughter',
      role: 'family',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    console.log('✅ Created Family User: family@example.com');

    // 3. Create a Session
    const sessionId = randomUUID();
    await db.insert(sessions).values({
      id: sessionId,
      userId: seniorId,
      status: 'completed',
      startedAt: new Date(Date.now() - 86400000), // Yesterday
      endedAt: new Date(),
      transcriptRaw: JSON.stringify([
        { role: 'agent', content: 'Hello Joe, tell me about your first fishing trip.', timestamp: Date.now() - 86400000 },
        { role: 'user', content: 'Well, it was 1955, and my dad took me to the lake...', timestamp: Date.now() - 86300000 }
      ]),
      metadata: {
        // goal and durationSeconds are not in the schema definition for metadata
        // The schema only defines: strategy_usage, avg_response_length, sentiment_distribution
        strategy_usage: { "initial_greeting": 1 },
        avg_response_length: 50
      }
    }).onConflictDoNothing();

    console.log('✅ Created Session');

    // 4. Create a Chapter
    await db.insert(chapters).values({
      id: randomUUID(),
      sessionId: sessionId,
      userId: seniorId,
      title: 'The First Catch',
      content: 'It was a sunny morning in 1955 when Joe made his first catch...',
      excerpt: 'Joe made his first catch in 1955.',
      createdAt: new Date(),
      entities: [
        { type: 'topic', name: 'Nature', mentions: 1 },
        { type: 'place', name: 'The Lake', mentions: 1 }
      ]
    }).onConflictDoNothing();

    console.log('✅ Created Chapter');

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

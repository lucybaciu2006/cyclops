import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { WebRTCSession } from '../models/WebRTCSession';
import { WebRTCSessionStatus } from '../models/WebRTCSessionStatus';

dotenv.config();

const MONGO_URI = 'mongodb://localhost:27017';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function insertWebRTCSessions(propertyId: string) {
  const sessions = [
    {
      propertyId: propertyId,
      isTrial: true,
      status: WebRTCSessionStatus.ENDED,
      startedOn: Date.now() - 3600000,
      endedOn: Date.now() - 1800000,
      duration: 1800000,
      transcription: [
        {
          owner: 'user',
          content: "Hello, I'm interested in the property.",
          timestamp: Date.now() - 3500000
        },
        {
          owner: 'assistant',
          content: 'Great! I can show you the main features of this house.',
          timestamp: Date.now() - 3400000
        },
        {
          owner: 'user',
          content: "What's the square footage?",
          timestamp: Date.now() - 3300000
        }
      ],
      openAISecret: 'sk-demo-key-12345'
    },
    {
      propertyId: propertyId,
      isTrial: false,
      status: WebRTCSessionStatus.IN_PROGRESS,
      startedOn: Date.now() - 1800000,
      duration: 1800000,
      transcription: [
        {
          owner: 'user',
          content: 'Can you tell me about the neighborhood?',
          timestamp: Date.now() - 1700000
        },
        {
          owner: 'assistant',
          content: 'The neighborhood is very peaceful with great schools nearby.',
          timestamp: Date.now() - 1600000
        }
      ],
      openAISecret: 'sk-demo-key-67890'
    },
    {
      propertyId: propertyId,
      isTrial: false,
      status: WebRTCSessionStatus.NOT_STARTED,
      startedOn: Date.now(),
      duration: 0,
      transcription: [],
      openAISecret: 'sk-demo-key-24680'
    },
    {
      propertyId: propertyId,
      isTrial: true,
      status: WebRTCSessionStatus.REDIRECTED,
      startedOn: Date.now() - 7200000,
      endedOn: Date.now() - 7000000,
      duration: 200000,
      transcription: [
        {
          owner: 'user',
          content: 'I need to speak with a human agent.',
          timestamp: Date.now() - 7100000
        },
        {
          owner: 'assistant',
          content: "I'll connect you with a human agent right away.",
          timestamp: Date.now() - 7050000
        }
      ],
      openAISecret: 'sk-demo-key-13579'
    },
    {
      propertyId: propertyId,
      isTrial: false,
      status: WebRTCSessionStatus.ENDED,
      startedOn: Date.now() - 86400000,
      endedOn: Date.now() - 82800000,
      duration: 3600000,
      transcription: [
        {
          owner: 'user',
          content: 'How many bedrooms does this property have?',
          timestamp: Date.now() - 86000000
        },
        {
          owner: 'assistant',
          content: 'This property has 3 bedrooms and 2 bathrooms.',
          timestamp: Date.now() - 85900000
        },
        {
          owner: 'user',
          content: 'What about the garage?',
          timestamp: Date.now() - 85800000
        },
        {
          owner: 'assistant',
          content: 'It has a 2-car garage with additional storage space.',
          timestamp: Date.now() - 85700000
        }
      ],
      openAISecret: 'sk-demo-key-97531'
    }
  ];

  try {
    const result = await WebRTCSession.insertMany(sessions);
    console.log(`✅ Inserted session for propertyId "${propertyId}"`);
  } catch (error) {
    console.error('❌ Error inserting WebRTCSession data:', error);
  }
}

async function run() {
  const propertyId = (process.argv[2] || '').trim();
  if (!propertyId) {
    console.error('❌ Please provide a propertyId as an argument.');
    process.exit(1);
  }

  await connectToDatabase();
  await insertWebRTCSessions(propertyId);
  mongoose.connection.close();
  console.log('✅ Database connection closed');
}

run().catch(console.error);

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { topic, title, message } = JSON.parse(event.body);
    
    console.log('📢 Processing FCM notification:', { topic, title, message });

    const fcmMessage = {
      topic: topic,
      notification: {
        title: title,
        body: message,
      },
      data: {
        type: 'announcement',
        timestamp: Date.now().toString(),
      },
      android: {
        notification: {
          sound: 'default',
          color: '#1976D2'
        }
      }
    };

    const response = await admin.messaging().send(fcmMessage);
    console.log('✅ FCM sent:', response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        response: response
      })
    };

  } catch (error) {
    console.error('❌ FCM error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
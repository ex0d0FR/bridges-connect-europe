#!/usr/bin/env node

const SUPABASE_URL = 'https://ovoldtknfdyvyypadnmf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b2xkdGtuZmR5dnl5cGFkbm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzc5NDUsImV4cCI6MjA2ODcxMzk0NX0.9uwPMIYk88gx_NcKp91QxF7xS44E7q4UDJwRgoYspk0';

// REPLACE THIS WITH YOUR PHONE NUMBER
const TEST_PHONE = '+19287676457';

async function testDebugSMS() {
  console.log('🔧 DEBUG SMS Test');
  console.log(`📱 Testing with: ${TEST_PHONE}`);
  console.log('⚠️  IMPORTANT: Replace +15555551234 with your actual phone number in this script\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sms-config-test-debug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({
        phoneNumber: TEST_PHONE
      })
    });
    
    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}\n`);
    
    const data = await response.json();
    console.log('📋 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ SUCCESS! SMS sent successfully');
      console.log(`📧 Message ID: ${data.testResults.messageId}`);
      console.log(`📱 Check your phone: ${data.testResults.recipient}`);
    } else {
      console.log('\n❌ FAILED - Here are the details:');
      console.log(`   Error: ${data.error}`);
      
      if (data.debug) {
        console.log('\n🔍 Debug Information:');
        for (const [key, value] of Object.entries(data.debug)) {
          console.log(`   ${key}: ${value}`);
        }
      }
      
      if (data.twilioError) {
        console.log('\n🔧 Twilio API Error:');
        console.log(`   Code: ${data.twilioError.code}`);
        console.log(`   Message: ${data.twilioError.message}`);
        console.log(`   More Info: ${data.twilioError.more_info || 'N/A'}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testDebugSMS().catch(console.error);
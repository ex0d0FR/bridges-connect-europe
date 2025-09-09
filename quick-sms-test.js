#!/usr/bin/env node

/**
 * Quick SMS Test - No Interactive Input
 */

const SUPABASE_URL = 'https://ovoldtknfdyvyypadnmf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b2xkdGtuZmR5dnl5cGFkbm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzc5NDUsImV4cCI6MjA2ODcxMzk0NX0.9uwPMIYk88gx_NcKp91QxF7xS44E7q4UDJwRgoYspk0';

// Use a test phone number - replace with your actual number
const TEST_PHONE = '+15555551234'; // Replace with your phone number

async function testSMS() {
  console.log('🧪 Quick SMS Test...');
  console.log(`📱 Testing with: ${TEST_PHONE}`);
  console.log('🔄 Calling SMS config test function...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sms-config-test`, {
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
    
    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📄 Response Length: ${responseText.length} characters`);
    
    if (responseText.length > 0) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n📋 Parsed Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.error) {
          console.log('\n❌ ERROR DETAILS:');
          console.log(`   Message: ${data.error}`);
          console.log(`   Code: ${data.errorCode || 'N/A'}`);
          console.log(`   Category: ${data.errorCategory || 'N/A'}`);
          
          if (data.twilioError) {
            console.log('\n🔧 TWILIO API ERROR:');
            console.log(`   Twilio Code: ${data.twilioError.code}`);
            console.log(`   Twilio Message: ${data.twilioError.message}`);
            console.log(`   More Info: ${data.twilioError.more_info || 'N/A'}`);
          }
        }
        
      } catch (parseError) {
        console.log('❌ JSON Parse Error:', parseError.message);
        console.log('\n📄 Raw Response:');
        console.log(responseText);
      }
    } else {
      console.log('❌ Empty response from server');
    }
    
  } catch (error) {
    console.log('❌ Network/Fetch Error:', error.message);
    console.log('   Check if the development server is running and accessible');
  }
}

testSMS().catch(console.error);
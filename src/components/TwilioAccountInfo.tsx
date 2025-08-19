import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, MessageSquare, Globe, Building } from "lucide-react"

interface TwilioAccountInfoProps {
  settings?: {
    twilio_account_name?: string;
    twilio_phone_number?: string;
    twilio_friendly_name?: string;
    whatsapp_business_name?: string;
    whatsapp_phone_numbers?: string[];
  };
}

export function TwilioAccountInfo({ settings }: TwilioAccountInfoProps) {
  const accountData = {
    accountName: settings?.twilio_account_name || "Bridges",
    friendlyName: settings?.twilio_friendly_name || "Bridges Paris",
    region: "United States",
    smsPhoneNumber: settings?.twilio_phone_number || "+19287676457",
    whatsappNumbers: settings?.whatsapp_phone_numbers || ["15557932346", "15551620883"],
    businessName: settings?.whatsapp_business_name || "Bridges - Puentes - Paris Bridges 2025"
  };

  return (
    <div className="space-y-4">
      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Twilio Account Overview
          </CardTitle>
          <CardDescription>
            Your Twilio account configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Account Name</div>
              <div className="text-lg font-semibold">{accountData.accountName}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Friendly Name</div>
              <div className="text-lg font-semibold">{accountData.friendlyName}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Region</div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{accountData.region}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Account Status</div>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            SMS Configuration
          </CardTitle>
          <CardDescription>
            Phone numbers configured for SMS messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="font-medium">{accountData.smsPhoneNumber}</div>
                <div className="text-sm text-muted-foreground">Primary SMS Number</div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">SMS Enabled</Badge>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Business Configuration
          </CardTitle>
          <CardDescription>
            WhatsApp Business numbers and display information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Business Display Name</div>
              <div className="font-medium text-lg">{accountData.businessName}</div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">WhatsApp Numbers</div>
              <div className="space-y-2">
                {accountData.whatsappNumbers.map((number, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">+1{number}</div>
                      <div className="text-sm text-muted-foreground">WhatsApp Business Number</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        WhatsApp Enabled
                      </Badge>
                      <Badge variant="outline">Verified</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
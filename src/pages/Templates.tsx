import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, MessageSquare, Globe } from "lucide-react"

export default function Templates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Create and manage email and message templates
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Template Types */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <Mail className="h-8 w-8 mx-auto text-primary" />
            <CardTitle className="text-lg">Email Templates</CardTitle>
            <CardDescription>
              Create personalized email invitations
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full">
              Create Email Template
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-primary" />
            <CardTitle className="text-lg">SMS Templates</CardTitle>
            <CardDescription>
              Short message templates for mobile outreach
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full">
              Create SMS Template
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <Globe className="h-8 w-8 mx-auto text-primary" />
            <CardTitle className="text-lg">Multi-language</CardTitle>
            <CardDescription>
              Templates in English and French
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full">
              Manage Languages
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Existing Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>
            Manage your existing message templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-4">No templates created yet.</div>
            <p className="text-sm mb-4">
              Start by creating your first template for the Missionary Bridges Conference invitation.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Conference Invitation Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

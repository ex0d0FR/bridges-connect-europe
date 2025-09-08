import { useState } from "react"
import { MoreVertical, Edit, Trash2, Copy, Play, Pause, BarChart3 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Campaign } from "@/hooks/useCampaigns"

interface CampaignActionsDropdownProps {
  campaign: Campaign
  onEdit: (campaign: Campaign) => void
  onDelete: (campaignId: string) => void
  onDuplicate: (campaign: Campaign) => void
  onStatusChange: (campaignId: string, status: string) => void
  isDeleting?: boolean
}

export function CampaignActionsDropdown({
  campaign,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  isDeleting = false
}: CampaignActionsDropdownProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    onDelete(campaign.id)
    setShowDeleteDialog(false)
  }

  const canPause = campaign.status === 'active'
  const canResume = campaign.status === 'paused'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onEdit(campaign)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Campaign
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onDuplicate(campaign)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link to={`/campaigns/${campaign.id}`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {canPause && (
            <DropdownMenuItem onClick={() => onStatusChange(campaign.id, 'paused')}>
              <Pause className="mr-2 h-4 w-4" />
              Pause Campaign
            </DropdownMenuItem>
          )}

          {canResume && (
            <DropdownMenuItem onClick={() => onStatusChange(campaign.id, 'active')}>
              <Play className="mr-2 h-4 w-4" />
              Resume Campaign
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Campaign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign "{campaign.name}" and all associated data. 
              This action cannot be undone.
              {campaign.status === 'active' && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  Warning: This campaign is currently active. Deleting it will stop all ongoing activities.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
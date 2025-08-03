import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useCreateChurch, CreateChurchData } from "@/hooks/useChurches";
import { validateEmail, validatePhone, validateUrl, sanitizeText, formatPhoneNumber } from "@/lib/validation";
import { toast } from "sonner";

interface AddChurchDialogProps {
  trigger?: React.ReactNode;
}

const AddChurchDialog = ({ trigger }: AddChurchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateChurchData>({
    name: "",
    email: "",
    phone: "",
    website: "",
    facebook: "",
    instagram: "",
    contact_name: "",
    country: "France",
    address: "",
    city: "",
    postal_code: "",
    denomination: "",
    size_category: "",
    notes: "",
  });

  const createChurch = useCreateChurch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Church name is required");
      return;
    }

    // Validate email if provided
    if (formData.email && !validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate phone if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Validate URLs if provided
    if (formData.website && !validateUrl(formData.website)) {
      toast.error("Please enter a valid website URL");
      return;
    }
    if (formData.facebook && !validateUrl(formData.facebook)) {
      toast.error("Please enter a valid Facebook URL");
      return;
    }

    // Sanitize and prepare data
    const cleanedData = Object.fromEntries(
      Object.entries(formData)
        .filter(([_, value]) => value !== "")
        .map(([key, value]) => {
          if (key === 'phone' && value) {
            return [key, formatPhoneNumber(value)];
          }
          if (typeof value === 'string') {
            return [key, sanitizeText(value)];
          }
          return [key, value];
        })
    ) as CreateChurchData;

    await createChurch.mutateAsync(cleanedData);
    setOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      contact_name: "",
      country: "France",
      address: "",
      city: "",
      postal_code: "",
      denomination: "",
      size_category: "",
      notes: "",
    });
  };

  const handleInputChange = (field: keyof CreateChurchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Church
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Church</DialogTitle>
          <DialogDescription>
            Add a new church to your database for outreach campaigns.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Church Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange("contact_name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange("postal_code", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="Italy">Italy</SelectItem>
                  <SelectItem value="Spain">Spain</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Netherlands">Netherlands</SelectItem>
                  <SelectItem value="Belgium">Belgium</SelectItem>
                  <SelectItem value="Switzerland">Switzerland</SelectItem>
                  <SelectItem value="Austria">Austria</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="denomination">Denomination</Label>
              <Input
                id="denomination"
                value={formData.denomination}
                onChange={(e) => handleInputChange("denomination", e.target.value)}
                placeholder="e.g., Baptist, Methodist, Catholic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size_category">Size Category</Label>
              <Select value={formData.size_category} onValueChange={(value) => handleInputChange("size_category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small (1-50)">Small (1-50)</SelectItem>
                  <SelectItem value="Medium (51-200)">Medium (51-200)</SelectItem>
                  <SelectItem value="Large (201-500)">Large (201-500)</SelectItem>
                  <SelectItem value="Very Large (500+)">Very Large (500+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => handleInputChange("facebook", e.target.value)}
                placeholder="https://facebook.com/"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any additional notes about this church..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createChurch.isPending}>
              {createChurch.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Church
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChurchDialog;
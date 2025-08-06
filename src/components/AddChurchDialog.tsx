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
import { useLanguage } from "@/contexts/LanguageContext";

interface AddChurchDialogProps {
  trigger?: React.ReactNode;
}

const AddChurchDialog = ({ trigger }: AddChurchDialogProps) => {
  const { t } = useLanguage();
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
      toast.error(t('validation.churchNameRequired'));
      return;
    }

    // Validate email if provided
    if (formData.email && !validateEmail(formData.email)) {
      toast.error(t('validation.invalidEmail'));
      return;
    }

    // Validate phone if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error(t('validation.invalidPhone'));
      return;
    }

    // Validate URLs if provided
    if (formData.website && !validateUrl(formData.website)) {
      toast.error(t('validation.invalidUrl'));
      return;
    }
    if (formData.facebook && !validateUrl(formData.facebook)) {
      toast.error(t('validation.invalidUrl'));
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
            {t('churches.addChurch')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('churches.addNewChurch')}</DialogTitle>
          <DialogDescription>
            {t('churches.startByAdding')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('forms.churchName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t('placeholders.enterChurchName')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">{t('forms.contactName')}</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange("contact_name", e.target.value)}
                placeholder={t('placeholders.enterContactName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('forms.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t('placeholders.enterEmail')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('forms.phone')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder={t('placeholders.enterPhone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('forms.address')}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder={t('placeholders.enterAddress')}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t('forms.city')}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder={t('placeholders.enterCity')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">{t('forms.postalCode')}</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange("postal_code", e.target.value)}
                placeholder={t('placeholders.enterPostalCode')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('forms.country')}</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectCountry')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="France">{t('countries.france')}</SelectItem>
                  <SelectItem value="Germany">{t('countries.germany')}</SelectItem>
                  <SelectItem value="Italy">{t('countries.italy')}</SelectItem>
                  <SelectItem value="Spain">{t('countries.spain')}</SelectItem>
                  <SelectItem value="United Kingdom">{t('countries.unitedKingdom')}</SelectItem>
                  <SelectItem value="Netherlands">{t('countries.netherlands')}</SelectItem>
                  <SelectItem value="Belgium">{t('countries.belgium')}</SelectItem>
                  <SelectItem value="Switzerland">{t('countries.switzerland')}</SelectItem>
                  <SelectItem value="Austria">{t('countries.austria')}</SelectItem>
                  <SelectItem value="Other">{t('countries.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="denomination">{t('forms.denomination')}</Label>
              <Input
                id="denomination"
                value={formData.denomination}
                onChange={(e) => handleInputChange("denomination", e.target.value)}
                placeholder={t('placeholders.enterDenomination')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size_category">{t('forms.sizeCategory')}</Label>
              <Select value={formData.size_category} onValueChange={(value) => handleInputChange("size_category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectSize')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small (1-50)">{t('churchSizes.small')}</SelectItem>
                  <SelectItem value="Medium (51-200)">{t('churchSizes.medium')}</SelectItem>
                  <SelectItem value="Large (201-500)">{t('churchSizes.large')}</SelectItem>
                  <SelectItem value="Very Large (500+)">{t('churchSizes.veryLarge')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">{t('forms.website')}</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder={t('placeholders.enterWebsite')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">{t('forms.facebook')}</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => handleInputChange("facebook", e.target.value)}
                placeholder={t('placeholders.enterFacebook')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('forms.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder={t('placeholders.enterNotes')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createChurch.isPending}>
              {createChurch.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('churches.addChurch')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChurchDialog;
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getNeedById, updateNeed } from "@/services/api";

const EditNeed = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost: '',
    quantity: '',
    priority: 'normal' as 'urgent' | 'high' | 'normal',
    category: '',
    org_type: 'other',
    needed_by: '',
    is_perishable: false,
    bundle_tag: 'other' as 'basic_food' | 'winter_clothing' | 'hygiene_kit' | 'cleaning_supplies' | 'beautification' | 'other',
    service_required: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not manager
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'manager')) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  // Fetch need data
  useEffect(() => {
    const fetchNeed = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await getNeedById(parseInt(id));
        
        // Handle both response formats
        const need = response.need || response;
        
        if (need) {
          setFormData({
            title: need.title || '',
            description: need.description || '',
            cost: need.cost !== undefined ? String(need.cost) : '',
            quantity: need.quantity !== undefined ? String(need.quantity) : '',
            priority: need.priority || 'normal',
            category: need.category || '',
            org_type: need.org_type || 'other',
            needed_by: need.needed_by ? need.needed_by.slice(0, 10) : '',
            is_perishable: Boolean(need.is_perishable),
            bundle_tag: need.bundle_tag || 'other',
            service_required: Boolean(need.service_required),
          });
        } else {
          toast({
            title: "Error",
            description: "Need not found",
            variant: "destructive"
          });
          navigate("/dashboard");
        }
      } catch (err) {
        console.error('Error fetching need:', err);
        toast({
          title: "Error",
          description: "Failed to load need",
          variant: "destructive"
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchNeed();
  }, [id, navigate, toast]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.cost || isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'Cost must be a positive number';
    }

    if (!formData.quantity || isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive whole number';
    }

    if (formData.needed_by) {
      const selectedDate = new Date(formData.needed_by);
      if (isNaN(selectedDate.getTime())) {
        newErrors.needed_by = 'Please provide a valid date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    setSubmitting(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        cost: parseFloat(formData.cost),
        quantity: parseInt(formData.quantity),
        priority: formData.priority,
        category: formData.category.trim() || null,
        org_type: formData.org_type,
        needed_by: formData.needed_by || null,
        is_perishable: formData.is_perishable ? 1 : 0,
        bundle_tag: formData.bundle_tag,
        service_required: formData.service_required ? 1 : 0,
      };

      const response = await updateNeed(parseInt(id), updateData);

      if (response.success !== false) {
        toast({
          title: "Need updated!",
          description: `${formData.title} has been updated successfully.`,
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update need",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error updating need:', err);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalCost = formData.cost && formData.quantity 
    ? (parseFloat(formData.cost) * parseInt(formData.quantity)).toFixed(2)
    : '0.00';

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'manager') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="container mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Edit Need
            </h1>
            <p className="text-muted-foreground mt-2">
              Update the details of this need
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Need Details</CardTitle>
            <CardDescription>
              Update the information about this need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Rice - 50kg bags"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detailed description of what you need and why..."
                  rows={4}
                />
              </div>

              {/* Cost and Quantity */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cost">
                    Cost per Item ($) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', e.target.value)}
                    placeholder="25.00"
                    className={errors.cost ? "border-destructive" : ""}
                  />
                  {errors.cost && (
                    <p className="text-sm text-destructive">{errors.cost}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Quantity Needed <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    placeholder="50"
                    className={errors.quantity ? "border-destructive" : ""}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity}</p>
                  )}
                </div>
              </div>

              {/* Priority and Category */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: 'urgent' | 'high' | 'normal') => handleChange('priority', value)}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="e.g., Food, Clothing, Education"
                  />
                </div>
              </div>

              {/* Organization Type */}
              <div className="space-y-2">
                <Label htmlFor="org_type">Organization Type</Label>
                <Select value={formData.org_type} onValueChange={(value) => handleChange('org_type', value)}>
                  <SelectTrigger id="org_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food_bank">Food Bank</SelectItem>
                    <SelectItem value="animal_shelter">Animal Shelter</SelectItem>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="homeless_shelter">Homeless Shelter</SelectItem>
                    <SelectItem value="disaster_relief">Disaster Relief</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Needed By and Perishable */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="needed_by">Needed By</Label>
                  <Input
                    id="needed_by"
                    type="date"
                    value={formData.needed_by}
                    onChange={(e) => handleChange('needed_by', e.target.value)}
                    className={errors.needed_by ? "border-destructive" : ""}
                  />
                  {errors.needed_by && (
                    <p className="text-sm text-destructive">{errors.needed_by}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_perishable"
                        checked={formData.is_perishable}
                        onCheckedChange={(checked) => handleChange('is_perishable', checked)}
                      />
                      <Label htmlFor="is_perishable" className="font-normal cursor-pointer">
                        Mark as Perishable
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="service_required"
                        checked={formData.service_required}
                        onCheckedChange={(checked) => handleChange('service_required', checked)}
                      />
                      <Label htmlFor="service_required" className="font-normal cursor-pointer">
                        Service / Volunteer Task Required
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bundle Tag */}
              <div className="space-y-2">
                <Label htmlFor="bundle_tag">Bundle Tag</Label>
                <Select value={formData.bundle_tag} onValueChange={(value: any) => handleChange('bundle_tag', value)}>
                  <SelectTrigger id="bundle_tag">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="other">No bundle</SelectItem>
                    <SelectItem value="basic_food">Basic Food Box</SelectItem>
                    <SelectItem value="hygiene_kit">Hygiene Kit</SelectItem>
                    <SelectItem value="winter_clothing">Winter Clothing Drive</SelectItem>
                    <SelectItem value="cleaning_supplies">Cleaning Supplies</SelectItem>
                    <SelectItem value="beautification">Neighborhood Beautification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Total Cost Preview */}
              {formData.cost && formData.quantity && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total if fully funded:</span>
                      <span className="text-2xl font-bold text-primary">${totalCost}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Need
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={submitting}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditNeed;


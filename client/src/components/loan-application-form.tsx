import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoanApplication } from "@/types/loan";
import { industries, ownerSchema } from "@shared/schema";
import { PrivacyConsentDialog } from "./privacy-consent-dialog";
import { Trash2 } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  yearsInBusiness: z.string().min(1, "Years in business is required"),
  annualRevenue: z.string().min(1, "Annual revenue is required"),
  loanAmount: z.string().min(1, "Loan amount is required"),
  email: z.string().email("Invalid email address"),
  businessOwners: z.array(z.object({
    name: z.string().min(1, "Owner name is required"),
    ownership: z.string().min(1, "Ownership percentage is required")
      .refine(val => !isNaN(Number(val)), "Must be a number")
      .refine(val => Number(val) > 0 && Number(val) <= 100, "Must be between 1 and 100")
  })).min(1, "At least one business owner is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface LoanApplicationFormProps {
  onApplicationSubmit: (application: LoanApplication) => void;
}

export default function LoanApplicationForm({ onApplicationSubmit }: LoanApplicationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [privacyConsentAccepted, setPrivacyConsentAccepted] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      industry: "",
      yearsInBusiness: "",
      annualRevenue: "",
      loanAmount: "",
      email: "",
      businessOwners: [{ name: "", ownership: "" }],
    },
  });
  
  // Set up field array for managing business owners
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "businessOwners",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // If files contain financial documents, ask for consent
      if (!privacyConsentAccepted) {
        setPendingUploadFiles(newFiles);
        setShowPrivacyConsent(true);
      } else {
        // User already accepted privacy consent, add files directly
        addFiles(newFiles);
      }
      
      // Reset the input so the same file can be selected again if needed
      e.target.value = '';
    }
  };
  
  const addFiles = (files: File[]) => {
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };
  
  const removeFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const handlePrivacyAccept = () => {
    setPrivacyConsentAccepted(true);
    setShowPrivacyConsent(false);
    
    // Add the pending files
    if (pendingUploadFiles.length > 0) {
      addFiles(pendingUploadFiles);
      setPendingUploadFiles([]);
    }
  };
  
  const handlePrivacyDecline = () => {
    setShowPrivacyConsent(false);
    setPendingUploadFiles([]);
    
    toast({
      title: "Upload Canceled",
      description: "Document upload was canceled. You can still submit your application without documents.",
      variant: "default",
    });
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Step 1: Create the loan application
      const response = await apiRequest("POST", "/api/loan-applications", data);
      const application: LoanApplication = await response.json();
      console.log("Application created successfully:", application);

      // Step 2: Upload documents if provided
      if (selectedFiles && selectedFiles.length > 0) {
        console.log("Uploading files:", selectedFiles);
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("documents", selectedFiles[i]);
        }

        try {
          const uploadResponse = await fetch(`/api/loan-applications/${application.id}/documents`, {
            method: "POST",
            body: formData,
          });

          console.log("Upload response status:", uploadResponse.status);
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("Document upload failed:", errorText);
            toast({
              title: "Document Upload Issue",
              description: "Files were uploaded but couldn't be processed. Your application was still submitted.",
              variant: "destructive",
            });
            onApplicationSubmit(application);
            return;
          }

          const updatedApplication = await uploadResponse.json();
          console.log("Application updated with documents:", updatedApplication);
          onApplicationSubmit(updatedApplication);
        } catch (uploadError) {
          console.error("Error during document upload:", uploadError);
          toast({
            title: "Document Upload Failed",
            description: "There was an error uploading your documents, but your application was submitted.",
            variant: "destructive",
          });
          onApplicationSubmit(application);
        }
      } else {
        console.log("No files to upload, submitting application as-is");
        onApplicationSubmit(application);
      }

      // Reset form
      form.reset();
      setSelectedFiles([]);

      toast({
        title: "Application Submitted",
        description: "Your loan application has been submitted successfully.",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-neutral-200">
      <CardHeader className="border-b border-neutral-200">
        <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center">
          <i className="fas fa-file-alt text-primary mr-2"></i>
          Business Loan Application
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Privacy Consent Dialog */}
        <PrivacyConsentDialog
          open={showPrivacyConsent}
          onAccept={handlePrivacyAccept}
          onDecline={handlePrivacyDecline}
        />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">
                      Business Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter business name" 
                        {...field} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">
                      Industry <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearsInBusiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">
                      Years in Business <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="e.g. 5" 
                        {...field} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annualRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">
                      Annual Revenue ($) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-neutral-500">$</span>
                        </div>
                        <Input 
                          type="text" 
                          placeholder="e.g. 1,000,000" 
                          value={field.value 
                            ? Number(field.value).toLocaleString('en-US') 
                            : ''}
                          onChange={(e) => {
                            // Get cursor position before update
                            const cursorPosition = e.target.selectionStart || 0;
                            const previousValue = e.target.value;
                            
                            // Extract only digits from input
                            const rawValue = e.target.value.replace(/[^\d]/g, '');
                            
                            // Format with commas for display
                            const formattedValue = rawValue === '' ? '' : 
                              Number(rawValue).toLocaleString('en-US');
                            
                            // Update the form field with raw value
                            field.onChange(rawValue);
                            
                            // Calculate new cursor position (accounting for commas)
                            setTimeout(() => {
                              // Count how many commas were added/removed to adjust cursor
                              const commasBefore = (previousValue.slice(0, cursorPosition).match(/,/g) || []).length;
                              const commasAfter = (formattedValue.slice(0, cursorPosition).match(/,/g) || []).length;
                              const adjustment = commasAfter - commasBefore;
                              
                              // Set cursor position
                              e.target.setSelectionRange(
                                cursorPosition + adjustment, 
                                cursorPosition + adjustment
                              );
                            }, 0);
                          }}
                          className="pl-8 pr-3 py-2 w-full border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">
                      Requested Loan Amount ($) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-neutral-500">$</span>
                        </div>
                        <Input 
                          type="text" 
                          placeholder="e.g. 250,000" 
                          value={field.value 
                            ? Number(field.value).toLocaleString('en-US') 
                            : ''}
                          onChange={(e) => {
                            // Get cursor position before update
                            const cursorPosition = e.target.selectionStart || 0;
                            const previousValue = e.target.value;
                            
                            // Extract only digits from input
                            const rawValue = e.target.value.replace(/[^\d]/g, '');
                            
                            // Format with commas for display
                            const formattedValue = rawValue === '' ? '' : 
                              Number(rawValue).toLocaleString('en-US');
                            
                            // Update the form field with raw value
                            field.onChange(rawValue);
                            
                            // Calculate new cursor position (accounting for commas)
                            setTimeout(() => {
                              // Count how many commas were added/removed to adjust cursor
                              const commasBefore = (previousValue.slice(0, cursorPosition).match(/,/g) || []).length;
                              const commasAfter = (formattedValue.slice(0, cursorPosition).match(/,/g) || []).length;
                              const adjustment = commasAfter - commasBefore;
                              
                              // Set cursor position
                              e.target.setSelectionRange(
                                cursorPosition + adjustment, 
                                cursorPosition + adjustment
                              );
                            }, 0);
                          }}
                          className="pl-8 pr-3 py-2 w-full border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">
                      Contact Email <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="name@example.com" 
                        {...field} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <FormLabel className="block text-sm font-medium text-neutral-700 mb-1">
                Upload Financial Documents <span className="text-red-500">*</span>
              </FormLabel>
              <div 
                className="border-2 border-dashed border-neutral-300 rounded-md p-4"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('bg-primary-50', 'border-primary-300');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('bg-primary-50', 'border-primary-300');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('bg-primary-50', 'border-primary-300');
                  
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const validFiles = Array.from(e.dataTransfer.files).filter(
                      file => file.type === 'application/pdf'
                    );
                    
                    if (validFiles.length > 0) {
                      // If files contain financial documents, ask for consent
                      if (!privacyConsentAccepted) {
                        setPendingUploadFiles(validFiles);
                        setShowPrivacyConsent(true);
                      } else {
                        // User already accepted privacy consent, add files directly
                        addFiles(validFiles);
                      }
                      // Update the form state for fileUploaded
                      form.setValue('fileUploaded' as any, true);
                    } else {
                      toast({
                        title: "Invalid file type",
                        description: "Please upload PDF files only",
                        variant: "destructive"
                      });
                    }
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <i className="fas fa-cloud-upload-alt text-3xl text-neutral-400"></i>
                  <p className="text-sm text-neutral-500 text-center">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-neutral-400 text-center">
                    Upload tax returns, financial statements, and other relevant documents (PDF only)
                  </p>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="px-4 py-2 bg-primary-50 text-primary-600 rounded-md text-sm font-medium hover:bg-primary-100 transition">
                      Select Files
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-4 text-sm text-neutral-600">
                  <p className="font-medium mb-2">Selected Files ({selectedFiles.length})</p>
                  <ul className="space-y-2 max-h-40 overflow-y-auto border border-neutral-200 rounded-md p-2">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                          <span className="truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-neutral-400 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile(index)} 
                          className="text-neutral-400 hover:text-red-500 p-1 rounded-full"
                          aria-label="Remove file"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary text-white rounded-md font-medium shadow-sm hover:bg-primary-600 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition flex items-center"
              >
                <i className="fas fa-calculator mr-2"></i>
                {isSubmitting ? "Processing..." : "Submit & Calculate Score"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

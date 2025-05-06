import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { industries } from "@shared/schema";

// Form validation schema
const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  yearsInBusiness: z.string().min(1, "Years in business is required"),
  annualRevenue: z.string().min(1, "Annual revenue is required"),
  loanAmount: z.string().min(1, "Loan amount is required"),
  email: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof formSchema>;

interface LoanApplicationFormProps {
  onApplicationSubmit: (application: LoanApplication) => void;
}

export default function LoanApplicationForm({ onApplicationSubmit }: LoanApplicationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      industry: "",
      yearsInBusiness: "",
      annualRevenue: "",
      loanAmount: "",
      email: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
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
      setSelectedFiles(null);

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
                          type="number" 
                          min="0" 
                          placeholder="e.g. 1000000" 
                          {...field} 
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
                          type="number" 
                          min="1000" 
                          placeholder="e.g. 250000" 
                          {...field} 
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
              <div className="border-2 border-dashed border-neutral-300 rounded-md p-4">
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
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-2 text-sm text-neutral-600">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center">
                      <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                      {file.name}
                    </div>
                  ))}
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

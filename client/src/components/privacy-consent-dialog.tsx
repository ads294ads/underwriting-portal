import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PrivacyConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function PrivacyConsentDialog({
  open,
  onAccept,
  onDecline,
}: PrivacyConsentDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Document Analysis Privacy Notice</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Please read carefully before uploading financial documents.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <h3 className="text-lg font-medium">How We Process Your Documents</h3>
          <p>
            To analyze your financial documents, our system uses secure artificial intelligence services 
            from external providers. This process involves:
          </p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Document Transmission:</strong> Your document data will be sent to our AI service providers 
              for analysis. The document content is encrypted in transit.
            </li>
            <li>
              <strong>Analysis Process:</strong> AI systems will review your financial documents to assess 
              key metrics, identify strengths and weaknesses, and evaluate how they impact your loan eligibility.
            </li>
            <li>
              <strong>External Processing:</strong> Your documents will be processed by Perplexity and/or OpenAI API 
              services. Please be aware that while we have strict agreements with these providers, their privacy 
              policies will also apply to your data.
            </li>
          </ul>
          
          <h3 className="text-lg font-medium pt-2">Your Privacy Protection</h3>
          <p>
            We take your data privacy seriously and have implemented several safeguards:
          </p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Enhanced Encryption:</strong> All stored documents are protected with AES-256-GCM encryption.
            </li>
            <li>
              <strong>Access Controls:</strong> Only authorized personnel can access your documents and analysis results.
            </li>
            <li>
              <strong>Data Retention:</strong> Documents are only retained for the period necessary to complete your 
              loan application process, after which they are securely deleted from our systems.
            </li>
          </ul>
          
          <h3 className="text-lg font-medium pt-2">Your Consent</h3>
          <p>
            By clicking "I Understand and Accept", you acknowledge and consent to:
          </p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li>The transmission of your document data to our AI service providers</li>
            <li>The processing of your financial information as described above</li>
            <li>The application of our service providers' privacy policies to your data</li>
          </ul>
          
          <p className="text-sm italic mt-4">
            If you do not consent, you may still proceed with your loan application, but we will not be 
            able to perform enhanced document analysis, which may affect your application's evaluation.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDecline} className="sm:mr-2">
            Decline
          </Button>
          <Button onClick={onAccept} className="bg-blue-600 hover:bg-blue-700">
            I Understand and Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
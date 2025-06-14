
import React, { useState, useRef } from 'react';
import { useMerchantApplication } from '@/hooks/useMerchantApplication';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import DocumentList from './DocumentList';

const DocumentUploader: React.FC = () => {
    const { application, uploadDoc, isUploading } = useMerchantApplication();
    const [file, setFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !documentType) {
            alert("Please select a file and enter a document type.");
            return;
        }
        await uploadDoc({ file, document_type: documentType });
        setFile(null);
        setDocumentType('');
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Business Documents</CardTitle>
                <CardDescription>Upload required documents for verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <DocumentList documents={application?.documents || []} />

                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Upload a New Document</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                           <Label htmlFor="document-type">Document Type</Label>
                           <Input 
                               id="document-type"
                               value={documentType}
                               onChange={(e) => setDocumentType(e.target.value)}
                               placeholder="e.g., Proof of Incorporation"
                           />
                       </div>
                       <div className="space-y-2">
                           <Label htmlFor="file-upload">File</Label>
                           <Input id="file-upload" type="file" onChange={handleFileChange} ref={fileInputRef}/>
                       </div>
                    </div>
                    <Button onClick={handleUpload} disabled={!file || !documentType || isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload Document
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default DocumentUploader;

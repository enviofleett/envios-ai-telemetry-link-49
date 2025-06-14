
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import { MerchantApplicationDocument } from '@/types/merchant-application';

interface DocumentListProps {
    documents: MerchantApplicationDocument[];
}

const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
    return (
        <div>
            <h4 className="font-medium mb-2">Uploaded Documents</h4>
            {documents && documents.length > 0 ? (
                <ul className="space-y-2">
                    {documents.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span>{doc.document_type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {doc.verified ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" title="Verified" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" title="Not Verified" />
                                )}
                                <Button variant="link" size="sm" asChild>
                                    <a href={`/storage/v1/object/public/merchant-documents/${doc.file_path}`} target="_blank" rel="noreferrer">View</a>
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No documents were uploaded.</p>
            )}
        </div>
    )
}

export default DocumentList;

'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, Loader2, Download } from 'lucide-react';

interface BulkImportLeadsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type ImportResult = {
    totalRows: number;
    created: number;
    updated: number;
    failed: number;
    errors: { row: number; message: string }[];
};

export function BulkImportLeadsDialog({ open, onOpenChange }: BulkImportLeadsDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    const accept = '.csv,.xlsx,.xls';

    const templateCsv = useMemo(() => {
        const header = ['email', 'firstName', 'lastName', 'company', 'mobile', 'status', 'source', 'assigneeId', 'nextFollowUp', 'industry', 'description'];
        const example = ['john@example.com', 'John', 'Doe', 'Acme Corp', '+919999999999', 'COLD_LEAD', 'OTHER', '', '2026-12-31', 'Manufacturing', 'Interested in demo'];
        return `${header.join(',')}\n${example.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')}\n`;
    }, []);

    const downloadTemplate = () => {
        const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads-import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const importMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error('No file selected');

            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post('/leads/bulk-import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data as ImportResult;
        },
        onSuccess: (data) => {
            setResult(data);
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            toast({
                title: 'Import complete',
                description: `Created ${data.created}, updated ${data.updated}, failed ${data.failed}`,
            });
        },
        onError: (err: any) => {
            toast({
                title: 'Import failed',
                description: err.response?.data?.message || err.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const reset = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) reset();
            }}
        >
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Leads</DialogTitle>
                    <DialogDescription>
                        Upload a CSV or Excel file to create or update leads. Duplicate rule: if email exists, we update that lead.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                        <div className="text-sm text-muted-foreground">
                            Supported: CSV, XLSX. Max file size: 5MB. Max rows: 2000.
                        </div>
                        <Button variant="outline" size="sm" className="gap-2" onClick={downloadTemplate}>
                            <Download className="h-4 w-4" />
                            Template
                        </Button>
                    </div>

                    <div className="border-2 border-dashed rounded-lg p-6 bg-muted/20">
                        {file ? (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{file.name}</div>
                                    <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={reset}>
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <FileText className="h-4 w-4" />
                                    Choose file
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lead-import-file">File</Label>
                                    <Input
                                        id="lead-import-file"
                                        ref={fileInputRef}
                                        type="file"
                                        accept={accept}
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] || null;
                                            setFile(f);
                                            setResult(null);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {result && (
                        <Alert>
                            <AlertTitle>Import summary</AlertTitle>
                            <AlertDescription>
                                <div className="text-sm">
                                    Rows: {result.totalRows}
                                </div>
                                <div className="text-sm">
                                    Created: {result.created} | Updated: {result.updated} | Failed: {result.failed}
                                </div>
                                {result.errors?.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-auto text-xs text-muted-foreground">
                                        {result.errors.slice(0, 50).map((e, idx) => (
                                            <div key={idx}>
                                                Row {e.row}: {e.message}
                                            </div>
                                        ))}
                                        {result.errors.length > 50 && (
                                            <div>...and {result.errors.length - 50} more</div>
                                        )}
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button
                        onClick={() => importMutation.mutate()}
                        disabled={!file || importMutation.isPending}
                        className="gap-2"
                    >
                        {importMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

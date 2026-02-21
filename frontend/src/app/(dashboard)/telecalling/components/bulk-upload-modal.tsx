'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamMembers: any[];
}

export function BulkUploadModal({ isOpen, onClose, teamMembers }: BulkUploadModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('text');
    const [rawText, setRawText] = useState('');
    const [batchName, setBatchName] = useState('');
    const [source, setSource] = useState('Manual Upload');
    const [assigneeId, setAssigneeId] = useState<string>('unassigned');
    const [fileOptions, setFileOptions] = useState<File | null>(null);

    const uploadMutation = useMutation({
        mutationFn: async (payload: any) => {
            return apiClient.post('/raw-leads/bulk-upload', payload);
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['raw-leads'] });
            toast({
                title: 'Data Imported Successfully',
                description: `Inserted ${res.data.inserted} new records. Skipped ${res.data.duplicatesSkipped} duplicates.`,
            });
            handleClose();
        },
        onError: (err: any) => {
            toast({
                title: 'Upload Failed',
                description: err.response?.data?.message || 'Check your data format and try again.',
                variant: 'destructive',
            });
        }
    });

    const handleClose = () => {
        setRawText('');
        setBatchName('');
        setFileOptions(null);
        setAssigneeId('unassigned');
        onClose();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileOptions(e.target.files[0]);
        }
    };

    const onSubmit = async () => {
        let leadsToUpload: { phone: string, notes?: string }[] = [];

        if (activeTab === 'text') {
            // Parse raw text: expect one phone number per line, optionally followed by a comma and notes
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
            leadsToUpload = lines.map(line => {
                const parts = line.split(',');
                const phone = parts[0].trim();
                const notes = parts.slice(1).join(',').trim();
                return { phone, notes: notes || undefined };
            });
        } else if (activeTab === 'file' && fileOptions) {
            // Read file content
            const text = await fileOptions.text();
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);

            // Skip header if it looks like one
            if (lines[0].toLowerCase().includes('phone')) {
                lines.shift();
            }

            leadsToUpload = lines.map(line => {
                const parts = line.split(',');
                const phone = parts[0].trim();
                const notes = parts.slice(1).join(',').trim();
                return { phone, notes: notes || undefined };
            });
        }

        // Validate basic rules
        leadsToUpload = leadsToUpload.filter(l => l.phone.length >= 7);

        if (leadsToUpload.length === 0) {
            toast({ title: 'No valid data', description: 'Could not find any phone numbers to upload.', variant: 'destructive' });
            return;
        }

        const payload = {
            batchName: batchName || `Upload ${new Date().toISOString().split('T')[0]}`,
            source,
            assigneeId: assigneeId === 'unassigned' ? undefined : assigneeId,
            leads: leadsToUpload
        };

        uploadMutation.mutate(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Raw Leads</DialogTitle>
                    <DialogDescription>
                        Import phone numbers for telecalling list. You can paste numbers or upload a CSV file.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Batch Name</Label>
                            <Input
                                placeholder="e.g. November Campaign"
                                value={batchName}
                                onChange={e => setBatchName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Assign to (Optional)</Label>
                            <Select value={assigneeId} onValueChange={setAssigneeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                                    {teamMembers?.map((m: any) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.firstName} {m.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="text">Copy & Paste</TabsTrigger>
                            <TabsTrigger value="file">Upload CSV</TabsTrigger>
                        </TabsList>

                        <TabsContent value="text" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Raw Data</Label>
                                <Textarea
                                    placeholder="9876543210, Need to call&#10;9876543211, Follow up later"
                                    className="min-h-[150px] font-mono text-sm"
                                    value={rawText}
                                    onChange={e => setRawText(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Format: Phone, Notes (Optional) - one per line.</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="file" className="space-y-4 mt-4">
                            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20">
                                {fileOptions ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        <div className="font-medium text-sm mt-2">{fileOptions.name}</div>
                                        <div className="text-xs text-muted-foreground">{(fileOptions.size / 1024).toFixed(1)} KB</div>
                                        <Button variant="ghost" size="sm" onClick={() => setFileOptions(null)} className="mt-2 text-rose-600">
                                            Remove File
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-4 cursor-pointer">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <FileText className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Click to upload CSV</div>
                                            <p className="text-xs text-muted-foreground mt-1">First column must be Phone, second column Notes</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".csv,.txt"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={onSubmit}
                        disabled={uploadMutation.isPending || (activeTab === 'text' && !rawText) || (activeTab === 'file' && !fileOptions)}
                    >
                        {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Upload className="mr-2 h-4 w-4" />
                        Import Data
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

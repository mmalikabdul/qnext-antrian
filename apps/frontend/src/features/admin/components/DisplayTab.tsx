import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Film, Text, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '../services/admin.service';
import { AppSetting } from '@/types/queue';
import { cn } from '@/lib/utils';

const colorSchemes = {
    "default": "Skema Biru (Default)",
    "forest": "Skema Hijau Hutan",
    "sunset": "Skema Oranye Senja",
    "modern": "Skema Modern (Hitam Putih)",
};

const soundOptions = [
    { value: 'chime.mp3', label: 'Nada 1 (Ting-Nung)' },
    { value: 'ding.mp3', label: 'Nada 2 (Ding)' },
    { value: 'bell.mp3', label: 'Nada 3 (Airport Bell)' },
];

export const DisplayTab = () => {
    const [settings, setSettings] = useState<AppSetting>({
        videoUrl: '',
        footerText: '',
        colorScheme: 'default',
        soundUrl: 'chime.mp3'
    });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        adminService.getSettings().then(setSettings);
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await adminService.updateSettings(settings);
            toast({ variant: 'success', title: 'Sukses', description: 'Pengaturan disimpan' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan pengaturan' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pengaturan Tampilan Monitor</CardTitle>
                <CardDescription>Visual, Video, dan Suara</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Palette/> Skema Warna</Label>
                    <RadioGroup 
                        value={settings.colorScheme} 
                        onValueChange={(value) => setSettings(prev => ({...prev, colorScheme: value}))}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {Object.entries(colorSchemes).map(([key, label]) => (
                             <Label key={key} htmlFor={`color-${key}`} className={cn(
                                 "border rounded-lg p-4 cursor-pointer transition-all",
                                 settings.colorScheme === key ? "ring-2 ring-primary" : "ring-1 ring-border"
                             )}>
                                <RadioGroupItem value={key} id={`color-${key}`} className="sr-only"/>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-5 h-5 rounded-full scheme-bg-${key}`}></div>
                                    <span className="font-semibold">{label}</span>
                                </div>
                             </Label>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Film /> URL Video Playlist (YouTube Embed)</Label>
                    <Input 
                        value={settings.videoUrl} 
                        onChange={(e) => setSettings(prev => ({...prev, videoUrl: e.target.value }))}
                        placeholder="https://www.youtube.com/embed/..."
                    />
                </div>

                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Text /> Teks Berjalan (Footer)</Label>
                    <Textarea 
                        value={settings.footerText}
                        onChange={(e) => setSettings(prev => ({...prev, footerText: e.target.value }))}
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Volume2 /> Suara Notifikasi Pembuka</Label>
                    <Select 
                        value={settings.soundUrl}
                        onValueChange={(value) => setSettings(prev => ({...prev, soundUrl: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih suara" />
                        </SelectTrigger>
                        <SelectContent>
                            {soundOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Suara ini akan dimainkan sebelum pengumuman nomor antrian.</p>
                </div>

                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
            </CardContent>
            <style jsx>{`
                .scheme-bg-default { background-color: #003049; }
                .scheme-bg-forest { background-color: #2F4F4F; }
                .scheme-bg-sunset { background-color: #E67E22; }
                .scheme-bg-modern { background-color: #111827; }
            `}</style>
        </Card>
    );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface AlbumSettingsData {
  minStoriesForAlbum: number;
  pageSize: string;
  margins: number;
  fontFamily: string;
  fontSizeBody: number;
  fontSizeTitles: number;
  imageStyleDefault: string;
}

interface AlbumSettingsProps {
  settings: AlbumSettingsData;
  onChange: (settings: AlbumSettingsData) => void;
}

const AlbumSettings: React.FC<AlbumSettingsProps> = ({ settings, onChange }) => {
  const updateSetting = (key: keyof AlbumSettingsData, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurazione Album</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Minimo storie per album</Label>
            <Input
              type="number"
              min="1"
              value={settings.minStoriesForAlbum}
              onChange={(e) => updateSetting('minStoriesForAlbum', parseInt(e.target.value) || 5)}
            />
          </div>

          <div className="space-y-2">
            <Label>Formato pagina</Label>
            <Select value={settings.pageSize} onValueChange={(v) => updateSetting('pageSize', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4-portrait">A4 Verticale</SelectItem>
                <SelectItem value="A4-landscape">A4 Orizzontale</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Margini (mm)</Label>
            <Input
              type="number"
              min="5"
              max="50"
              value={settings.margins}
              onChange={(e) => updateSetting('margins', parseInt(e.target.value) || 20)}
            />
          </div>

          <div className="space-y-2">
            <Label>Stile immagini predefinito</Label>
            <Select value={settings.imageStyleDefault} onValueChange={(v) => updateSetting('imageStyleDefault', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fotografico">Fotografico</SelectItem>
                <SelectItem value="fumetto">Fumetto</SelectItem>
                <SelectItem value="astratto">Astratto</SelectItem>
                <SelectItem value="manga">Manga</SelectItem>
                <SelectItem value="acquarello">Acquarello</SelectItem>
                <SelectItem value="carboncino">Carboncino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font famiglia</Label>
            <Select value={settings.fontFamily} onValueChange={(v) => updateSetting('fontFamily', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Times">Times New Roman</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Courier">Courier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dimensione font corpo</Label>
            <Input
              type="number"
              min="8"
              max="16"
              value={settings.fontSizeBody}
              onChange={(e) => updateSetting('fontSizeBody', parseInt(e.target.value) || 12)}
            />
          </div>

          <div className="space-y-2">
            <Label>Dimensione font titoli</Label>
            <Input
              type="number"
              min="12"
              max="24"
              value={settings.fontSizeTitles}
              onChange={(e) => updateSetting('fontSizeTitles', parseInt(e.target.value) || 18)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumSettings;

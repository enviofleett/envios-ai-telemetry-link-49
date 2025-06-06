
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail } from 'lucide-react';
import { providers } from './SMTPProviderGuide/providerConfigs';
import ProviderCard from './SMTPProviderGuide/ProviderCard';
import SetupStepsTab from './SMTPProviderGuide/SetupStepsTab';
import SMTPConfigTab from './SMTPProviderGuide/SMTPConfigTab';
import DNSConfigTab from './SMTPProviderGuide/DNSConfigTab';
import TestingTab from './SMTPProviderGuide/TestingTab';

const SMTPProviderGuide: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>('resend');
  const [copiedText, setCopiedText] = useState<string>('');

  const provider = providers[selectedProvider];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">SMTP Provider Setup Guide</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose and configure a reliable 3rd-party SMTP provider for your email delivery
        </p>
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Choose Your Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(providers).map(([key, prov]) => (
              <ProviderCard
                key={key}
                providerKey={key}
                provider={prov}
                isSelected={selectedProvider === key}
                onSelect={setSelectedProvider}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Details */}
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup Steps</TabsTrigger>
          <TabsTrigger value="config">SMTP Config</TabsTrigger>
          <TabsTrigger value="dns">DNS Records</TabsTrigger>
          <TabsTrigger value="test">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <SetupStepsTab provider={provider} selectedProvider={selectedProvider} />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <SMTPConfigTab 
            provider={provider} 
            copiedText={copiedText} 
            onCopyToClipboard={copyToClipboard} 
          />
        </TabsContent>

        <TabsContent value="dns" className="space-y-4">
          <DNSConfigTab 
            providerName={provider.name}
            dnsRecords={provider.dnsRecords} 
            onCopyToClipboard={copyToClipboard} 
          />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <TestingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SMTPProviderGuide;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { gdprComplianceService, DataProcessingActivity } from '@/services/security/GDPRComplianceService';
import { Shield, FileText, Users, Download, AlertTriangle, CheckCircle } from 'lucide-react';

export const GDPRComplianceManager: React.FC = () => {
  const [activities, setActivities] = useState<DataProcessingActivity[]>([]);
  const [complianceReport, setComplianceReport] = useState<any>(null);
  const [crossBorderSafeguards, setCrossBorderSafeguards] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = () => {
    setActivities(gdprComplianceService.getDataProcessingActivities());
    setComplianceReport(gdprComplianceService.generateComplianceReport());
    setCrossBorderSafeguards(gdprComplianceService.getCrossBorderTransferSafeguards());
  };

  const enforceRetentionPolicies = async () => {
    try {
      await gdprComplianceService.enforceDataRetention();
      toast({
        title: "Data Retention Enforced",
        description: "Retention policies have been applied successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enforce retention policies",
        variant: "destructive"
      });
    }
  };

  const downloadComplianceReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      complianceReport,
      dataProcessingActivities: activities,
      crossBorderTransfers: crossBorderSafeguards
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gdpr-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GDPR Compliance Management</h2>
          <p className="text-muted-foreground">
            Data protection compliance monitoring and management
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={enforceRetentionPolicies} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Enforce Retention
          </Button>
          <Button onClick={downloadComplianceReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      {complianceReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Activities</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceReport.dataProcessingActivities}</div>
              <Badge variant="secondary" className="mt-2">
                All Documented
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cross-border Transfers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceReport.activeCrossBorderTransfers}</div>
              <Badge variant="secondary" className="mt-2">
                Safeguards Applied
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Policies</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {complianceReport.retentionPoliciesEnforced ? 'Active' : 'Inactive'}
              </div>
              <Badge variant={complianceReport.retentionPoliciesEnforced ? 'secondary' : 'destructive'} className="mt-2">
                {complianceReport.retentionPoliciesEnforced ? 'Enforced' : 'Action Required'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last DPIA</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor((Date.now() - complianceReport.lastDataProtectionImpactAssessment.getTime()) / (24 * 60 * 60 * 1000))}d
              </div>
              <Badge variant="default" className="mt-2">
                Days Ago
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Processing Activities</TabsTrigger>
          <TabsTrigger value="transfers">Cross-border Transfers</TabsTrigger>
          <TabsTrigger value="rights">Data Subject Rights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Processing Activities Register</CardTitle>
              <CardDescription>
                Article 30 GDPR - Records of processing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Legal Basis</TableHead>
                    <TableHead>Data Categories</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Cross-border</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{activity.purpose}</TableCell>
                      <TableCell>{activity.legalBasis}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {activity.dataCategories.slice(0, 2).map(category => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                          {activity.dataCategories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{activity.dataCategories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{activity.retentionPeriod}</TableCell>
                      <TableCell>
                        <Badge variant={activity.crossBorderTransfers ? 'default' : 'secondary'}>
                          {activity.crossBorderTransfers ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-border Data Transfer Safeguards</CardTitle>
              <CardDescription>
                Article 44-49 GDPR - International data transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crossBorderSafeguards.map((transfer, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{transfer.service}</h4>
                    <div className="space-y-1">
                      {transfer.safeguards.map((safeguard: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{safeguard}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Rights Management</CardTitle>
              <CardDescription>
                Articles 15-22 GDPR - Rights of the data subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Available Rights:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Right of access (Article 15)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Right to rectification (Article 16)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Right to erasure (Article 17)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Right to data portability (Article 20)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Right to object (Article 21)
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Request Processing:</h4>
                  <div className="text-sm space-y-2">
                    <p><strong>Response Time:</strong> Within 1 month</p>
                    <p><strong>Identity Verification:</strong> Required</p>
                    <p><strong>Format:</strong> JSON, CSV, or PDF</p>
                    <p><strong>Fees:</strong> Free (unless excessive)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Recommendations</CardTitle>
              <CardDescription>
                Actions to maintain and improve GDPR compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complianceReport?.recommendations && (
                <div className="space-y-3">
                  {complianceReport.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

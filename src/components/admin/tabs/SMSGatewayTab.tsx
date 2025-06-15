import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { smsService } from '@/services/smsService';

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  sender: z.string().min(2, {
    message: "Sender ID must be at least 2 characters.",
  }),
  route: z.string().optional(),
});

const SMSGatewayTab = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [smsConfig, setSmsConfig] = useState<any>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      sender: "",
      route: "1",
    },
  });

  const fetchConfig = async () => {
    const config = await smsService.getSMSConfiguration();
    setSmsConfig(config);
    setConfigLoaded(true);
  };

  useEffect(() => {
    fetchConfig();

    const recheckConfig = () => {
      fetchConfig();
    };
    window.addEventListener('smsConfigUpdated', recheckConfig);

    return () => {
      window.removeEventListener('smsConfigUpdated', recheckConfig);
    };
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await smsService.validateAndSaveCredentials({
        username: values.username,
        password: values.password,
        sender: values.sender,
        route: values.route || "1",
      });

      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        });
        setBalance(result.balance || "N/A");
        form.reset();
        fetchConfig();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save credentials.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save credentials.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  }

  const handleTestSMS = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const testNumber = "+2348030000000";
      const testMessage = "This is a test SMS from FleetIQ.";
      const result = await smsService.sendSMS(testNumber, testMessage);

      if (result.success) {
        setTestResult(`Test SMS sent successfully to ${testNumber}!`);
        toast({
          title: "Success!",
          description: `Test SMS sent successfully to ${testNumber}!`,
        });
      } else {
        setTestResult(`Failed to send test SMS: ${result.error}`);
        toast({
          title: "Error",
          description: `Failed to send test SMS: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestResult(`Error sending test SMS: ${error.message}`);
      toast({
        title: "Error",
        description: `Error sending test SMS: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCheckBalance = async () => {
    setIsBalanceLoading(true);
    try {
      const result = await smsService.getProviderBalance();
      if (result.success) {
        setBalance(result.balance || "N/A");
        toast({
          title: "Balance Fetched",
          description: `Current balance: ${result.balance}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch balance.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch balance.",
        variant: "destructive",
      });
    } finally {
      setIsBalanceLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>SMS Gateway Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="SMS API Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="SMS API Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Sender ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="route"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route</FormLabel>
                    <FormControl>
                      <Input placeholder="Route" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isTesting}>
                {isTesting ? "Testing..." : "Test & Save (Encrypted)"}
              </Button>
            </form>
          </Form>

          <div className="mt-4">
            <Button onClick={handleCheckBalance} disabled={isBalanceLoading}>
              {isBalanceLoading ? "Checking Balance..." : "Check Balance"}
            </Button>
            {balance && <p className="mt-2">Current Balance: {balance}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Production SMS Testing</CardTitle>
        </CardHeader>
        <CardContent>
          {smsConfig ? (
            <>
              <Button onClick={handleTestSMS} disabled={isTesting}>
                {isTesting ? "Sending..." : "Send Production Test SMS"}
              </Button>
              {testResult && <p className="mt-2">{testResult}</p>}
            </>
          ) : (
            <div className="alert alert-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L12 4.775 4.206 15.053c-.771 1.33 1.912 3 1.732 3z"
                />
              </svg>
              <span>
                Configuration Required: Please configure and save your SMS
                credentials first.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSGatewayTab;

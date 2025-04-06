import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EmailTemplate } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Preview } from '@/components/ui/preview';

// Define form validation schema
const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Email subject is required'),
  htmlContent: z.string().min(1, 'Email content is required'),
});

type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;

interface EmailEditorProps {
  template?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onCancel?: () => void;
}

export default function EmailEditor({ template, onSave, onCancel }: EmailEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const { toast } = useToast();

  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: template?.name || '',
      subject: template?.subject || '',
      htmlContent: template?.htmlContent || getDefaultTemplate(),
    },
  });

  // Update preview when HTML content changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'htmlContent' || !name) {
        setPreviewHtml(value.htmlContent || '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = async (values: EmailTemplateFormValues) => {
    setIsSubmitting(true);
    try {
      let response;
      
      if (template) {
        // Update existing template
        response = await apiRequest('PUT', `/api/email-templates/${template.id}`, values);
      } else {
        // Create new template
        response = await apiRequest('POST', '/api/email-templates', values);
      }
      
      const savedTemplate = await response.json();
      
      toast({
        title: template ? "Template Updated" : "Template Created",
        description: `Email template has been ${template ? 'updated' : 'created'} successfully`,
      });
      
      // Invalidate templates query to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      
      if (onSave) {
        onSave(savedTemplate);
      }
    } catch (error) {
      toast({
        title: template ? "Failed to Update Template" : "Failed to Create Template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{template ? 'Edit Email Template' : 'Create Email Template'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Welcome Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Welcome to GreenLane CRM!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Tabs defaultValue="editor" className="w-full">
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="border rounded-md p-4">
                <FormField
                  control={form.control}
                  name="htmlContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Content (HTML)</FormLabel>
                      <FormControl>
                        <textarea 
                          className="min-h-[400px] w-full p-4 font-mono text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="<html><body>Your email content here...</body></html>"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="preview" className="border rounded-md p-4 min-h-[400px]">
                <div className="bg-white rounded-md shadow-sm p-4">
                  <Preview value={previewHtml} />
                </div>
              </TabsContent>
            </Tabs>
            
            <CardFooter className="flex justify-end space-x-4 px-0">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} type="button">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (template ? "Updating..." : "Creating...") : (template ? "Update Template" : "Create Template")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Helper function to get a default HTML template
function getDefaultTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Email Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #ffffff;
    }
    .footer {
      background-color: #f9fafb;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GreenLane Cloud Solutions</h1>
    </div>
    <div class="content">
      <h2>Hello {{name}},</h2>
      <p>Welcome to GreenLane Cloud Solutions CRM. We're excited to have you on board!</p>
      <p>You can now start managing your customer relationships more effectively.</p>
      <p>
        <a href="{{loginUrl}}" class="button">Log In to Your Account</a>
      </p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The GreenLane Team</p>
    </div>
    <div class="footer">
      <p>© 2023 GreenLane Cloud Solutions. All rights reserved.</p>
      <p>You received this email because you signed up for GreenLane CRM.</p>
    </div>
  </div>
</body>
</html>`;
}

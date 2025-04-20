import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function TrialSuccess() {
  const [location, setLocation] = useLocation();
  
  // Get session ID from query param if available
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-white font-bold text-xl">GreenLane Cloud Solutions</div>
            <Button 
              variant="outline" 
              className="text-white border-white hover:bg-white/20"
              onClick={() => setLocation('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-3xl font-bold">Your Free Trial Has Started!</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Thank you for choosing GreenLane Cloud Solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-100 rounded-md p-6 text-center">
                  <p className="text-lg mb-2 font-medium">Your 14-day free trial is now active</p>
                  <p className="text-gray-600">
                    You'll receive an email with your login details and instructions to access your CRM.
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 mt-8">
                  <div className="bg-white p-4 rounded-md border">
                    <h3 className="font-medium text-lg mb-2">What's Next?</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Check your email for login instructions</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Set up your team members and account settings</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Import your existing customer data</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Explore your new CRM capabilities</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-4 rounded-md border">
                    <h3 className="font-medium text-lg mb-2">Need Help?</h3>
                    <p className="text-gray-600 mb-4">
                      Our support team is ready to assist you with any questions you might have about setting up or using your CRM.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.location.href = 'mailto:support@greenlanecloud.com'}
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button 
                    className="px-8" 
                    onClick={() => setLocation('/')}
                  >
                    Return to Homepage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>&copy; {new Date().getFullYear()} GreenLane Cloud Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
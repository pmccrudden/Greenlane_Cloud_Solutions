import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail, Calendar, ArrowRight } from 'lucide-react';

export default function TrialSuccessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-white font-bold text-xl">GreenLane Cloud Solutions</div>
            <Button variant="outline" className="text-white border-white hover:bg-white/20" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="mb-8 text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-3xl">Welcome to GreenLane CRM!</CardTitle>
                <CardDescription className="text-lg">Your 14-day free trial has started</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="mb-6 text-gray-600">
                  We're thrilled to have you on board! Your GreenLane CRM account has been successfully created, and your 14-day free trial has begun.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center mb-3">
                      <Mail className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Check Your Email</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      We've sent you an email with your login details and important information to help you get started.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center mb-3">
                      <Calendar className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Trial End Date</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Your trial will end on <span className="font-medium">{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>. After that, your selected plan will begin.
                    </p>
                  </div>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
                  <h3 className="font-bold text-lg mb-3">Next Steps</h3>
                  <ul className="space-y-4">
                    <li className="flex">
                      <div className="bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">1</div>
                      <div>
                        <h4 className="font-medium">Log in to your account</h4>
                        <p className="text-sm text-gray-600">Use the credentials we've sent to your email to log in to your GreenLane CRM account.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">2</div>
                      <div>
                        <h4 className="font-medium">Set up your company profile</h4>
                        <p className="text-sm text-gray-600">Complete your company profile to personalize your experience.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">3</div>
                      <div>
                        <h4 className="font-medium">Import your data</h4>
                        <p className="text-sm text-gray-600">Import your existing contacts, deals, and other data to get started quickly.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">4</div>
                      <div>
                        <h4 className="font-medium">Invite your team</h4>
                        <p className="text-sm text-gray-600">Add team members to collaborate on your CRM data.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button size="lg" className="w-full" asChild>
                  <a href="/signin">
                    Log in to Your Account <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:support@greenlanecloudsolutions.com">
                    Contact Support
                  </a>
                </Button>
              </CardFooter>
            </Card>
            
            <div className="text-center">
              <h3 className="font-medium mb-2">Need help getting started?</h3>
              <p className="text-gray-600 mb-4">
                Our team is here to help you make the most of your trial. Schedule a free onboarding call with our customer success team.
              </p>
              <Button variant="outline">Schedule Onboarding Call</Button>
            </div>
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
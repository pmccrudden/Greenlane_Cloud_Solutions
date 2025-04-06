import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { PieChart, Users, BarChart, Cloud, Mail, Layers, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.33 3.67a4 4 0 0 0-5.66 0L12 6.33 9.33 3.67a4 4 0 1 0-5.66 5.66L12 17.66l8.33-8.33a4 4 0 0 0 0-5.66z"/>
                </svg>
                <span className="ml-2 font-bold text-xl text-slate-800">GreenLane</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/signin">
                <a className="text-slate-600 hover:text-slate-900 font-medium">Sign In</a>
              </Link>
              <Link href="/signup">
                <a>
                  <Button>Sign Up</Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                <span className="block">Elevate your</span>
                <span className="block text-primary-600">customer relationships</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 sm:text-xl max-w-xl">
                GreenLane Cloud Solutions provides a comprehensive CRM platform that helps you manage accounts, contacts, deals, and projects all in one place.
              </p>
              <div className="mt-10 flex space-x-4">
                <Link href="/signup">
                  <a>
                    <Button size="lg" className="px-8 py-6 text-lg">
                      Start Free Trial
                    </Button>
                  </a>
                </Link>
                <Link href="/checkout">
                  <a>
                    <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                      One-time Payment
                    </Button>
                  </a>
                </Link>
                <a 
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-6 border border-transparent text-lg font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
              <div className="bg-white sm:max-w-md sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden shadow-xl">
                <img 
                  src="https://cdn.dribbble.com/users/1626229/screenshots/16358958/media/7e0a5a71b813197e9807c6ead7888482.jpg?compress=1&resize=1000x750&vertical=top" 
                  alt="CRM Dashboard Preview" 
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-4 max-w-2xl text-xl text-slate-500 lg:mx-auto">
              GreenLane Cloud Solutions provides a complete suite of tools to help you manage your customer relationships effectively.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard 
                icon={<Users className="h-8 w-8 text-primary-600" />}
                title="Multi-Tenant CRM"
                description="Isolated environments for each client with their own subdomain and secure data storage."
              />
              <FeatureCard 
                icon={<Layers className="h-8 w-8 text-primary-600" />}
                title="Hierarchical Accounts"
                description="Organize accounts in parent-child relationships for complex organizational structures."
              />
              <FeatureCard 
                icon={<BarChart className="h-8 w-8 text-primary-600" />}
                title="AI Analytics"
                description="Get AI-driven insights on account health, deal probability, and more."
              />
              <FeatureCard 
                icon={<CheckCircle className="h-8 w-8 text-primary-600" />}
                title="Support Ticket System"
                description="Manage customer support from multiple channels in one unified system."
              />
              <FeatureCard 
                icon={<Mail className="h-8 w-8 text-primary-600" />}
                title="Digital Journey"
                description="Create custom communication sequences with email templates and tasks."
              />
              <FeatureCard 
                icon={<Cloud className="h-8 w-8 text-primary-600" />}
                title="Cloud-Native"
                description="Built for the cloud, with reliability and scalability in mind."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Ready to transform your customer relationships?
              </h2>
              <p className="mt-4 text-lg text-primary-100">
                Sign up today and start your free trial. No credit card required for your first 14 days.
              </p>
              <div className="mt-8">
                <Link href="/signup">
                  <a>
                    <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                      Start Free Trial
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center">
              <img 
                src="https://cdn.dribbble.com/userupload/2499755/file/original-de06c5c5b9953e1807ce2298db77a02a.png?compress=1&resize=1024x768" 
                alt="CRM on multiple devices" 
                className="max-h-72 object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.33 3.67a4 4 0 0 0-5.66 0L12 6.33 9.33 3.67a4 4 0 1 0-5.66 5.66L12 17.66l8.33-8.33a4 4 0 0 0 0-5.66z"/>
              </svg>
              <span className="ml-2 font-bold text-xl text-white">GreenLane</span>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-base text-slate-400">
                &copy; {new Date().getFullYear()} GreenLane Cloud Solutions. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-slate-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{description}</p>
    </div>
  );
}

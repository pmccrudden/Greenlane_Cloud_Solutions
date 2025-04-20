import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, ChevronRight, Globe, Shield, Star, Users, Zap, Server, Mail, HeadphonesIcon } from 'lucide-react';

// Utility to format currency based on region
const formatCurrency = (amount: number, countryCode: string, currencyCode: string): string => {
  return new Intl.NumberFormat(countryCode, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

// Define regions for pricing
type Region = {
  id: string;
  name: string;
  currencyCode: string;
  countryCode: string;
  adjustment: number;
};

const regions: Region[] = [
  { id: 'us', name: 'United States', currencyCode: 'USD', countryCode: 'en-US', adjustment: 1.0 },
  { id: 'ca', name: 'Canada', currencyCode: 'CAD', countryCode: 'en-CA', adjustment: 1.05 },
  { id: 'uk', name: 'United Kingdom', currencyCode: 'GBP', countryCode: 'en-GB', adjustment: 1.10 },
  { id: 'eu', name: 'Europe', currencyCode: 'EUR', countryCode: 'en-EU', adjustment: 1.15 },
  { id: 'au', name: 'Australia', currencyCode: 'AUD', countryCode: 'en-AU', adjustment: 1.20 },
];

// Base pricing for the products
const basePricing = {
  coreCrm: 10, // per user per month
  communityAddOn: 50, // per month
  marketingHubAddOn: 75, // per month
  supportCentreAddOn: 30, // per month
};

export default function MarketingPage() {
  const [selectedRegion, setSelectedRegion] = useState<Region>(regions[0]);
  const [selectedUsers, setSelectedUsers] = useState(5);
  const [addCommunity, setAddCommunity] = useState(false);
  const [addMarketingHub, setAddMarketingHub] = useState(false);
  const [addSupportCentre, setAddSupportCentre] = useState(false);
  
  // Detect user's region (would normally use IP geolocation API)
  useEffect(() => {
    // This is just a mock implementation
    // In a real app, we would call an IP geolocation API
    const mockDetectRegion = async () => {
      // For demo purposes, we're using a random region
      const randomRegionIndex = Math.floor(Math.random() * regions.length);
      setSelectedRegion(regions[randomRegionIndex]);
    };
    
    mockDetectRegion();
  }, []);
  
  // Calculate total price
  const calculateTotal = () => {
    const corePrice = basePricing.coreCrm * selectedUsers;
    const communityPrice = addCommunity ? basePricing.communityAddOn : 0;
    const marketingPrice = addMarketingHub ? basePricing.marketingHubAddOn : 0;
    const supportPrice = addSupportCentre ? basePricing.supportCentreAddOn : 0;
    
    const subtotal = corePrice + communityPrice + marketingPrice + supportPrice;
    return subtotal * selectedRegion.adjustment;
  };
  
  // Format a price for display
  const formatPrice = (basePrice: number) => {
    const adjustedPrice = basePrice * selectedRegion.adjustment;
    return formatCurrency(adjustedPrice, selectedRegion.countryCode, selectedRegion.currencyCode);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-r from-primary/90 to-primary overflow-hidden py-16">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,white)]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center">
              <div className="text-white font-bold text-2xl mr-2">
                GreenLane
              </div>
              <div className="text-white/80">Cloud Solutions</div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6 text-white">
              <a href="#features" className="hover:text-white/80 transition">Features</a>
              <a href="#pricing" className="hover:text-white/80 transition">Pricing</a>
              <a href="#screenshots" className="hover:text-white/80 transition">Screenshots</a>
              <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30" asChild>
                <Link href="/signin">Log In</Link>
              </Button>
            </div>
          </nav>
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                  Streamline Your<br />Customer Relationships
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8">
                A powerful CRM solution designed to help businesses build stronger relationships, 
                close more deals, and deliver exceptional customer experiences.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8" asChild>
                  <Link href="/free-trial">Start Your 14-Day Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30">
                  Request a Demo
                </Button>
              </div>
              <div className="mt-6 text-white/70 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                <span className="text-sm">No credit card required for trial</span>
              </div>
            </div>
            
            <div className="md:w-1/2 relative">
              <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl p-4 md:ml-10">
                <div className="aspect-video bg-white/5 rounded-lg overflow-hidden relative">
                  {/* This would be a screenshot or demo video */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xl text-white/50">Dashboard Preview</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/70">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2 text-white" />
              <span>Easy Setup</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2 text-white" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2 text-white" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2 text-white" />
              <span>Regular Updates</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Companies/Social Proof Section */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 mb-8">Trusted by leading companies worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
            <div className="h-8 w-32 bg-gray-300 rounded"></div>
            <div className="h-8 w-32 bg-gray-300 rounded"></div>
            <div className="h-8 w-32 bg-gray-300 rounded"></div>
            <div className="h-8 w-32 bg-gray-300 rounded"></div>
            <div className="h-8 w-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Your Business</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your customer relationships effectively and grow your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Contact Management</CardTitle>
                <CardDescription>
                  Organize and track all your customer information in one place.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Centralized contact database</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Communication history tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Custom fields and tags</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Deal Tracking</CardTitle>
                <CardDescription>
                  Visualize and optimize your sales pipeline from start to finish.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Visual sales pipeline</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Deal stage automation</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Win probability forecasting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Analytics</CardTitle>
                <CardDescription>
                  Gain actionable insights with our advanced AI-powered analytics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Predictive deal analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Customer health scoring</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Automated task recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Community Platform</CardTitle>
                <CardDescription>
                  Build stronger relationships through an engaging community portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Branded discussion forums</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>User groups and categories</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Engagement analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Marketing Hub</CardTitle>
                <CardDescription>
                  Create, manage, and track marketing campaigns that convert.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Email campaign management</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Automated drip campaigns</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Campaign performance tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <HeadphonesIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Support Centre</CardTitle>
                <CardDescription>
                  Provide exceptional customer support through a dedicated portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Ticketing system</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Live chat integration</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>Knowledge base management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Screenshots Section */}
      <section id="screenshots" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See It in Action</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore how GreenLane Cloud Solutions can transform your customer relationships.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {/* Screenshot placeholder */}
              </div>
              <h3 className="text-xl font-bold mb-2">Unified Dashboard</h3>
              <p className="text-gray-600">Manage contacts, deals, and tasks in one place.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {/* Screenshot placeholder */}
              </div>
              <h3 className="text-xl font-bold mb-2">Engage Your Community</h3>
              <p className="text-gray-600">Build forums and groups to connect with customers.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {/* Screenshot placeholder */}
              </div>
              <h3 className="text-xl font-bold mb-2">Automate Marketing</h3>
              <p className="text-gray-600">Create email campaigns and drip sequences effortlessly.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {/* Screenshot placeholder */}
              </div>
              <h3 className="text-xl font-bold mb-2">Support Made Easy</h3>
              <p className="text-gray-600">Resolve issues with a ticketing system and live chat.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the package that works best for your business needs and budget.
            </p>
            
            <div className="mt-8 inline-flex p-1 bg-gray-100 rounded-lg">
              {regions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-md text-sm ${
                    selectedRegion.id === region.id
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8 border-b">
              <h3 className="text-2xl font-bold mb-2">Core CRM Package</h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{formatPrice(basePricing.coreCrm)}</span>
                <span className="text-gray-500 ml-2">/ user / month</span>
              </div>
              <p className="text-gray-600 mt-4">
                The foundation for your customer relationship management, with all the essential tools to manage contacts, deals, and tasks.
              </p>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="mb-8">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Number of Users: {selectedUsers}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={selectedUsers}
                  onChange={(e) => setSelectedUsers(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                  <span>30</span>
                  <span>40</span>
                  <span>50</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Community Add-On</h4>
                    <p className="text-sm text-gray-500">Discussion forums, user groups, engagement analytics</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-medium">{formatPrice(basePricing.communityAddOn)}</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={addCommunity}
                        onChange={() => setAddCommunity(!addCommunity)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary peer-focus:ring-4 peer-focus:ring-primary/20">
                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all duration-300 ${addCommunity ? 'translate-x-5' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Marketing Hub Add-On</h4>
                    <p className="text-sm text-gray-500">Email campaigns, drip campaigns, marketing automation</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-medium">{formatPrice(basePricing.marketingHubAddOn)}</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={addMarketingHub}
                        onChange={() => setAddMarketingHub(!addMarketingHub)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary peer-focus:ring-4 peer-focus:ring-primary/20">
                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all duration-300 ${addMarketingHub ? 'translate-x-5' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Support Centre Add-On</h4>
                    <p className="text-sm text-gray-500">Ticketing system, live chat, knowledge base</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-medium">{formatPrice(basePricing.supportCentreAddOn)}</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={addSupportCentre}
                        onChange={() => setAddSupportCentre(!addSupportCentre)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary peer-focus:ring-4 peer-focus:ring-primary/20">
                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all duration-300 ${addSupportCentre ? 'translate-x-5' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-2xl font-bold">{formatCurrency(calculateTotal(), selectedRegion.countryCode, selectedRegion.currencyCode)}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Billed monthly for {selectedUsers} users
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 w-full" asChild>
                  <Link href="/marketing/free-trial">Start Your 14-Day Free Trial</Link>
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  No credit card required. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. See what other businesses have achieved with GreenLane Cloud Solutions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">
                  "GreenLane Cloud Solutions has transformed how we manage our customer relationships. The interface is intuitive, and the AI-powered insights have helped us close 30% more deals."
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-300 mr-4"></div>
                  <div>
                    <h4 className="font-bold">Sarah Johnson</h4>
                    <p className="text-sm text-gray-500">Sales Director, TechCorp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">
                  "The Community add-on has been a game-changer for us. We've built a thriving community of users who share best practices and provide valuable feedback on our products."
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-300 mr-4"></div>
                  <div>
                    <h4 className="font-bold">Michael Chen</h4>
                    <p className="text-sm text-gray-500">CEO, Innovate Ltd</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">
                  "We switched from another CRM, and the difference is night and day. The Support Centre add-on has reduced our response time by 50% and increased customer satisfaction scores."
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-300 mr-4"></div>
                  <div>
                    <h4 className="font-bold">Emily Roberts</h4>
                    <p className="text-sm text-gray-500">Customer Success Manager, GrowthWave</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Have questions about GreenLane Cloud Solutions? Find answers to common questions below.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>What happens after the 14-day trial?</AccordionTrigger>
                <AccordionContent>
                  After your 14-day trial ends, you'll be automatically charged based on your selected plan unless you cancel. You can cancel at any time during the trial period through your account dashboard with no obligation.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I change my plan later?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can upgrade, downgrade, or adjust your plan at any time. Changes to your subscription will take effect on your next billing cycle. You can also add or remove add-ons as your business needs evolve.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>Is there a setup fee?</AccordionTrigger>
                <AccordionContent>
                  No, there are no setup fees or hidden charges. You only pay for the plan and add-ons you select. We believe in transparent pricing and providing value from day one.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I import data from another CRM?</AccordionTrigger>
                <AccordionContent>
                  Absolutely! We provide tools to easily import your existing customer data from most major CRM platforms. Our team can also provide assistance with data migration if needed.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>What kind of support is available?</AccordionTrigger>
                <AccordionContent>
                  All plans include email support with a 24-hour response time. For additional support options, including live chat and priority phone support, consider adding the Support Centre add-on to your subscription.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Customer Relationships?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of businesses that trust GreenLane Cloud Solutions for their CRM needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8" asChild>
              <Link href="/marketing/free-trial">Start Your 14-Day Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent hover:bg-white/10 border-white">
              Request a Demo
            </Button>
          </div>
          <p className="mt-6 text-white/70">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">GreenLane</div>
              <p className="text-gray-400 mb-4">
                Powerful CRM solutions designed to help businesses build stronger relationships, close more deals, and deliver exceptional customer experiences.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  {/* Facebook icon */}
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  {/* Twitter icon */}
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  {/* LinkedIn icon */}
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Tutorials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} GreenLane Cloud Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Accordion components (simplified)
function Accordion({ children, type, collapsible }: { children: React.ReactNode, type: string, collapsible: boolean }) {
  return <div className="space-y-4">{children}</div>;
}

function AccordionItem({ children, value }: { children: React.ReactNode, value: string }) {
  return <div className="border rounded-lg overflow-hidden">{children}</div>;
}

function AccordionTrigger({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center p-4 font-medium cursor-pointer">
      <h3 className="text-lg font-medium">{children}</h3>
      <ChevronRight className="h-5 w-5 transform rotate-90" />
    </div>
  );
}

function AccordionContent({ children }: { children: React.ReactNode }) {
  return <div className="p-4 pt-0 border-t">{children}</div>;
}
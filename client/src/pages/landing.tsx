import React, { useState } from 'react'; // Keep combined import
import { Button } from '@/components/ui/button'; // Keep single Button import
import { Input } from '@/components/ui/input'; // Keep single Input import
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/components/providers/SupabaseProvider'; // Import useSupabase

// Placeholder data - update with more specific details if available
const appName = 'Tempo';
const appDescription = 'Boost your productivity with Tempo, the ultimate tool for managing your focus sessions using the Pomodoro Technique and detailed analytics, and more.';
const features = [
  { name: 'Flexible Timers', description: 'Customize Pomodoro, short breaks, and long breaks.' },
  { name: 'Task Categories', description: 'Organize your work sessions by category.' },
  { name: 'Session Analytics', description: 'Track your focus time and productivity trends.' },
  { name: 'Cross-Platform Sync', description: 'Access your timer and stats anywhere (Pro).' },
];
const proTier = {
  name: 'Pro Tier',
  price: '$5/month',
  features: ['Advanced Analytics', 'Unlimited Categories', 'Cross-Platform Sync', 'Priority Support'],
};

const LandingPage: React.FC = () => {
  // Basic SEO - Consider using react-helmet or Next.js Head for better management
  React.useEffect(() => {
    document.title = `${appName} - Boost Productivity`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', appDescription);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = appDescription;
      document.head.appendChild(newMeta);
    }
  }, []);

  const { supabase } = useSupabase(); // Get Supabase client instance
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !newsletterEmail) return; // Ensure supabase client and email are available

    setIsSubmitting(true);
    console.log('Attempting to subscribe email:', newsletterEmail);

    try {
      // Attempt to insert the email. This will fail if the email already exists due to the UNIQUE constraint.
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: newsletterEmail });

      if (error) {
        // Check if the error is a unique constraint violation (code 23505)
        if (error.code === '23505') {
          toast({
            title: "Already Subscribed",
            description: "This email address is already on our list!",
          });
          // Optionally clear the input even if already subscribed
          setNewsletterEmail('');
        } else {
          // Handle other potential errors (RLS, network, etc.)
          console.error("Supabase newsletter signup error:", error);
          throw error; // Re-throw to be caught by the generic catch block below
        }
      } else {
        // If there's no error, the insert was successful
        toast({
          title: "Subscribed!",
          description: "Thanks for joining! Check your inbox for updates.",
        });
        setNewsletterEmail(''); // Clear input on success
      }
    } catch (error) {
      // Catch errors re-thrown from the 'if (error)' block above or other unexpected errors
      console.error("Newsletter signup failed:", error);
      toast({
        title: "Subscription Failed",
        description: "Could not subscribe. Please try again later.",
        variant: "destructive", // Add destructive variant here
      });
      // Do not clear email on generic failure
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // MainLayout only accepts 'children' prop
    <MainLayout>
      <div className="container mx-auto px-4 py-16 md:py-24 space-y-20 md:space-y-28">

        {/* Hero Section - Clean and focused */}
        <section className="text-center space-y-6 pt-8">
          {/* Optional: Placeholder for a simple logo or graphic */}
          {/* <img src="/placeholder-logo.svg" alt="App Logo" width="80" height="80" className="mx-auto mb-4" loading="lazy" /> */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">{appName}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{appDescription}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button size="lg" asChild className="shadow-sm hover:shadow-md transition-shadow">
              <a href="/register">Get Started Free</a>
            </Button>
            <Button size="lg" variant="secondary" asChild className="shadow-sm hover:shadow-md transition-shadow">
               <a href="/login">Login</a>
            </Button>
          </div>
           {/* Optional: Placeholder for a clean product screenshot or illustration */}
           {/* <img src="/placeholder-app.png" alt="Tempo Screenshot" width="700" height="400" className="mx-auto mt-12 rounded-md shadow-lg" loading="lazy" /> */}
        </section>

        {/* Features Section - Minimal cards */}
        <section id="features" className="space-y-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-center tracking-tight">Core Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature) => (
              // Use subtle card styling
              <Card key={feature.name} className="bg-card border shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-4">
                  {/* Optional: Icon placeholder */}
                  {/* <div className="w-10 h-10 bg-muted rounded-md mb-2"></div> */}
                  <CardTitle className="text-lg font-medium">{feature.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Subscription Tier Section - Clean layout */}
        <section id="pricing" className="space-y-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-center tracking-tight">Unlock Your Full Potential</h2>
          <div className="flex justify-center">
            {/* Single prominent Pro card */}
            <Card className="w-full max-w-lg border shadow-lg bg-gradient-to-br from-card to-secondary/30 dark:from-card dark:to-secondary/20">
              <CardHeader className="items-center text-center p-6 md:p-8">
                <CardTitle className="text-2xl md:text-3xl font-bold">{proTier.name}</CardTitle>
                <CardDescription className="text-3xl md:text-4xl font-extrabold text-primary pt-2">{proTier.price}</CardDescription>
                <p className="text-sm text-muted-foreground">per month, billed annually</p> {/* Or adjust based on actual pricing */}
              </CardHeader>
              <CardContent className="p-6 md:p-8 pt-0">
                <ul className="space-y-3 text-foreground/90 mb-8">
                  {proTier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      {/* Checkmark Icon Placeholder */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow" asChild>
                   <a href="/subscribe">Upgrade to Pro</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Newsletter Section - Simple and direct */}
        <section id="newsletter" className="space-y-6 text-center max-w-lg mx-auto py-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Stay Updated</h2>
          <p className="text-muted-foreground">Join our newsletter for product updates, tips, and occasional offers.</p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Input
              type="email"
              placeholder="your.email@example.com"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-grow shadow-sm"
              aria-label="Email for newsletter"
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting} className="shadow-sm">
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground pt-2">We respect your privacy. No spam.</p>
        </section>

      </div>
      {/* Consider adding a simple footer in MainLayout or here */}
    </MainLayout>
  );
};

export default LandingPage;

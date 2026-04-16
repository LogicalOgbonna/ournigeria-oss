import Link from "next/link";

export const metadata = {
  title: "Contact Us | OurNigeria",
  description: "Get in touch with the OurNigeria team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="mb-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              &larr; Back to Home
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Contact Us</h1>
            <p className="text-muted-foreground">
              Have questions, feedback, or want to partner with us? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <form action="mailto:support@ournigeria.ng" method="post" encType="text/plain" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    required
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  required
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="How can we help?"
                />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium">Message</label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows={4}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Your message..."
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors mt-2"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

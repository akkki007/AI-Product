import Link from "next/link"
import {
  Frame,
  Zap,
  Layers,
  CheckCircle,
  Gauge,
  Search,
  Lightbulb,
  MapPin,
  Phone,
  Clock,
  Twitter,
  Linkedin,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top banner */}
      <div className="bg-blue-700 text-white p-4 text-center relative">
        <p className="text-sm md:text-base">NEW We're upgrading our platform to MCP srver →</p>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Button variant="outline" size="sm" className="h-7 text-xs bg-white text-blue-700 hover:bg-gray-100">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
            Follow @Nexus
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Frame className="h-6 w-6" />
              <span className="font-bold text-xl">Nexus</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Login/Signup
              </Link>
              
              <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Mobile Navigation */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="#" className="w-full">
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/authentication" className="w-full">
                        Login/Signup
                      </Link>
                      </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="w-full">
                        Features
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="w-full">
                        About
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="#" className="w-full">
                        Contact
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop CTA Button */}
              <Link href="/authentication">
              <Button className="hidden md:inline-flex">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-5xl mx-auto leading-tight tracking-tighter mb-8">
            Transform Your Organization's Communication with AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            <span className="font-semibold text-foreground">Nexus</span> is a advanced chat platform that is powered
            using <span className="font-semibold text-foreground">Model Context Protocol</span>. It has been designed
            following Best Practices, SEO, Accessibility, Dark Mode, great Page Speed, image optimization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Get template
            </Button>
            <Button size="lg" variant="outline">
              Learn more
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background border-t py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-4">FEATURES</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">What you get with Nexus</h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
              Elevating Your Digital Presence: Discover the Synergies Unleashed in Our Platform's Core Strengths, from
              Seamless Integration to Open Collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Next.js + Tailwind CSS Integration</h3>
              <p className="text-muted-foreground">
                A seamless integration between two great frameworks that offer high productivity, performance and
                versatility.
              </p>
              <Link href="#" className="text-primary hover:text-primary/80 font-medium">
                Discover now
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Layers className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Ready-to-use Components</h3>
              <p className="text-muted-foreground">
                Widgets made with Tailwind CSS ready to be used in Marketing Websites, SaaS, Blogs, Personal Profiles,
                Small Business...
              </p>
              <Link href="#" className="text-primary hover:text-primary/80 font-medium">
                Discover now
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Best Practices</h3>
              <p className="text-muted-foreground">
                By prioritizing maintainability and scalability through coding standards and design principles, your
                website stays robust and efficient.
              </p>
              <Link href="#" className="text-primary hover:text-primary/80 font-medium">
                Discover now
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Gauge className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Excellent Page Speed</h3>
              <p className="text-muted-foreground">
                Having a good page speed impacts organic search ranking, improves user experience (UI/UX) and increase
                conversion rates.
              </p>
              <Link href="#" className="text-primary hover:text-primary/80 font-medium">
                Discover now
              </Link>
            </div>

            {/* Feature 5 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Search Engine Optimization (SEO)</h3>
              <p className="text-muted-foreground">
                Boost online visibility with our SEO-friendly website. Effective strategies and practices enhance your
                website's search engine ranking, making it easier
              </p>
              <Link href="#" className="text-primary hover:text-primary/80 font-medium">
                Discover now
              </Link>
            </div>

            {/* Feature 6 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Open to new ideas and contributions</h3>
              <p className="text-muted-foreground">
                We welcome new ideas and contributions to our platform. Whether you have feature suggestions, want to
                contribute code, or share insights, our
              </p>
              <Link href="#" className="text-primary hover:text-primary/80 font-medium">
                Discover now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">What our customers say about us</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Etiam sed odio et dolor auctor gravida. Curabitur tincidunt elit non risus pharetra sodales. Etiam sit
              amet mattis massa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <img src="/placeholder.svg?height=48&width=48" alt="Tayla Kirsten" className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-semibold">Tayla Kirsten</h4>
                  <p className="text-sm text-muted-foreground">Marketing Manager</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "I'm impressed by the speed and performance of these templates. My website now loads in the blink of an
                eye, significantly enhancing my visitors' exper..."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <img src="/placeholder.svg?height=48&width=48" alt="Silver Jordan" className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-semibold">Silver Jordan</h4>
                  <p className="text-sm text-muted-foreground">Senior Marketer</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "I had never found it so easy to customize a website. Nexus's templates are incredibly flexible, and
                with Tailwind CSS, I've managed to give my webs..."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <img src="/placeholder.svg?height=48&width=48" alt="Kelsey Arden" className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-semibold">Kelsey Arden</h4>
                  <p className="text-sm text-muted-foreground">Co-Founder & CEO</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "As a beginner in web development, I really needed clear guidance. Nexus made it possible. I was able to
                install and customize my website seamlessly..."
              </p>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <img src="/placeholder.svg?height=48&width=48" alt="Sarah Johnson" className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">Business Owner</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "They've not only saved me a ton of time but have also made my websites look incredibly professional.
                The level of detail and thought that went into c..."
              </p>
            </div>

            {/* Testimonial 5 */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <img src="/placeholder.svg?height=48&width=48" alt="Keith Young" className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-semibold">Keith Young</h4>
                  <p className="text-sm text-muted-foreground">Freelance Developer</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The clean code and integration with Next.js make my projects a breeze. Plus, the responsive design
                ensures that my clients' websites look amazing on a..."
              </p>
            </div>

            {/* Testimonial 6 */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <img src="/placeholder.svg?height=48&width=48" alt="Lisa Gordon" className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-semibold">Lisa Gordon</h4>
                  <p className="text-sm text-muted-foreground">Project Manager</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Their templates are not only stunning but also user-friendly. The support I received from their
                community has been exceptional. I'm proud to say that..."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Team Members</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Suspendisse in dui nibh. Donec enim leo, sodales et egestas id, malesuada non diam. Sed dapibus velit et
              mauris condimentum, vel imperdiet erat egestas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-8 mb-6 relative overflow-hidden">
                <img
                  src="/placeholder.svg?height=200&width=200"
                  alt="3D Character"
                  className="w-full h-32 object-contain"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cindy Belcher</h3>
              <p className="text-muted-foreground">SEO Consultant</p>
            </div>

            {/* Team Member 2 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg p-8 mb-6 relative overflow-hidden">
                <img
                  src="/placeholder.svg?height=200&width=200"
                  alt="3D Character"
                  className="w-full h-32 object-contain"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Toby Foster</h3>
              <p className="text-muted-foreground">Marketing Tech</p>
            </div>

            {/* Team Member 3 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg p-8 mb-6 relative overflow-hidden">
                <img
                  src="/placeholder.svg?height=200&width=200"
                  alt="3D Character"
                  className="w-full h-32 object-contain"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Clark Bourne</h3>
              <p className="text-muted-foreground">Content Manager</p>
            </div>

            {/* Team Member 4 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-8 mb-6 relative overflow-hidden">
                <img
                  src="/placeholder.svg?height=200&width=200"
                  alt="3D Character"
                  className="w-full h-32 object-contain"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Bella Chase</h3>
              <p className="text-muted-foreground">UX Designer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-4">CONTACT</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Get in Touch</h2>
            <p className="text-lg text-muted-foreground">In hac habitasse platea dictumst</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <p className="text-muted-foreground">
                Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Duis nec
                ipsum orci. Ut scelerisque sagittis ante, ac tincidunt sem venenatis ut.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Our Address</h3>
                    <p className="text-muted-foreground">1230 Maecenas Street Donec Road</p>
                    <p className="text-muted-foreground">New York, EEUU</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Contact</h3>
                    <p className="text-muted-foreground">Mobile: +1 (123) 456-7890</p>
                    <p className="text-muted-foreground">Mail: Nexus@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Working hours</h3>
                    <p className="text-muted-foreground">Monday - Friday: 08:00 - 17:00</p>
                    <p className="text-muted-foreground">Saturday & Sunday: 08:00 - 12:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card p-8 rounded-lg border shadow-sm">
              <h3 className="text-2xl font-semibold mb-6">Ready to Get Started?</h3>
              <form className="space-y-6">
                <div>
                  <Input placeholder="Your name" className="bg-background" />
                </div>
                <div>
                  <Input type="email" placeholder="Your email address" className="bg-background" />
                </div>
                <div>
                  <Textarea placeholder="Write your message..." rows={4} className="bg-background" />
                </div>
                <Button className="w-full">Send Message</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Background Image Section */}
      <div className="relative h-64 w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/placeholder.svg?height=400&width=1200')",
            opacity: 0.8,
          }}
        ></div>
      </div>
    </div>
  )
}

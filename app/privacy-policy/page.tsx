import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, Lock, Users, Mail, Calendar, FileText, AlertCircle } from "lucide-react"

const PrivacyPolicy = () => {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Welcome to our AI-powered platform. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our services. We are committed to protecting your privacy and
            ensuring transparency in our data practices.
          </p>
          <p className="text-gray-700 leading-relaxed">
            By using our services, you agree to the collection and use of information in accordance with this policy.
          </p>
        </div>
      ),
    },
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: Eye,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Name, email address, and contact information
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Account credentials and profile information
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Payment and billing information
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Usage Data</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Interactions with our AI services and features
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Usage patterns, preferences, and settings
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Device information and technical data
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "information-usage",
      title: "How We Use Your Information",
      icon: Users,
      content: (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Service Provision</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Deliver and maintain our AI services</li>
              <li>• Process your requests and transactions</li>
              <li>• Provide customer support</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Improvement & Personalization</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Enhance and optimize our services</li>
              <li>• Personalize your user experience</li>
              <li>• Develop new features and capabilities</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Communication</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Send important updates and notifications</li>
              <li>• Respond to your inquiries</li>
              <li>• Share relevant product information</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Legal & Security</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Comply with legal obligations</li>
              <li>• Protect against fraud and abuse</li>
              <li>• Ensure platform security</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "data-protection",
      title: "Data Protection & Security",
      icon: Lock,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Our Security Commitment</h4>
                <p className="text-blue-800 text-sm">
                  We implement industry-standard security measures including encryption, secure data centers, and
                  regular security audits to protect your information.
                </p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Lock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <h5 className="font-medium text-gray-900 mb-1">Encryption</h5>
              <p className="text-sm text-gray-600">End-to-end encryption for data in transit and at rest</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Shield className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <h5 className="font-medium text-gray-900 mb-1">Access Control</h5>
              <p className="text-sm text-gray-600">Strict access controls and authentication protocols</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <h5 className="font-medium text-gray-900 mb-1">Monitoring</h5>
              <p className="text-sm text-gray-600">24/7 security monitoring and threat detection</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "your-rights",
      title: "Your Rights & Choices",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">You have several rights regarding your personal information:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <Badge variant="outline" className="mr-3 mt-0.5">
                  Access
                </Badge>
                <span className="text-sm text-gray-700">Request access to your personal data</span>
              </div>
              <div className="flex items-start">
                <Badge variant="outline" className="mr-3 mt-0.5">
                  Correction
                </Badge>
                <span className="text-sm text-gray-700">Update or correct inaccurate information</span>
              </div>
              <div className="flex items-start">
                <Badge variant="outline" className="mr-3 mt-0.5">
                  Deletion
                </Badge>
                <span className="text-sm text-gray-700">Request deletion of your data</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <Badge variant="outline" className="mr-3 mt-0.5">
                  Portability
                </Badge>
                <span className="text-sm text-gray-700">Export your data in a portable format</span>
              </div>
              <div className="flex items-start">
                <Badge variant="outline" className="mr-3 mt-0.5">
                  Opt-out
                </Badge>
                <span className="text-sm text-gray-700">Withdraw consent for data processing</span>
              </div>
              <div className="flex items-start">
                <Badge variant="outline" className="mr-3 mt-0.5">
                  Restriction
                </Badge>
                <span className="text-sm text-gray-700">Limit how we process your information</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      title: "Contact Information",
      icon: Mail,
      content: (
        <div className="space-y-6">
          <p className="text-gray-700 leading-relaxed">
            If you have any questions about this Privacy Policy or wish to exercise your rights, please don't hesitate
            to contact us:
          </p>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Email Support</h4>
                <a
                  href="mailto:aniket@techonsy.com"
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  aniket@techonsy.com
                </a>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Response Time</h4>
                <p className="text-gray-700 text-sm">We typically respond to privacy inquiries within 48 hours</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Your privacy is important to us. This policy explains how we handle your personal information with
            transparency and care.
          </p>
          <div className="flex items-center justify-center mt-6">
            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
          </div>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Table of Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-2">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                >
                  <section.icon className="h-4 w-4 text-gray-500 mr-3" />
                  <span className="text-gray-700">
                    {index + 1}. {section.title}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={section.id} id={section.id} className="scroll-mt-8">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 bg-gray-100 rounded-lg mr-4">
                    <section.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  {index + 1}. {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>{section.content}</CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              This privacy policy is effective as of {lastUpdated} and will remain in effect except with respect to any
              changes in its provisions in the future.
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="/terms" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="/cookies" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                Cookie Policy
              </a>
              <a href="/contact" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy

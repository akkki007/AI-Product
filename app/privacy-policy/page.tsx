import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            
            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-4">
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI product.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                <ul className="list-disc ml-6 mb-4">
                    <li>Personal information you provide (name, email, etc.)</li>
                    <li>Usage data and interaction with our AI services</li>
                    <li>Technical information about your device and connection</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc ml-6 mb-4">
                    <li>To provide and improve our AI services</li>
                    <li>To personalize your experience</li>
                    <li>To communicate with you about updates and changes</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Data Protection</h2>
                <p className="mb-4">
                    We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
                <p className="mb-4">
                    If you have questions about this Privacy Policy, please contact us at: <br />
                    <a href="mailto:contact@example.com" className="text-blue-600 hover:underline">
                        contact@example.com
                    </a>
                </p>
            </section>

            <footer className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
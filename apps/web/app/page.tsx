"use client";
import { Button } from '@/components/ui/button';
import { FiShield, FiMessageCircle, FiUsers } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import "./globals.css";

export default function Home() {
  const router = useRouter();
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col justify-between">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">MessagePunk</h1>
          <div className="space-x-4">
            <Button variant="outline" onClick={()=>router.push("/sign-in")}>Login</Button>
            <Button variant={"default"} onClick={()=>router.push("/sign-in")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-24">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-extrabold">Chat with Confidence</h1>
          <p className="mt-4 text-lg">End-to-end encryption, real-time messaging, and group chat—everything you need in a secure chat app.</p>
          <div className="mt-8">
            <Button className="px-6 py-3 text-lg font-semibold" variant={"default"} onClick={()=>router.push("/sign-in")} >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-12">Why Choose MessagePunk?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1: Multiple Device Support */}
            <div className="flex flex-col items-center">
              <FiShield className="text-blue-500 text-5xl mb-4" />
              <h3 className="text-xl font-semibold">Multiple Device Support</h3>
              <p className="mt-2 text-gray-600">Access your messages on any device, securely and seamlessly.</p>
            </div>

            {/* Feature 2: Real-time Messaging */}
            <div className="flex flex-col items-center">
              <FiMessageCircle className="text-green-500 text-5xl mb-4" />
              <h3 className="text-xl font-semibold">Real-time Messaging</h3>
              <p className="mt-2 text-gray-600">Stay connected with friends and family, no matter where you are.</p>
            </div>

            {/* Feature 3: Group Chats */}
            <div className="flex flex-col items-center">
              <FiUsers className="text-purple-500 text-5xl mb-4" />
              <h3 className="text-xl font-semibold">Group Chats</h3>
              <p className="mt-2 text-gray-600">Collaborate easily with groups and share files, messages, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4">Experience secure, real-time communication with MessagePunk.</p>
          <div className="mt-8">
            <Button className="px-6 py-3 text-lg font-semibold bg-white text-blue-600" variant={"default"}>
              Join Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} MessagePunk. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

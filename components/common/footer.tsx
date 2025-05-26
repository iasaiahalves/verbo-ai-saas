export default function Footer() {
  return (
    <footer className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Verbo</h3>
            <p className="text-gray-600 text-sm">
              AI-powered PDF summarization for efficient knowledge extraction.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Links</h3>
            <ul className="space-y-2">              <li><a href="/" className="text-gray-600 hover:text-rose-500 transition-colors">Home</a></li>
              <li><a href="/pricing" className="text-gray-600 hover:text-rose-500 transition-colors">Pricing</a></li>
              <li><a href="/sign-in" className="text-gray-600 hover:text-rose-500 transition-colors">Sign In</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <p className="text-gray-600 text-sm">
              Have questions? Contact our support team.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              support@verbo.ai
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Verbo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
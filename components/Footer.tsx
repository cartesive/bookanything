export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">BookAnything</h3>
            <p className="text-sm text-gray-600">
              A simple, flexible booking system for any venue or service. 
              Perfect for small businesses and community organizations.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Features</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>Easy calendar interface</li>
              <li>Flexible time slots</li>
              <li>Simple embed code</li>
              <li>No server required</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Get Started</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><a href="/demo" className="hover:text-blue-600 transition-colors">View Demo</a></li>
              <li><a href="/admin" className="hover:text-blue-600 transition-colors">Admin Panel</a></li>
              <li><a href="/embed" className="hover:text-blue-600 transition-colors">Get Embed Code</a></li>
              <li><a href="https://github.com/cartesive/bookanything" className="hover:text-blue-600 transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} BookAnything. Open source booking system.
          </p>
        </div>
      </div>
    </footer>
  );
}
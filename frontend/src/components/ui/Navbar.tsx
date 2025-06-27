import { Link } from 'react-router-dom';
import { Button } from "../shadcn/button";
import { AuthStatus, useAuth } from '../../contexts/AuthenticationProvider';

export default function Navbar() {
  const {authState} = useAuth()

  return (
    <nav className="sticky top-0 bg-neutral-950 border-b border-neutral-800 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500">
            ViralVault
          </Link>
        </div>
        <div className="hidden md:flex space-x-4">
        </div>
        {
          authState.status === AuthStatus.UNAUTHENTICATED && <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/authentication?mode=login" className="text-gray-200 hover:text-white">
                Log in
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20" asChild>
              <Link to="/authentication?mode=sign-up">Sign up</Link>
            </Button>
          </div>
        }
        {
          authState.status === AuthStatus.AUTHENTICATED && <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard" className="text-gray-200 hover:text-white">Dashboard</Link>
            </Button>
          </div>
        }
        {
          authState.status === AuthStatus.LOADING && <div className="hidden md:flex space-x-2">
            <p className='text-white text-bold'>Loading...</p>
          </div>
        }
      </div>
    </nav>
  );
}
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleRoleSelection = (role: 'parent' | 'child') => {
    // Pass the selected role in the URL state so the login page knows which one it is
    navigate('/login', { state: { role } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-8">Welcome to Cura</h1>
      <p className="mb-6 text-lg">Please select your role to continue:</p>
      <div className="flex gap-4">
        <button 
          onClick={() => handleRoleSelection('parent')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          I am a Parent
        </button>
        <button 
          onClick={() => handleRoleSelection('child')}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          I am a Child
        </button>
      </div>
    </div>
  );
}
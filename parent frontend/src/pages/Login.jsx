import { useNavigate } from "react-router-dom"
function Login() {
    const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#bde0fe] via-[#e9d5ff] to-[#ba9fe7] flex items-center justify-center p-10">

      {/* MAIN CONTAINER */}
      <div className="w-[1200px] h-[700px] bg-white/30 backdrop-blur-xl rounded-[45px] border border-white/40 shadow-2xl overflow-hidden flex">

        {/* LEFT SECTION */}
        <div className="w-1/2 relative">

          {/* PLACEHOLDER IMAGE */}
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
            alt="login visual"
            className="w-full h-full object-cover"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-purple-900/20"></div>

          {/* TEXT */}
          <div className="absolute bottom-12 left-12 text-white">

            <h1 className="text-5xl font-bold mb-4">
              CURA
            </h1>

            <p className="text-lg w-[350px] text-purple-100">
              AI-powered digital wellbeing and safety platform for families.
            </p>

          </div>

        </div>

        {/* RIGHT SECTION */}
        <div className="w-1/2 bg-white/40 backdrop-blur-lg flex flex-col justify-center px-24">

          {/* SMALL LOGO */}
          <p className="text-purple-500 text-lg mb-2">
            Welcome Back
          </p>

          <h1 className="text-6xl font-bold text-purple-800 mb-14">
            cura
          </h1>

          {/* USERNAME */}
          <div className="mb-8">

            <label className="text-purple-700 text-sm mb-2 block">
              Username
            </label>

            <input
              type="text"
              placeholder="Enter username"
              className="w-full p-5 rounded-2xl bg-white/70 outline-none border border-purple-100 focus:border-purple-400 text-purple-900 shadow-md"
            />

          </div>

          {/* PASSWORD */}
          <div className="mb-10">

            <label className="text-purple-700 text-sm mb-2 block">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              className="w-full p-5 rounded-2xl bg-white/70 outline-none border border-purple-100 focus:border-purple-400 text-purple-900 shadow-md"
            />

          </div>

          {/* BUTTON */}
          <button 
          onClick={() => navigate("/dashboard")}
          className="w-full bg-gradient-to-r from-[#ba9fe7] to-[#c084fc] hover:scale-[1.02] transition-all duration-300 text-white font-semibold py-5 rounded-2xl shadow-xl">

            Login

          </button>

          {/* LINKS */}
          <div className="flex justify-between mt-8 text-sm text-purple-700">

            <p className="cursor-pointer hover:underline">
              Create account
            </p>

            <p className="cursor-pointer hover:underline">
              Forgot password?
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Login
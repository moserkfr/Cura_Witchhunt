import children from "../data/children"

import {
  LayoutDashboard,
  Bell,
  Shield,
  Activity,
  Settings,
} from "lucide-react"

function Sidebar({
  activePage,
  setActivePage,
  selectedChild,
  setSelectedChild,
  onLogout,
}) {

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <LayoutDashboard size={17} />,
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: <Activity size={17} />,
    },
    {
      id: "alerts",
      title: "Alerts",
      icon: <Bell size={17} />,
    },
    {
      id: "safety",
      title: "Safety Status",
      icon: <Shield size={17} />,
    },
    {
      id: "settings",
      title: "Settings",
      icon: <Settings size={17} />,
    },
  ]

  return (

    <div className="w-[255px] h-full bg-gradient-to-b from-[#9b87f5] via-[#a78bfa] to-[#93c5fd] border-r border-white/20 px-4 py-5 flex flex-col">

      {/* LOGO */}
      <div className="mb-6">

        <h1 className="text-4xl font-black text-white tracking-tight leading-none">
          cura
        </h1>

        <p className="text-white/70 text-[10px] tracking-[0.25em] mt-2">
          The Guard that never Sleeps
        </p>

      </div>

      {/* CHILDREN */}
      <div className="mb-5">

        <div className="flex items-center justify-between mb-3">

          <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">
            Children
          </p>

          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white">

            {children.length}

          </div>

        </div>

        <div className="space-y-2.5">

          {children.map((child) => (

            <div
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`cursor-pointer rounded-[18px] px-3 py-2.5 transition-all duration-300 ${
                selectedChild.id === child.id
                  ? "bg-white/35 shadow-lg"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >

              <div className="flex items-center gap-3">

                {/* AVATAR */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#bde0fe] to-[#d8b4fe] flex items-center justify-center text-sm font-bold text-purple-900">

                  {child.name.charAt(0)}

                </div>

                {/* TEXT */}
                <div className="flex-1">

                  <h3 className="text-white font-semibold text-sm leading-none">
                    {child.name}
                  </h3>

                  <p className="text-white/75 text-[11px] mt-1">
                    Age {child.age}
                  </p>

                </div>

              </div>

              {/* STATUS */}
              <div className="mt-2 flex justify-between items-center">

                <span className="text-[9px] uppercase tracking-wider text-white/60">
                  Risk
                </span>

                <div className={`px-2 py-[3px] rounded-full text-[9px] font-semibold ${
                  child.risk === "Safe"
                    ? "bg-blue-200 text-blue-900"
                    : child.risk === "High Risk"
                    ? "bg-red-200 text-red-900"
                    : "bg-purple-200 text-purple-900"
                }`}>

                  {child.risk}

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* NAVIGATION */}
      <div className="flex-1">

        <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 mb-3">
          Navigation
        </p>

        <div className="space-y-2">

          {menuItems.map((item) => (

            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-300 ${
                activePage === item.id
                  ? "bg-white text-purple-900 shadow-lg"
                  : "text-white/85 hover:bg-white/20"
              }`}
            >

              <div className={`${
                activePage === item.id
                  ? "text-[#7c3aed]"
                  : "text-white"
              }`}>

                {item.icon}

              </div>

              <span className="font-medium text-sm">
                {item.title}
              </span>

            </button>

          ))}

        </div>

      </div>

      {onLogout && (
        <button
          onClick={onLogout}
          className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-white/70 hover:bg-white/20 transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="font-medium text-sm">Log Out</span>
        </button>
      )}

    </div>

  )
}

export default Sidebar